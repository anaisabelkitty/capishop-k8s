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
