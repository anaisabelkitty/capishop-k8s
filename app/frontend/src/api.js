// Configuración central de axios para conectarse al backend
// La URL base viene de la variable de entorno VITE_API_URL
// Si no está definida usa localhost para desarrollo local

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
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