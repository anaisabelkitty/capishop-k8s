# Despliegue en Kubernetes

Esta carpeta tiene todo lo necesario para levantar CapiShop en un cluster de
Kubernetes, desde la instalación del cluster con Ansible hasta el canary release
con Argo Rollouts. Los pasos van en orden: cada uno deja lista la base para el
siguiente.

La app y su código se explican en [../app/README.md](../app/README.md). La vista
general del proyecto está en [el README raíz](../README.md). Aquí me concentro en
la infraestructura y el despliegue.

Los comandos asumen que el repo está clonado en el master, en `~/capishop-k8s`, y
que se ejecutan desde la raíz del repo salvo que diga otra cosa.

## Requisitos previos

Antes de aplicar los manifiestos de esta carpeta hace falta tener:

- Las tres VMs con Rocky Linux 9.7 y acceso SSH desde el master.
- Ansible instalado en el master para correr el playbook del PASO 1.
- Un servidor NFS exportando `/srv/nfs/capishop` desde 192.168.224.135 (lo usa la
  StorageClass del PASO 2).
- El driver CSI de NFS (`nfs.csi.k8s.io`) instalado en el cluster.

Estos componentes se instalan en el cluster pero sus manifiestos no están en el
repo, así que hay que tenerlos antes de los pasos que los usan:

- ingress-nginx y cert-manager (para el PASO 6).
- Tekton Pipelines y la CLI `tkn`, más ArgoCD (para el PASO 10).
- Argo Rollouts y su plugin de kubectl (para el PASO 11).

## Estructura de subcarpetas

```
k8s/
├── ansible/      Inventario y playbook para instalar el cluster
├── app/          Namespace, backend, frontend, mongodb y seed-job
├── mongodb/      Variante de MongoDB con auth y keyfile (ver nota en PASO 4)
├── storage/      StorageClass de NFS
├── quota/        ResourceQuotas de capishop y monitoring
├── network/      NetworkPolicies 01 a 08
├── ingress/      ClusterIssuer e Ingress con TLS
├── monitoring/   Prometheus, Grafana, node-exporter, kube-state-metrics
├── logging/      Loki y Promtail
├── cicd/         Tasks, Pipeline y PipelineRun de Tekton, y Application de ArgoCD
└── canary/       Rollout del backend con Argo Rollouts
```

## PASO 1 — Cluster con Ansible

El cluster se arma con el playbook `ansible/k8s-install.yml` y el inventario
`ansible/hosts.ini`. El playbook copia `/etc/hosts` a todos los nodos, prepara
cada nodo (desactiva swap y SELinux, carga módulos del kernel, configura sysctl),
instala containerd, kubelet, kubeadm y kubectl, inicializa el master con
`kubeadm init` y une los workers con el token de join.

Correr el playbook desde la carpeta ansible. Al final el master queda
inicializado y los dos workers unidos.

```bash
ansible-playbook -i hosts.ini k8s-install.yml
```

Verificar que los tres nodos están en el cluster. Se esperan los tres en Ready.

```bash
kubectl get nodes -o wide
```

> Nota sobre la red: el playbook instala Flannel como CNI. Los datos del entorno
> indican que el cluster en vivo usa Canal, que es Flannel más Calico. El detalle
> importa porque Flannel solo no aplica NetworkPolicies; quien las hace cumplir es
> Calico. Por eso, para que funcionen las policies del PASO 7, el cluster necesita
> el componente de Calico además de Flannel. Lo aclaro porque el playbook por sí
> mismo deja solo Flannel.

## PASO 2 — StorageClass NFS

`storage/storageclass-nfs.yaml` crea la StorageClass `nfs-csi` y la deja como
clase por defecto. Usa el provisioner `nfs.csi.k8s.io`, apunta al servidor NFS
192.168.224.135 y al export `/srv/nfs/capishop`. Cada PVC genera su propio
subdirectorio dentro del NFS, así que el aprovisionamiento es dinámico.

Aplicar la StorageClass.

```bash
kubectl apply -f k8s/storage/storageclass-nfs.yaml
```

Verificar que quedó como clase por defecto. Debe aparecer `nfs-csi` con
`(default)` al lado.

```bash
kubectl get storageclass
```

## PASO 3 — Namespace y ResourceQuotas

