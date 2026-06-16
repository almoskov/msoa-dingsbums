# Garden Distribution Platform (MSA)

Ez a repository egy 3 mikroszervizes rendszer alap kodbazisa, amely megfelel a kovetelmenyeknek:

- legalabb 3 mikroszerviz
- jol elvalasztott service boundary-k
- Database per service minta
- service-enkenti Docker image epites
- Kubernetes deployment egysegek
- konfiguracios (ConfigMap) es titkos (Secret) adatok kezelese
- legalabb 2 kulon ingress
- Azure + k3s manualis kitelepitesi leiras

## Service boundary-k

1. `product-service`
- Felelosseg: termekek, kategoriak, arazasi adatok
- DB: sajat SQLite adatbazis (`products_db.sqlite`)

2. `inventory-service`
- Felelosseg: keszlet, foglalas, keszletvisszaadas
- DB: sajat SQLite adatbazis (`inventory_db.sqlite`)

3. `order-service`
- Felelosseg: rendeleskezeles, product + inventory orchestration
- DB: sajat SQLite adatbazis (`orders_db.sqlite`)

## Database per service megfeleles

Mindharom service teljesen kulon adatbazist hasznal, kulon kodbazis-reszben, kulon kontenerben, kulon PV mounttal Kubernetesben.

## Lokalis futtatas

```bash
npm run install-all
npm run dev
```

## Docker

Service-enkenti Dockerfile elerheto:

- `services/product-service/Dockerfile`
- `services/inventory-service/Dockerfile`
- `services/order-service/Dockerfile`

Build:

```bash
npm run docker:build
```

Compose futtatas:

```bash
npm run docker:up
```

## Kubernetes

Kubernetes manifestek a `k8s/` mappaban:

- namespace
- configmap
- secret
- 3 deployment + service + pvc
- 2 kulon ingress (`product`, `order`)

Deploy:

```bash
kubectl apply -k k8s
```

## Konfiguracios es titkos adatok

- Olvashato konfiguracio: `k8s/configmap.yaml`
- Titkos adatok: `k8s/secret.yaml` (placeholder), productionben CLI/secret manager javasolt

## Ingress kovetelmeny teljesitese

- `k8s/product-ingress.yaml`
- `k8s/order-ingress.yaml`

Az `inventory-service` szandekosan belso, csak clusteren belul elerheto (`ClusterIP`).

## Azure kitelepites (manualis lepesek)

Reszletes leiras: `AZURE_K3S_KITELEPITES.md`

Ez tartalmazza:

- 2 VM-es Azure setup
- k3s server + agent install
- image push folyamat
- secret kezeles biztonsagosan
- manifest telepites
- ingress host konfiguracio