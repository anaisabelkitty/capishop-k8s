# Aplicación CapiShop

Esta carpeta tiene el código de la tienda. Son dos proyectos separados: el
backend, que es una API REST en Node.js con Express y guarda todo en MongoDB, y
el frontend, que es una SPA en Vue 3 que consume esa API. Cada uno tiene su
propio `Dockerfile` y se publica como imagen en Docker Hub.

Aquí explico cómo está armada la app por dentro: qué endpoints expone el backend,
qué variables de entorno usa, qué vistas tiene el frontend y cómo se conecta con
la API. El despliegue en Kubernetes va aparte, en [../k8s/README.md](../k8s/README.md).

## Estructura

```
app/
├── backend/
│   ├── Dockerfile          Imagen Node 18
│   ├── package.json        Dependencias del backend
│   ├── scripts/
│   │   └── seed.js         Carga los productos iniciales en Mongo
│   └── src/
│       ├── index.js        Punto de entrada, levanta Express
│       ├── db.js           Conexión a MongoDB con reintentos
│       └── routes/
│           ├── productos.js   Modelo y endpoints de productos
│           ├── wishlist.js    Favoritos por sesión
│           └── checkout.js    Pedido, descuento de stock y alerta Slack
└── frontend/
    ├── Dockerfile          Build multietapa Node 20 + Nginx
    ├── nginx.conf          Config de Nginx para servir la SPA
    ├── index.html          HTML base donde monta Vue
    └── src/
        ├── main.js         Arranca Vue y el router
        ├── api.js          Cliente axios hacia el backend
        ├── App.vue         Componente raíz (NavBar + router-view)
        ├── router/index.js Rutas de la SPA
        ├── components/     NavBar y ProductCard
        └── views/          Home, Catalogo, Producto, Wishlist, Checkout
```

## Backend

### Tecnologías

Salen del `package.json`. El backend corre con Node y usa:

- express `^4.18.2` para la API REST.
- mongoose `^7.6.3` para hablar con MongoDB.
- cors `^2.8.5` para permitir las llamadas del frontend.
- dotenv `^16.3.1` para leer variables de entorno en local.
- nodemon `^3.0.1` solo en desarrollo, para recargar al guardar.

El script `start` corre `node src/index.js` y el de `dev` usa nodemon.

### Cómo arranca

`src/index.js` levanta Express, activa CORS y el parseo de JSON, llama a la
conexión de Mongo y registra las rutas. El puerto sale de `PORT` y por defecto es
3000. La conexión a Mongo está en `src/db.js`, que si falla reintenta cada 5
segundos, así el pod no se cae si Mongo todavía no está listo.

### Endpoints

Los saqué directo de `src/routes/`. Todos cuelgan de `/api`.

Productos (`productos.js`):

- `GET /api/productos` — lista los productos. Acepta filtros por query:
  `coleccion`, `categoria`, `talla` y `color`. Siempre filtra por `disponible: true`.
- `GET /api/productos/:id` — trae un producto por su id. Si no existe regresa 404.

Wishlist (`wishlist.js`):

- `GET /api/wishlist/:sessionId` — trae los favoritos de esa sesión.
- `POST /api/wishlist` — agrega un producto. Body: `{ sessionId, productoId }`.
- `DELETE /api/wishlist/:sessionId/:productoId` — quita un producto.

Checkout (`checkout.js`):

- `POST /api/checkout` — procesa el pedido. Body:
  `{ sessionId, productos: [{ productoId, cantidad, talla }] }`.
- `GET /api/checkout/:sessionId` — trae los pedidos de esa sesión.

Salud:

- `GET /health` — responde `{ status: "ok", mensaje: "CapiShop backend funcionando" }`.
  Lo usan las probes de liveness y readiness en Kubernetes.

### Modelos en MongoDB

- Producto: `nombre`, `descripcion`, `precio`, `coleccion` (perros, gatos,
  roedores, aves, acuaticos, exoticos), `categoria` (arnes, correa, cama, ropa,
  snack, rascador, juguete, jaula, rueda, pecera, decoracion, terrario, tazon,
  transportadora), `tallas`, `stockPorTalla`, `colores`, `imagenes`, `stock`,
  `disponible`.
- Wishlist: `sessionId`, `productos` (referencias a Producto), `creadoEn`.
- Pedido: `sessionId`, `productos` (producto, cantidad, talla), `total`,
  `estado` (pendiente, confirmado, cancelado), `creadoEn`.

### Cómo funciona el checkout

El POST de checkout abre una transacción de Mongoose, así que si algo falla a
medias no se descuenta stock de forma incompleta. Por eso necesita el replica
set: las transacciones de MongoDB solo trabajan sobre un replica set, no sobre un
nodo suelto. Luego recorre cada producto del carrito, revisa que haya stock (y
stock por talla si aplica), lo descuenta y, si un producto llega a cero, lo marca
como `disponible: false`.

Además, cuando una compra deja el stock de un producto en 5 o menos, hace dos
cosas: imprime un log en JSON con `msg: "stock bajo"` (que recoge Loki) y manda
una alerta al webhook de Slack. La función de alerta vive en el mismo
`checkout.js`.

### Variables de entorno

- `PORT` — puerto del servidor. Por defecto 3000 (lo lee `src/index.js`).
- `MONGODB_URI` — cadena de conexión a Mongo. Si no está definida usa
  `mongodb://localhost:27017/capishop` para desarrollo local (la leen `db.js` y
  `scripts/seed.js`).
- `SLACK_WEBHOOK_URL` — webhook de Slack para la alerta de stock bajo (la lee
  `checkout.js`). En el cluster se inyecta desde un secret.

### Seed de datos