`app/namespace.yaml` crea el namespace `capishop`. Las ResourceQuotas de
`quota/` ponen topes de CPU, memoria, pods y PVCs en `capishop` y en `monitoring`
(2 CPU y 2Gi de requests, 4 CPU y 4Gi de limits, 20 pods y 10 PVCs cada uno). El
namespace `monitoring` hay que crearlo aparte ya que no hay un archivo para él en
el repo.

Crear el namespace de la app.

```bash
kubectl apply -f k8s/app/namespace.yaml
```

Crear el namespace de monitoreo, que usa la quota de monitoring.

```bash
kubectl create namespace monitoring
```

Aplicar las dos ResourceQuotas.

```bash
kubectl apply -f k8s/quota/
```

Verificar las quotas del namespace capishop. Debe mostrar los topes y el uso.

```bash
kubectl get resourcequota -n capishop
```

## PASO 4 — MongoDB Replica Set

`app/mongodb.yaml` levanta MongoDB en el namespace `capishop` como StatefulSet de
tres réplicas (`mongodb-0`, `mongodb-1`, `mongodb-2`) en replica set `rs0`. Trae
dos services: `mongodb-headless` (clusterIP None, le da DNS propio a cada pod para
que el replica set se arme) y `mongodb` (para que el backend se conecte por
nombre). Cada réplica pide su disco de 1Gi en `nfs-csi`. El replica set es lo que
permite que el checkout del backend use transacciones.

Aplicar MongoDB.

```bash
kubectl apply -f k8s/app/mongodb.yaml
```

Esperar a que los tres pods estén listos. Se esperan mongodb-0, 1 y 2 en Running.

```bash
kubectl get pods -n capishop -l app=mongodb
```

Iniciar el replica set una sola vez. Esto no está en un archivo del repo, así que
es un paso manual. Los nombres de los miembros salen de la `MONGODB_URI` del
backend y del service headless. Debe responder `{ ok: 1 }`.

```bash
kubectl exec -it mongodb-0 -n capishop -- mongosh --eval '
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongodb-0.mongodb-headless.capishop.svc.cluster.local:27017" },
    { _id: 1, host: "mongodb-1.mongodb-headless.capishop.svc.cluster.local:27017" },
    { _id: 2, host: "mongodb-2.mongodb-headless.capishop.svc.cluster.local:27017" }
  ]
})'
```

Ver el estado del replica set. Debe mostrar un PRIMARY y dos SECONDARY.

```bash
kubectl exec -it mongodb-0 -n capishop -- mongosh --eval "rs.status().members.map(m => ({name: m.name, state: m.stateStr}))"
```

> Nota sobre la otra carpeta de Mongo: en `k8s/mongodb/` hay una segunda versión
> de MongoDB (secret, service y statefulset) que corre en el namespace `default`,
> con `mongo:7.0`, autenticación, keyfile y discos de 5Gi. Es una variante más
> endurecida, pero no es la que usa la app: la `MONGODB_URI` del backend apunta a
> `mongodb-headless.capishop`, que corresponde a `k8s/app/mongodb.yaml`. Por eso
> aquí documento la de `capishop` como la del despliegue. Si se quisiera usar la
> de `default`, habría que cambiar la `MONGODB_URI` del backend y la credencial.

## PASO 5 — Backend, Frontend y seed-job

`app/backend.yaml` y `app/frontend.yaml` despliegan la app. El backend corre con
2 réplicas, expone el 3000 por dentro y el NodePort 30081 por fuera, tiene probes
de liveness y readiness contra `/health` y recibe la `MONGODB_URI` del replica set
y el `SLACK_WEBHOOK_URL` desde un secret. El frontend también corre con 2 réplicas
y expone el NodePort 30080. El `app/seed-job.yaml` corre el script `seed.js` con
la imagen del backend para llenar Mongo con los productos.

Crear el secret de Slack que usa el backend. Sin él, el pod del backend no
arranca porque la variable viene de este secret. Hay que poner el webhook real.

```bash
kubectl create secret generic slack-secret \
  --from-literal=SLACK_WEBHOOK_URL='<URL_DEL_WEBHOOK_DE_SLACK>' \
  -n capishop
```

Aplicar backend y frontend.

```bash
kubectl apply -f k8s/app/backend.yaml
kubectl apply -f k8s/app/frontend.yaml
```

Correr el seed para cargar los productos.

```bash
kubectl apply -f k8s/app/seed-job.yaml
```

Ver que el job de seed terminó. Debe aparecer como Complete.

