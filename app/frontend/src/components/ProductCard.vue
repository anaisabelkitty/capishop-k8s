<!-- Tarjeta de producto para el catálogo -->
<template>
  <div class="producto-card">
    <div class="imagen-contenedor" @click="verProducto">
      <img
        :src="`/images/productos/${producto.imagenes[0]}`"
        :alt="producto.nombre"
        class="producto-imagen"
      />
    </div>
    <div class="producto-info">
      <h3 class="producto-nombre" @click="verProducto">{{ producto.nombre }}</h3>
      <p class="producto-coleccion">{{ producto.coleccion }}</p>
      <p class="producto-precio">${{ producto.precio.toLocaleString() }} MXN</p>
      <div class="producto-acciones">
        <button
          class="btn-wishlist"
          @click="toggleWishlist"
          :class="{ activo: enWishlist }"
        >
          {{ enWishlist ? '❤️' : '🤍' }}
        </button>
        <button
          class="btn-carrito"
          @click="manejarAgregar"
          :disabled="producto.stock === 0"
        >
          {{ producto.stock === 0 ? 'Agotado' : producto.tallas.length > 0 ? 'Ver tallas' : 'Agregar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { agregarWishlist, eliminarWishlist } from '../api'

const props = defineProps({
  producto: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['agregado-carrito'])
const router = useRouter()

const sessionId = localStorage.getItem('sessionId') || (() => {
  const id = Math.random().toString(36).substring(2)
  localStorage.setItem('sessionId', id)
  return id
})()

const enWishlist = ref(false)

onMounted(() => {
  const wishlistLocal = JSON.parse(localStorage.getItem('wishlist') || '[]')
  enWishlist.value = wishlistLocal.includes(props.producto._id)
})

const verProducto = () => {
  router.push(`/producto/${props.producto._id}`)
}

const manejarAgregar = () => {
  if (props.producto.tallas.length > 0) {
    router.push(`/producto/${props.producto._id}`)
    return
  }
  const carrito = JSON.parse(localStorage.getItem('carrito') || '[]')
  const key = `${props.producto._id}-`
  const existente = carrito.find(item => item.key === key)
  if (existente) {
    existente.cantidad += 1
  } else {
    carrito.push({
      key,
      productoId: props.producto._id,
      cantidad: 1,
      nombre: props.producto.nombre,
      precio: props.producto.precio,
      imagen: props.producto.imagenes[0],
      talla: ''
    })
  }
  localStorage.setItem('carrito', JSON.stringify(carrito))
  emit('agregado-carrito')
  alert(`${props.producto.nombre} agregado al carrito`)
}

const toggleWishlist = async () => {
  try {
    const wishlistLocal = JSON.parse(localStorage.getItem('wishlist') || '[]')
    if (enWishlist.value) {
      await eliminarWishlist(sessionId, props.producto._id)
      const index = wishlistLocal.indexOf(props.producto._id)
      if (index > -1) wishlistLocal.splice(index, 1)
    } else {
      await agregarWishlist(sessionId, props.producto._id)
      wishlistLocal.push(props.producto._id)
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlistLocal))
    enWishlist.value = !enWishlist.value
  } catch (error) {
    console.error('Error al actualizar wishlist:', error)
  }
}
</script>

<style scoped>
.producto-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.producto-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
}

.imagen-contenedor {
  cursor: pointer;
  overflow: hidden;
  height: 220px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.producto-imagen {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 10px;
  transition: transform 0.3s;
}

.producto-imagen:hover {
  transform: scale(1.05);
}

.producto-info {
  padding: 15px;
}

.producto-nombre {
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  margin-bottom: 4px;
}

.producto-nombre:hover {
  color: #7c3aed;
}

.producto-coleccion {
  font-size: 0.8rem;
  color: #888;
  text-transform: capitalize;
  margin-bottom: 8px;
}

.producto-precio {
  font-size: 1.1rem;
  font-weight: 700;
  color: #7c3aed;
  margin-bottom: 12px;
}

.producto-acciones {
  display: flex;
  gap: 8px;
}

.btn-wishlist {
  background: none;
  border: 1px solid #e2e2e2;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.btn-wishlist.activo {
  border-color: #e53e3e;
}

.btn-carrito {
  flex: 1;
  background-color: #7c3aed;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn-carrito:hover:not(:disabled) {
  background-color: #6d28d9;
}

.btn-carrito:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>