`scripts/seed.js` se conecta a Mongo, borra los productos viejos e inserta el
catálogo completo. La lista trae productos de las seis colecciones con sus
precios, tallas, stock por talla y nombres de imagen. Se corre una sola vez; en
Kubernetes va como Job.

### Imagen Docker

El `Dockerfile` parte de `node:18-slim`, copia primero el `package.json` para
aprovechar el caché, instala dependencias de producción, copia el resto del
código, expone el 3000 y arranca con `node src/index.js`. La imagen se publica
como `isabelkitty/capishop-backend`.

## Frontend

### Tecnologías

Salen del `package.json`. El frontend es una SPA hecha con:

- vue `^3.5.32`, usando la Composition API con `<script setup>`.
- vue-router `^5.0.4` para las rutas.
- axios `^1.16.1` para llamar al backend.
- vite `^8.0.8` como bundler, con `@vitejs/plugin-vue`.

Pide Node `^20.19.0 || >=22.12.0`. Los scripts son `dev` (vite), `build`
(vite build) y `preview`.

### Vistas

Están en `src/views/` y el router (`src/router/index.js`) las mapea con
`createWebHistory`:

- `/` → `Home.vue`: banner de bienvenida, las seis colecciones por tipo de
  mascota y unos productos destacados (toma dos de cada colección). Al hacer clic
  en una colección manda al catálogo ya filtrado.
- `/catalogo` → `Catalogo.vue`: todo el catálogo con un panel de filtros por
  colección, categoría y talla. Si llega con `?coleccion=` desde la home, aplica
  ese filtro al entrar.
- `/producto/:id` → `Producto.vue`: detalle del producto con galería de
  imágenes, selección de talla, stock disponible, botón de wishlist, botón de
  agregar al carrito y productos relacionados de la misma colección y categoría.
- `/wishlist` → `Wishlist.vue`: los favoritos guardados de la sesión.
- `/checkout` → `Checkout.vue`: el carrito, con cantidades, subtotal y total.
  Antes de confirmar revisa el stock de cada producto y luego manda el pedido al
  backend.

Los componentes compartidos están en `src/components/`: `NavBar.vue` es la barra
fija de arriba con el logo y los enlaces (Inicio, Catálogo, Wishlist, Carrito), y
`ProductCard.vue` es la tarjeta de producto que se repite en home, catálogo y
wishlist.

### Carrito y sesión

El carrito y la wishlist se manejan del lado del navegador con `localStorage`.
La app genera un `sessionId` aleatorio la primera vez y lo reutiliza, así la
wishlist y los pedidos quedan ligados a esa sesión sin necesidad de login.

### Conexión con el backend

La config de axios está en `src/api.js`. El cliente arma la `baseURL` a partir
de la URL del navegador:

- Si el host es `localhost`, apunta a `http://localhost:3000/api` (desarrollo
  local con el backend corriendo aparte).
- En cualquier otro caso, usa el mismo protocolo, host y puerto desde donde se
  cargó la página, más `/api`.

Por eso la app funciona completa cuando se entra por el Ingress
`https://capishop.local:31857`: ahí las llamadas a `/api` las enruta el Ingress
al backend. El archivo exporta funciones ya listas: `getProductos`,
`getProducto`, `getWishlist`, `agregarWishlist`, `eliminarWishlist`,
`procesarCheckout` y `getPedidos`.

### Imagen Docker

El `Dockerfile` es multietapa. En la primera usa `node:20-slim`, instala
dependencias y corre `npm run build` para generar los archivos estáticos. En la
segunda usa `nginx:alpine`, copia esos estáticos a `/usr/share/nginx/html` y
aplica `nginx.conf`. Esa config redirige todas las rutas a `index.html` para que
Vue Router funcione, sirve las imágenes de `/images/` con caché y activa gzip.
La imagen se publica como `isabelkitty/capishop-frontend`.

## Pruebas de demostración

Estas pruebas pegan directo al backend por su NodePort (30081), así que no
dependen del frontend ni del Ingress. El host es el master, 192.168.224.135.

Verificar que el backend está vivo. Debe responder el JSON de salud.

```bash
curl http://192.168.224.135:30081/health
```

Listar todos los productos. Debe regresar el catálogo en JSON.

```bash
curl http://192.168.224.135:30081/api/productos
```

Filtrar productos por colección. Debe regresar solo los de perros.

```bash
curl "http://192.168.224.135:30081/api/productos?coleccion=perros"
```

Filtrar por categoría. Debe regresar solo los arneses.

```bash
curl "http://192.168.224.135:30081/api/productos?categoria=arnes"
```

Traer un producto por id. Hay que tomar un `_id` real de la lista anterior y
ponerlo en la URL. Debe regresar ese producto.

```bash
curl http://192.168.224.135:30081/api/productos/<ID_DE_UN_PRODUCTO>
```

Agregar un producto a la wishlist de una sesión. Debe regresar la wishlist con
ese producto.

```bash
curl -X POST http://192.168.224.135:30081/api/wishlist \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo-123","productoId":"<ID_DE_UN_PRODUCTO>"}'
```

Consultar la wishlist de esa sesión. Debe regresar lo que se agregó.

```bash
curl http://192.168.224.135:30081/api/wishlist/demo-123
```

Procesar un pedido. Descuenta stock del producto indicado. Debe responder
`Pedido confirmado`. Si no hay stock suficiente responde un 400 con el detalle.

```bash
curl -X POST http://192.168.224.135:30081/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo-123","productos":[{"productoId":"<ID_DE_UN_PRODUCTO>","cantidad":1,"talla":""}]}'
```

Para probar la app completa desde el navegador (frontend llamando a la API), se
entra por el Ingress en `https://capishop.local:31857`, que es donde `/api` se
enruta al backend.
