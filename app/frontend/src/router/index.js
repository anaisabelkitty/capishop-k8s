// Configuración del router de Vue
// Define las rutas de la aplicación y qué componente carga cada una

import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Catalogo from '../views/Catalogo.vue'
import Producto from '../views/Producto.vue'
import Wishlist from '../views/Wishlist.vue'
import Checkout from '../views/Checkout.vue'

const routes = [
  // Página de inicio con el banner y los productos destacados
  {
    path: '/',
    name: 'home',
    component: Home
  },
  // Catálogo completo con los filtros de búsqueda
  {
    path: '/catalogo',
    name: 'catalogo',
    component: Catalogo
  },
  // Detalle de un producto, el :id viene en la URL
  {
    path: '/producto/:id',
    name: 'producto',
    component: Producto
  },
  // Lista de favoritos del usuario
  {
    path: '/wishlist',
    name: 'wishlist',
    component: Wishlist
  },
  // Carrito y confirmación del pedido
  {
    path: '/checkout',
    name: 'checkout',
    component: Checkout
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router