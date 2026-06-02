<!-- Vista del catálogo de productos -->
<!-- Muestra todos los productos con filtros por colección, categoría, talla y color -->

<template>
  <div class="catalogo">
    <h1>Catálogo</h1>

    <div class="catalogo-contenido">
      <aside class="filtros">
        <h3>Filtros</h3>

        <div class="filtro-grupo">
          <label>Colección</label>
          <select v-model="filtros.coleccion" @change="filtrar">
            <option value="">Todas</option>
            <option value="perros">🐶 Perros</option>
            <option value="gatos">🐱 Gatos</option>
            <option value="roedores">🐹 Roedores</option>
            <option value="aves">🐦 Aves</option>
            <option value="acuaticos">🐠 Acuáticos</option>
            <option value="exoticos">🦎 Exóticos</option>
          </select>
        </div>

        <div class="filtro-grupo">
          <label>Categoría</label>
          <select v-model="filtros.categoria" @change="filtrar">
            <option value="">Todas</option>
            <option value="arnes">Arnés</option>
            <option value="correa">Correa</option>
            <option value="cama">Cama</option>
            <option value="ropa">Ropa</option>
            <option value="snack">Snack</option>
            <option value="rascador">Rascador</option>
            <option value="juguete">Juguete</option>
            <option value="jaula">Jaula</option>
            <option value="rueda">Rueda</option>
            <option value="pecera">Pecera</option>
            <option value="decoracion">Decoración</option>
            <option value="terrario">Terrario</option>
            <option value="tazon">Tazón</option>
            <option value="transportadora">Transportadora</option>
          </select>
        </div>

        <div class="filtro-grupo">
          <label>Talla</label>
          <select v-model="filtros.talla" @change="filtrar">
            <option value="">Todas</option>
            <option value="XS">XS</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
          </select>
        </div>

        <button class="btn-limpiar" @click="limpiarFiltros">
          Limpiar filtros
        </button>
      </aside>

      <div class="productos-contenido">
        <div v-if="cargando" class="cargando">Cargando productos...</div>
        <div v-else-if="productos.length === 0" class="sin-resultados">
          No se encontraron productos con esos filtros.
        </div>
        <div v-else>
          <p class="resultados-count">{{ productos.length }} productos encontrados</p>
          <div class="productos-grid">
            <ProductCard
              v-for="producto in productos"
              :key="producto._id"
              :producto="producto"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getProductos } from '../api'
import ProductCard from '../components/ProductCard.vue'

const route = useRoute()
const productos = ref([])
const cargando = ref(true)

const filtros = ref({
  coleccion: '',
  categoria: '',
  talla: ''
})

onMounted(async () => {
  // Si viene con filtro de colección desde la home lo aplica
  if (route.query.coleccion) {
    filtros.value.coleccion = route.query.coleccion
  }
  await filtrar()
})

// Detecta cambios en la URL para actualizar los filtros
watch(() => route.query, async (query) => {
  if (query.coleccion) {
    filtros.value.coleccion = query.coleccion
    await filtrar()
  }
})

const filtrar = async () => {
  cargando.value = true
  try {
    const params = {}
    if (filtros.value.coleccion) params.coleccion = filtros.value.coleccion
    if (filtros.value.categoria) params.categoria = filtros.value.categoria
    if (filtros.value.talla) params.talla = filtros.value.talla

    const response = await getProductos(params)
    productos.value = response.data
  } catch (error) {
    console.error('Error al filtrar productos:', error)
  } finally {
    cargando.value = false
  }
}

const limpiarFiltros = async () => {
  filtros.value = { coleccion: '', categoria: '', talla: '' }
  await filtrar()
}
</script>

<style scoped>
.catalogo h1 {
  font-size: 1.8rem;
  margin-bottom: 25px;
  color: #333;
}

.catalogo-contenido {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 30px;
}

.filtros {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  height: fit-content;
  position: sticky;
  top: 80px;
}

.filtros h3 {
  font-size: 1.1rem;
  margin-bottom: 20px;
  color: #333;
}

.filtro-grupo {
  margin-bottom: 16px;
}

.filtro-grupo label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 6px;
}

.filtro-grupo select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e2e2e2;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #333;
  background: white;
  cursor: pointer;
}

.btn-limpiar {
  width: 100%;
  padding: 10px;
  background: none;
  border: 1px solid #7c3aed;
  color: #7c3aed;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 8px;
  transition: background-color 0.2s;
}

.btn-limpiar:hover {
  background-color: #f5f0ff;
}

.resultados-count {
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 16px;
}

.productos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.cargando, .sin-resultados {
  text-align: center;
  padding: 60px;
  color: #888;
  font-size: 1rem;
}
</style>