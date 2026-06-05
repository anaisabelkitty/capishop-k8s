// Configuración central de axios para conectarse al backend
// Usa el hostname del navegador para conectarse al backend por NodePort 30081
// Así funciona tanto en desarrollo local como en el cluster

import axios from 'axios'

const protocol = window.location.protocol
const hostname = window.location.hostname

const api = axios.create({
  baseURL: hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : `${protocol}//${hostname}:30081/api`
})

// Productos
export const getProductos = (filtros = {}) => api.get('/productos', { params: filtros })
export const getProducto = (id) => api.get(`/productos/${id}`)

// Wishlist
export const getWishlist = (sessionId) => api.get(`/wishlist/${sessionId}`)
export const agregarWishlist = (sessionId, productoId) =>
  api.post('/wishlist', { sessionId, productoId })
export const eliminarWishlist = (sessionId, productoId) =>
  api.delete(`/wishlist/${sessionId}/${productoId}`)

// Checkout
export const procesarCheckout = (sessionId, productos) =>
  api.post('/checkout', { sessionId, productos })
export const getPedidos = (sessionId) => api.get(`/checkout/${sessionId}`)

export default api