```bash
kubectl get job capishop-seed -n capishop
```

Ver los logs del backend en tiempo real. Sirve para confirmar que conectó a Mongo.

```bash
kubectl logs -l app=capishop-backend -n capishop --tail=30
```

## PASO 6 — Ingress con TLS

`ingress/01-clusterissuer.yaml` crea un ClusterIssuer de cert-manager que emite
certificados autofirmados. `ingress/02-ingress.yaml` crea el Ingress
`capishop-ingress` en el namespace `capishop` para el host `capishop.local`:
manda `/api` al service del backend (3000) y todo lo demás al frontend (80). El
certificado se guarda en el secret `capishop-tls`.

Aplicar el ClusterIssuer y el Ingress.

```bash
kubectl apply -f k8s/ingress/01-clusterissuer.yaml
kubectl apply -f k8s/ingress/02-ingress.yaml
```

Verificar que el Ingress quedó con su host y su TLS. Debe listar `capishop.local`.

```bash
kubectl get ingress -n capishop
```

Verificar que cert-manager ya emitió el certificado. Debe estar en True.

```bash
kubectl get certificate -n capishop
```

Para entrar desde el navegador hay que mapear el host en la máquina cliente,
apuntando `capishop.local` a 192.168.224.135. Luego se entra a
`https://capishop.local:31857`.

## PASO 7 — NetworkPolicies

La carpeta `network/` tiene ocho policies que arman el modelo de seguridad de red:

- `01-default-deny.yaml` — bloquea todo el tráfico en el namespace `default` y
  solo deja salir DNS.
- `02-allow-frontend-to-backend.yaml` — deja al frontend hablar con el backend en
  el 3000.
- `03-allow-backend-to-mongodb.yaml` — deja al backend entrar a Mongo en el 27017.
- `04-allow-dns.yaml` — reabre la salida de DNS para todos los pods.
- `05-allow-backend-egress.yaml` — salida del backend hacia Mongo y DNS.
- `06-allow-ingress.yaml` — deja al ingress-nginx entrar al frontend (80) y al
  backend (3000).
- `07-allow-capishop-to-mongodb.yaml` — deja al namespace capishop y al backend
  llegar a Mongo.
- `08-allow-capishop-egress.yaml` — salida del backend del namespace `capishop`
  hacia `default` y DNS.

Aplicar todas las policies.

```bash
kubectl apply -f k8s/network/
```

Ver las policies del namespace capishop. Debe listar al menos la de egress (08).

```bash
kubectl get networkpolicy -n capishop
```

Ver las policies del namespace default.

```bash
kubectl get networkpolicy -n default
```

> Nota importante sobre los namespaces: las policies 01 a 07 están escritas para
> el namespace `default`, y la 08 para `capishop`. La app corre en `capishop`, así
> que para que el default-deny y las reglas apliquen a los pods de la app debe
> existir también un default-deny en `capishop`. Tal como están los archivos, la
> mayoría protege `default`. Conviene revisarlo antes de la demo del pod intruso,
> sobre todo porque, como dije en el PASO 1, las policies solo se hacen cumplir si
> el cluster tiene Calico.

## PASO 8 — Monitoreo Prometheus y Grafana

La carpeta `monitoring/` arma el stack de métricas en el namespace `monitoring`:

- Prometheus: Deployment con su ConfigMap, PVC de 5Gi y RBAC propio. Retiene 7
  días de métricas. Scrapea cada 15s. Sus targets son los tres node-exporter
  (9100), kube-state-metrics (8080), el API server y los nodos. Se expone en el
  NodePort 30900.
- node-exporter: DaemonSet, un pod por nodo, con tolerancia para correr también
  en el master. Saca métricas del sistema en el 9100.
- kube-state-metrics: Deployment más Service y RBAC. Expone el estado de los
  objetos de Kubernetes en el 8080.
- Grafana: Deployment con PVC de 2Gi. Se expone en el NodePort 30300. La
  contraseña de admin se pone por variable de entorno.

Aplicar todo el stack de monitoreo.

```bash
kubectl apply -f k8s/monitoring/
```

Ver que los pods de monitoreo están arriba. Se esperan prometheus, grafana,
kube-state-metrics y un node-exporter por nodo.

```bash
kubectl get pods -n monitoring
```

