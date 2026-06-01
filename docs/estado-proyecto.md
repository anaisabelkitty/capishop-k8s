## Estado del proyecto — 01-06-2026

Fase actual: Fase 4 completada — Storage NFS
Último paso completado: servidor NFS configurado en el master, CSI Driver instalado, StorageClass nfs-csi activa y verificada
Próximo paso: Fase 5 — Aplicación: frontend + backend + base de datos

Entorno:
- Alumna: Ana Isabel Díaz Bautista
- Proyecto: CapiShop — Tienda de Mascotas y Accesorios
- Repo: https://github.com/anaisabelkitty/capishop-k8s
- Sistema operativo de las VMs: Rocky Linux 9.7
- Nodos: 1 master + 2 workers
- Herramienta de instalación del cluster: kubeadm
- Red de pods: Flannel CNI
- Servidor NFS: montado en el master — IP 192.168.224.135
- Backend: Node.js
- Informe técnico: Google Docs, se adjunta al repo al final
- Manual de funcionamiento: Google Docs, se hace al final cuando todo esté desplegado

IPs del cluster:
- capishop-master01: 192.168.224.135
- capishop-worker01: 192.168.224.136
- capishop-worker02: 192.168.224.137

Fases del proyecto:
- Fase 1 — Repositorio GitHub ✅
- Fase 2 — Creación de VMs ✅
- Fase 3 — Cluster Kubernetes (kubeadm + Flannel) ✅
- Fase 4 — Storage: NFS + PV + PVC + StorageClass ✅
- Fase 5 — Aplicación: frontend + backend + base de datos
- Fase 6 — Monitoreo: Prometheus + Grafana
- Fase 7 — Logs: Loki + Grafana
- Fase 8 — CI/CD: Tekton + ArgoCD
- Fase 9 — Demo de actualización en vivo
- Fase 10 — Documentación final

Requisitos del proyecto (del instructor):
- R1: cluster funcional, mínimo 1 master + 2 workers, Rocky Linux 9, kubeadm + Flannel
- R2: PV / PVC / StorageClass con NFS, provisioner automático
- R3: tienda con frontend + backend + BD, datos persisten al reiniciar pods
- R4: Prometheus + Grafana, dashboard con peticiones/segundo, latencia y errores
- R5: Loki + Grafana para logs
- R6: pipeline Tekton + ArgoCD sincronizando el cluster con el repo
- R7: demo en vivo de commit → build → deploy
- R8: presentación y defensa técnica, cualquier integrante responde cualquier componente

Notas:
- El proyecto se trabaja desde casa, no hay servidor NFS externo
- La red del cluster cambia entre casa y laboratorio, las IPs pueden cambiar
- Windsurf se usa más adelante, se indica en qué fase