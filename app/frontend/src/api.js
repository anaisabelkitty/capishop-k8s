// Configuración central de axios para conectarse al backend
// Usa el hostname del navegador para conectarse al backend por NodePort 30081
// Así funciona tanto en desarrollo local como en el cluster

import axios from 'axios'

const hostname = window.location.hostname
const protocol = window.location.protocol
const port = window.location.port

const api = axios.create({
  baseURL: hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : `${protocol}//${hostname}${port ? ':' + port : ''}/api`
})

// Productos
// Trae la lista de productos, le puedo pasar filtros por query
export const getProductos = (filtros = {}) => api.get('/productos', { params: filtros })
// Trae un solo producto por su id
export const getProducto = (id) => api.get(`/productos/${id}`)

// Wishlist
// Trae la wishlist de una sesión
export const getWishlist = (sessionId) => api.get(`/wishlist/${sessionId}`)
// Agrega un producto a la wishlist de esa sesión
export const agregarWishlist = (sessionId, productoId) =>
  api.post('/wishlist', { sessionId, productoId })
// Quita un producto de la wishlist
export const eliminarWishlist = (sessionId, productoId) =>
  api.delete(`/wishlist/${sessionId}/${productoId}`)

// Checkout
// Manda el carrito al backend para confirmar el pedido y descontar stock
export const procesarCheckout = (sessionId, productos) =>
  api.post('/checkout', { sessionId, productos })
// Trae los pedidos que ya hizo una sesión
export const getPedidos = (sessionId) => api.get(`/checkout/${sessionId}`)

export default api