Entrar a Prometheus en `http://192.168.224.135:30900` y a Grafana en
`http://192.168.224.135:30300` (usuario admin, contraseña admin123).

Estas son las consultas que uso en Prometheus. La primera muestra los contenedores
corriendo en capishop.

```promql
kube_pod_container_status_running{namespace="capishop"}
```

Cuántas veces se han reiniciado los contenedores de capishop.

```promql
kube_pod_container_status_restarts_total{namespace="capishop"}
```

Uso de CPU de los nodos, sin contar el tiempo ocioso.

```promql
rate(node_cpu_seconds_total{mode!="idle"}[1m])
```

## PASO 9 — Logs Loki y Promtail

La carpeta `logging/` arma el stack de logs, también en `monitoring`:

- Loki: Deployment con su ConfigMap y PVC de 5Gi. Junta y guarda los logs.
  Escucha en el 3100 por un Service ClusterIP interno.
- Promtail: DaemonSet, un pod por nodo, con tolerancia para el master y su RBAC.
  Lee los logs de los pods desde `/var/log`, los etiqueta con namespace, pod y
  container, y se los manda a Loki en `http://loki.monitoring.svc:3100`.

Aplicar el stack de logging.

```bash
kubectl apply -f k8s/logging/
```

Ver que Loki y los Promtail están arriba. Se espera un Loki y un Promtail por nodo.

```bash
kubectl get pods -n monitoring -l 'app in (loki, promtail)'
```

Loki se consulta desde Grafana agregándolo como fuente de datos
(`http://loki.monitoring.svc:3100`). Esta es la query que uso para ver la alerta
de stock bajo que imprime el backend.

```logql
{namespace="capishop"} |= "stock bajo"
```

## PASO 10 — CI/CD Tekton y ArgoCD

La carpeta `cicd/` tiene el pipeline de Tekton y la Application de ArgoCD.

Tekton (namespace `tekton-pipelines`):

- `task-git-clone.yaml` — clona el repo en un workspace compartido.
- `task-build-push.yaml` — construye una imagen con Kaniko y la sube a Docker Hub.
  Las credenciales vienen del secret `docker-credentials`.
- `pipeline-build-deploy.yaml` — encadena: primero clona, luego construye en
  paralelo el backend y el frontend.
- `pipelinerun.yaml` — lanza el pipeline apuntando al repo y rama `develop`.

ArgoCD (namespace `argocd`):

- `argocd-application.yaml` — define la Application `capishop`, que vigila la
  carpeta `k8s/app` del repo en la rama `develop` y sincroniza sola con selfHeal y
  prune activados.

Crear el secret con las credenciales de Docker Hub que usa Kaniko para el push.

```bash
kubectl create secret docker-registry docker-credentials \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=isabelkitty \
  --docker-password='<TOKEN_DE_DOCKER_HUB>' \
  -n tekton-pipelines
```

Registrar las tasks y el pipeline.

```bash
kubectl apply -f k8s/cicd/task-git-clone.yaml
kubectl apply -f k8s/cicd/task-build-push.yaml
kubectl apply -f k8s/cicd/pipeline-build-deploy.yaml
```

Lanzar un PipelineRun. El sed cambia el nombre del run para que no choque con uno
anterior; hay que sustituir la N por un número nuevo en cada ejecución.

```bash
sed 's/capishop-run-[0-9]*/capishop-run-N/' ~/capishop-k8s/k8s/cicd/pipelinerun.yaml | kubectl apply -f -
```

Seguir los logs del run en vivo. Debe terminar con el clone y los dos builds en
verde.

```bash
tkn pipelinerun logs capishop-run-N -f -n tekton-pipelines
```

Registrar la Application en ArgoCD para que sincronice la app sola.

```bash
kubectl apply -f k8s/cicd/argocd-application.yaml
```

Ver el estado de la Application. Debe quedar Synced y Healthy.

```bash
kubectl get application -n argocd
```

ArgoCD también tiene su panel en `https://192.168.224.135:32214` (usuario admin).

## PASO 11 — Canary Release con Argo Rollouts

`canary/01-rollout-backend.yaml` define un Rollout de Argo Rollouts para el
backend, en el namespace `capishop`, con 3 réplicas. La estrategia canary sube el
tráfico a la versión nueva en pasos: 10%, pausa de 30s, 50%, pausa de 30s y 100%.
El Rollout toma sus variables de un ConfigMap llamado `backend-config`.

Aplicar el Rollout.

