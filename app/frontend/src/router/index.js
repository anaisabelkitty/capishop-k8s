// Configuración del router de Vue
// Define las rutas de la aplicación y qué componente carga cada una

import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Catalogo from '../views/Catalogo.vue'
import Producto from '../views/Producto.vue'
import Wishlist from '../views/Wishlist.vue'
import Checkout from '../views/Checkout.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/catalogo',
    name: 'catalogo',
    component: Catalogo
  },
  {
    path: '/producto/:id',
    name: 'producto',
    component: Producto
  },
  {
    path: '/wishlist',
    name: 'wishlist',
    component: Wishlist
  },
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