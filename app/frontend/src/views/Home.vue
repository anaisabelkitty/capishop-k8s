<!-- Vista principal de CapiShop -->
<!-- Tiene el banner, las colecciones por tipo de mascota y los productos destacados -->
<template>
  <div class="home">
    <!-- Banner de bienvenida con botón al catálogo -->
    <section class="banner">
      <div class="banner-contenido">
        <h1>Bienvenido a CapiShop PROYECTO DEVOPS</h1>
        <p>Todo lo necesario para una mascota feliz.</p>
        <router-link to="/catalogo" class="btn-ver-catalogo">
          Ver catálogo
        </router-link>
      </div>
      <div class="banner-imagen">
        <img src="/images/banner-hero.png" alt="CapiShop mascotas" />
      </div>
    </section>

    <!-- Tarjetas de colección; al hacer clic filtra el catálogo por ese animal -->
    <section class="colecciones">
      <h2>¿Quién es tu mejor amigo?</h2>
      <div class="colecciones-grid">
        <div
          v-for="coleccion in colecciones"
          :key="coleccion.nombre"
          class="coleccion-card"
          :style="{ backgroundColor: coleccion.color }"
          @click="irAColeccion(coleccion.nombre)"
        >
          <span class="coleccion-emoji">{{ coleccion.emoji }}</span>
          <p>{{ coleccion.label }}</p>
        </div>
      </div>
    </section>

    <section class="productos-destacados">
      <h2>Productos destacados</h2>
      <div v-if="cargando" class="cargando">Cargando productos...</div>
      <div v-else class="productos-grid">
        <ProductCard
          v-for="producto in productosDestacados"
          :key="producto._id"
          :producto="producto"
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getProductos } from '../api'
import ProductCard from '../components/ProductCard.vue'

const router = useRouter()
const productosDestacados = ref([])
const cargando = ref(true)

const colecciones = [
  { nombre: 'perros', emoji: '🐶', label: 'Perros', color: '#F5E6D3' },
  { nombre: 'gatos', emoji: '🐱', label: 'Gatos', color: '#EAEAEA' },
  { nombre: 'roedores', emoji: '🐹', label: 'Roedores', color: '#FFE0C2' },
  { nombre: 'aves', emoji: '🐦', label: 'Aves', color: '#FFD6E8' },
  { nombre: 'acuaticos', emoji: '🐠', label: 'Acuáticos', color: '#D6EEFF' },
  { nombre: 'exoticos', emoji: '🦎', label: 'Exóticos', color: '#D6F5D6' }
]

// Al cargar trae unos cuantos productos de cada colección para los destacados
onMounted(async () => {
  try {
    const coleccionesNombres = ['perros', 'gatos', 'roedores', 'aves', 'acuaticos', 'exoticos']
    const resultados = await Promise.all(
      coleccionesNombres.map(c => getProductos({ coleccion: c }))
    )
    // Toma los 2 primeros de cada colección y los junta en una sola lista
    productosDestacados.value = resultados.flatMap(r => r.data.slice(0, 2))
  } catch (error) {
    console.error('Error al cargar productos:', error)
  } finally {
    cargando.value = false
  }
})

// Manda al catálogo ya filtrado por la colección elegida
const irAColeccion = (coleccion) => {
  router.push({ path: '/catalogo', query: { coleccion } })
}
</script>

<style scoped>
.banner {
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  border-radius: 16px;
  padding: 50px 40px;
  margin-bottom: 40px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
  min-height: 220px;
}

.banner-contenido {
  flex: 1;
}

.banner h1 {
  font-size: 2.2rem;
  margin-bottom: 10px;
  font-weight: 800;
}

.banner p {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 25px;
  opacity: 0.9;
}

.btn-ver-catalogo {
  background: white;
  color: #7c3aed;
  padding: 12px 30px;
  border-radius: 25px;
  text-decoration: none;
  font-weight: 700;
  font-size: 1rem;
  transition: transform 0.2s;
  display: inline-block;
}

.btn-ver-catalogo:hover {
  transform: scale(1.05);
}

.banner-imagen {
  flex: 0 0 auto;
  margin-left: 20px;
}

.banner-imagen img {
  height: 230px;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2));
}

.colecciones {
  margin-bottom: 40px;
}

.colecciones h2, .productos-destacados h2 {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #333;
}

.colecciones-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 15px;
}

.coleccion-card {
  border-radius: 12px;
  padding: 20px 10px;
  text-align: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.coleccion-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
}

.coleccion-emoji {
  font-size: 2rem;
  display: block;
  margin-bottom: 8px;
}

.coleccion-card p {
  font-size: 0.9rem;
  font-weight: 600;
  color: #555;
}

.productos-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.cargando {
  text-align: center;
  padding: 40px;
  color: #888;
}
</style>