```bash
kubectl apply -f k8s/canary/01-rollout-backend.yaml
```

Ver el estado del Rollout en vivo. Muestra las réplicas y en qué paso del canary va.

```bash
kubectl argo rollouts get rollout capishop-backend-rollout -n capishop --watch
```

Escalar el Rollout a 3 réplicas.

```bash
kubectl scale rollout capishop-backend-rollout --replicas=3 -n capishop
```

Disparar una actualización canary cambiando la imagen del backend. A partir de
aquí empieza el avance 10%, 50%, 100% con sus pausas.

```bash
kubectl argo rollouts set image capishop-backend-rollout backend=isabelkitty/capishop-backend:latest -n capishop
```

> Dos notas del Rollout. Primero: el `backend-config` que pide el Rollout con
> `envFrom` no está como archivo en el repo, así que hay que crear ese ConfigMap
> antes o los pods del Rollout no arrancarán. Segundo: el Rollout y el Deployment
> del backend (PASO 5) comparten el selector `app: capishop-backend`, así que son
> dos formas de manejar el mismo backend; para el canary se usa el Rollout en
> lugar del Deployment, no los dos a la vez.

## Demostraciones

### DEMO 1 — Persistencia de datos

Borrar el pod mongodb-0 y ver que, cuando vuelve, los datos siguen ahí porque
están en el PVC de NFS.

Borrar el pod. Kubernetes lo recrea solo por ser parte del StatefulSet.

```bash
kubectl delete pod mongodb-0 -n capishop
```

Cuando vuelva a Running, contar los productos. Debe seguir el mismo número que
antes de borrarlo.

```bash
kubectl exec -it mongodb-0 -n capishop -- mongosh capishop --eval "db.productos.countDocuments()"
```

### DEMO 2 — Elección de primario

Ver quién es el primario, borrarlo y comprobar que el replica set elige otro.

Ver el estado actual. Anotar cuál sale como PRIMARY.

```bash
kubectl exec -it mongodb-0 -n capishop -- mongosh --eval "rs.status().members.map(m => ({name: m.name, state: m.stateStr}))"
```

Borrar el pod primario (por ejemplo si es mongodb-0).

```bash
kubectl delete pod mongodb-0 -n capishop
```

Volver a ver el estado desde otro nodo. Debe haber un nuevo PRIMARY entre los que
quedaron.

```bash
kubectl exec -it mongodb-1 -n capishop -- mongosh --eval "rs.status().members.map(m => ({name: m.name, state: m.stateStr}))"
```

### DEMO 3 — NetworkPolicy: pod intruso

Levantar un pod que no es parte de la app e intentar llegar a Mongo. Con las
policies y Calico aplicando, la conexión no debe completarse.

```bash
kubectl run test-rogue --image=busybox -n capishop --rm -it -- sh
```

Dentro del pod, intentar alcanzar Mongo. Debe quedarse colgado o fallar, no
conectar.

```bash
wget -qO- mongodb:27017
```

### DEMO 4 — TLS real

Entrar desde el navegador a `https://capishop.local:31857` y mostrar el candado.
El certificado es el autofirmado que emitió cert-manager, guardado en el secret
`capishop-tls`. Antes hay que tener `capishop.local` mapeado a 192.168.224.135 en
la máquina cliente.

### DEMO 5 — Actualización en vivo

Hacer un commit a la rama `develop`, ver que Tekton construye las imágenes y que
ArgoCD las despliega solo.

Lanzar el pipeline tras el commit (igual que en el PASO 10).

```bash
sed 's/capishop-run-[0-9]*/capishop-run-N/' ~/capishop-k8s/k8s/cicd/pipelinerun.yaml | kubectl apply -f -
```

Seguir el build.

```bash
tkn pipelinerun logs capishop-run-N -f -n tekton-pipelines
```

Ver que ArgoCD sincroniza el cambio. Debe volver a Synced tras el push de la
imagen.

```bash
kubectl get application -n argocd
```

### DEMO 6 — Canary Release

Disparar la actualización canary y verla avanzar 10%, 50%, 100%.

Dejar la vista del rollout abierta.

```bash
kubectl argo rollouts get rollout capishop-backend-rollout -n capishop --watch
```

En otra terminal, lanzar la nueva imagen.

```bash
kubectl argo rollouts set image capishop-backend-rollout backend=isabelkitty/capishop-backend:latest -n capishop
```

