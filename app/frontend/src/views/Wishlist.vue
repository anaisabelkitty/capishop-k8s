<!-- Vista de wishlist de CapiShop -->
<!-- Muestra los productos guardados como favoritos por el usuario -->

<template>
  <div class="wishlist">
    <h1>❤️ Mi Wishlist</h1>

    <div v-if="cargando" class="cargando">Cargando wishlist...</div>

    <div v-else-if="productos.length === 0" class="vacia">
      <p>Tu wishlist está vacía.</p>
      <router-link to="/catalogo" class="btn-ir-catalogo">
        Ver catálogo
      </router-link>
    </div>

    <div v-else>
      <p class="contador">{{ productos.length }} productos guardados</p>
      <div class="productos-grid">
        <ProductCard
          v-for="producto in productos"
          :key="producto._id"
          :producto="producto"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getWishlist, getProducto } from '../api'
import ProductCard from '../components/ProductCard.vue'

const productos = ref([])
const cargando = ref(true)

const sessionId = localStorage.getItem('sessionId') || (() => {
  const id = Math.random().toString(36).substring(2)
  localStorage.setItem('sessionId', id)
  return id
})()

onMounted(async () => {
  try {
    const response = await getWishlist(sessionId)
    // Carga los detalles de cada producto en la wishlist
    const promesas = response.data.productos.map(p =>
      getProducto(typeof p === 'string' ? p : p._id)
    )
    const resultados = await Promise.all(promesas)
    productos.value = resultados.map(r => r.data)
  } catch (error) {
    console.error('Error al cargar wishlist:', error)
  } finally {
    cargando.value = false
  }
})
</script>

<style scoped>
.wishlist h1 {
  font-size: 1.8rem;
  margin-bottom: 25px;
  color: #333;
}

.contador {
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 20px;
}

.productos-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.vacia {
  text-align: center;
  padding: 60px;
  color: #888;
}

.vacia p {
  font-size: 1.1rem;
  margin-bottom: 20px;
}

.btn-ir-catalogo {
  background: #7c3aed;
  color: white;
  padding: 12px 30px;
  border-radius: 25px;
  text-decoration: none;
  font-weight: 600;
}

.cargando {
  text-align: center;
  padding: 60px;
  color: #888;
}
</style>