### DEMO 7 — Observabilidad

Generar tráfico contra la API y verlo en Grafana y Loki.

Generar varias peticiones al backend.

```bash
for i in $(seq 1 20); do curl -s http://192.168.224.135:30081/api/productos > /dev/null; done
```

Luego, en Grafana, ver las métricas de Prometheus del PASO 8 y, en la fuente de
Loki, esta query para los logs de la app.

```logql
{namespace="capishop"} |= "stock bajo"
```

### DEMO 8 — Alerta Slack

Hacer un pedido que deje el stock de un producto en 5 o menos y ver la
notificación en el canal #alertas.

Primero buscar un producto con poco stock para que la compra cruce el umbral, o
comprar varias veces el mismo. Procesar el pedido contra el backend (con un
`productoId` real del catálogo).

```bash
curl -X POST http://192.168.224.135:30081/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo-slack","productos":[{"productoId":"<ID_DE_UN_PRODUCTO>","cantidad":1,"talla":""}]}'
```

Confirmar en los logs del backend que disparó la alerta. Debe aparecer la línea
con `stock bajo`.

```bash
kubectl logs -l app=capishop-backend -n capishop --tail=30 | grep "stock bajo"
```

> Aviso para esta demo: en `app/backend/src/routes/checkout.js` la función que
> manda la alerta arma la URL con la variable `SLACK_WEBHOOK`, que no está
> declarada (la declarada es `webhookUrl`, leída de `SLACK_WEBHOOK_URL`). Tal como
> está el código, ese punto lanzaría un error al intentar enviar a Slack. El log
> de "stock bajo" sí sale; el envío a Slack hay que revisarlo antes de la defensa.

## Respaldo y restauración de MongoDB

Si la base se ensucia o hay que volver al catálogo original, se reinicia el job de
seed. Como `seed.js` borra los productos viejos antes de insertar, deja la base
como al principio.

Borrar el job de seed anterior.

```bash
kubectl delete job capishop-seed -n capishop --force --grace-period=0
sleep 10
kubectl get job capishop-seed -n capishop
```

Volver a crear el job para que corra el seed de nuevo. (Como `seed-job.yaml` está
en `k8s/app` y ArgoCD sincroniza esa carpeta con selfHeal, también puede
recrearlo solo; este apply es la forma manual.)

```bash
kubectl apply -f k8s/app/seed-job.yaml
```

Ver que terminó. Debe quedar Complete.

```bash
kubectl get job capishop-seed -n capishop
```

## Troubleshooting

Errores comunes y cómo revisarlos.

Pods que no arrancan o se reinician. Ver el estado y el detalle de un pod para
leer los eventos al final.

```bash
kubectl get pods -n capishop
kubectl describe pod <NOMBRE_DEL_POD> -n capishop
```

Backend que no conecta a Mongo. Revisar sus logs; si el replica set no está
iniciado, el backend reintenta cada 5 segundos.

```bash
kubectl logs -l app=capishop-backend -n capishop --tail=30
```

PVC que no enlaza. Revisar el estado del PVC; debe estar Bound. Si está Pending,
suele ser la StorageClass o el NFS.

```bash
kubectl get pvc -n capishop
```

Certificado de TLS que no se emite. Revisar el certificate y el ClusterIssuer.

```bash
kubectl get certificate -n capishop
kubectl describe certificate capishop-tls -n capishop
```

Ingress que no responde. Ver el Ingress y los pods del controlador.

```bash
kubectl get ingress -n capishop
kubectl get pods -n ingress-nginx
```

Pipeline de Tekton que falla. Listar los runs y leer los logs del que falló.

```bash
tkn pipelinerun list -n tekton-pipelines
tkn pipelinerun logs <NOMBRE_DEL_RUN> -n tekton-pipelines
```

ArgoCD que no sincroniza. Ver el estado de la Application y su detalle.

```bash
kubectl get application -n argocd
kubectl describe application capishop -n argocd
```

### Recuperación tras reinicio de las VMs

Cuando se reinician las máquinas, a veces el ingress y el DNS interno quedan
raros. Reiniciarlos los deja en orden.

Reiniciar el controlador de ingress.

```bash
kubectl rollout restart deployment/ingress-nginx-controller -n ingress-nginx
```

Reiniciar CoreDNS.

```bash
kubectl rollout restart deployment/coredns -n kube-system
```
