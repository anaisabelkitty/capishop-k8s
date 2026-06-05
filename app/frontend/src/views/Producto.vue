<!-- Vista de detalle de un producto -->
<template>
  <div class="producto-detalle">
    <div v-if="cargando" class="cargando">Cargando producto...</div>
    <div v-else-if="!producto" class="error">Producto no encontrado.</div>
    <div v-else>
      <div class="detalle-contenido">
        <div class="imagenes-galeria">
          <img
            :src="`/images/productos/${imagenActiva}`"
            :alt="producto.nombre"
            class="imagen-principal"
          />
          <div class="miniaturas">
            <img
              v-for="imagen in producto.imagenes"
              :key="imagen"
              :src="`/images/productos/${imagen}`"
              :alt="producto.nombre"
              class="miniatura"
              :class="{ activa: imagenActiva === imagen }"
              @click="imagenActiva = imagen"
            />
          </div>
        </div>

        <div class="producto-info">
          <p class="coleccion-badge">{{ producto.coleccion }}</p>
          <h1>{{ producto.nombre }}</h1>
          <p class="precio">${{ producto.precio.toLocaleString() }} MXN</p>
          <p class="descripcion">{{ producto.descripcion }}</p>

          <div v-if="producto.tallas.length > 0" class="opciones">
            <label>Talla</label>
            <div class="tallas-grid">
              <button
                v-for="talla in producto.tallas"
                :key="talla"
                class="talla-btn"
                :class="{ seleccionada: tallaSeleccionada === talla }"
                @click="tallaSeleccionada = talla"
              >
                {{ talla }}
              </button>
            </div>
            <p v-if="!tallaSeleccionada" class="aviso-talla">⚠️ Selecciona una talla</p>
            <p v-else class="stock-info" :class="{ agotado: stockTallaActual === 0 }">
              {{ stockTallaActual === 0 ? 'Agotado en esta talla' : `${stockTallaActual} disponibles en talla ${tallaSeleccionada}` }}
            </p>
          </div>

          <p v-else class="stock-info" :class="{ agotado: producto.stock === 0 }">
            {{ producto.stock === 0 ? 'Agotado' : `${producto.stock} disponibles` }}
          </p>

          <div v-if="producto.colores.length > 0" class="opciones">
            <label>Color</label>
            <p class="color-texto">{{ producto.colores.join(', ') }}</p>
          </div>

          <div class="acciones">
            <button
              class="btn-wishlist"
              @click="toggleWishlist"
              :class="{ activo: enWishlist }"
            >
              {{ enWishlist ? '❤️ En wishlist' : '🤍 Agregar a wishlist' }}
            </button>
            <button
              class="btn-carrito"
              @click="agregarAlCarrito"
              :disabled="producto.stock === 0 || (producto.tallas.length > 0 && !tallaSeleccionada)"
            >
              🛒 Agregar al carrito
            </button>
          </div>
          <div v-if="notificacion" class="notificacion-carrito">
            ✓ {{ notificacion }}
          </div>
        </div>
      </div>

      <!-- Productos relacionados -->
      <div v-if="relacionados.length > 0" class="relacionados">
        <h2>También te puede interesar</h2>
        <div class="relacionados-grid">
          <div
            v-for="rel in relacionados"
            :key="rel._id"
            class="relacionado-card"
            @click="irAProducto(rel._id)"
          >
            <div class="relacionado-imagen">
              <img
                :src="`/images/productos/${rel.imagenes[0]}`"
                :alt="rel.nombre"
              />
            </div>
            <div class="relacionado-info">
              <p class="relacionado-nombre">{{ rel.nombre }}</p>
              <p class="relacionado-precio">${{ rel.precio.toLocaleString() }} MXN</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProducto, getProductos, agregarWishlist, eliminarWishlist } from '../api'

const route = useRoute()
const router = useRouter()
const producto = ref(null)
const cargando = ref(true)
const imagenActiva = ref('')
const tallaSeleccionada = ref('')
const enWishlist = ref(false)
const relacionados = ref([])
const notificacion = ref('')
const stockTallaActual = computed(() => {
  if (!producto.value || !tallaSeleccionada.value) return 0
  const stockMap = producto.value.stockPorTalla
  if (!stockMap) return producto.value.stock
  return stockMap[tallaSeleccionada.value] ?? 0
})

const sessionId = localStorage.getItem('sessionId') || (() => {
  const id = Math.random().toString(36).substring(2)
  localStorage.setItem('sessionId', id)
  return id
})()

const cargarProducto = async (id) => {
  cargando.value = true
  tallaSeleccionada.value = ''
  relacionados.value = []
  try {
    const response = await getProducto(id)
    producto.value = response.data
    imagenActiva.value = producto.value.imagenes[0]

    const wishlistLocal = JSON.parse(localStorage.getItem('wishlist') || '[]')
    enWishlist.value = wishlistLocal.includes(producto.value._id)

    // Cargar productos relacionados de la misma categoría
    const relResponse = await getProductos({
      coleccion: producto.value.coleccion,
      categoria: producto.value.categoria
    })
    relacionados.value = relResponse.data
      .filter(p => p._id !== producto.value._id)
      .slice(0, 4)
  } catch (error) {
    console.error('Error al cargar producto:', error)
  } finally {
    cargando.value = false
  }
}

onMounted(() => cargarProducto(route.params.id))

watch(() => route.params.id, (nuevoId) => {
  if (nuevoId) cargarProducto(nuevoId)
})

const irAProducto = (id) => {
  router.push(`/producto/${id}`)
}

const toggleWishlist = async () => {
  try {
    const wishlistLocal = JSON.parse(localStorage.getItem('wishlist') || '[]')
    if (enWishlist.value) {
      await eliminarWishlist(sessionId, producto.value._id)
      const index = wishlistLocal.indexOf(producto.value._id)
      if (index > -1) wishlistLocal.splice(index, 1)
    } else {
      await agregarWishlist(sessionId, producto.value._id)
      wishlistLocal.push(producto.value._id)
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlistLocal))
    enWishlist.value = !enWishlist.value
  } catch (error) {
    console.error('Error al actualizar wishlist:', error)
  }
}

const agregarAlCarrito = () => {
  if (producto.value.tallas.length > 0 && !tallaSeleccionada.value) return

  const carrito = JSON.parse(localStorage.getItem('carrito') || '[]')
  const key = `${producto.value._id}-${tallaSeleccionada.value}`
  const existente = carrito.find(item => item.key === key)

  if (existente) {
    existente.cantidad += 1
  } else {
    carrito.push({
      key,
      productoId: producto.value._id,
      cantidad: 1,
      nombre: producto.value.nombre,
      precio: producto.value.precio,
      imagen: producto.value.imagenes[0],
      talla: tallaSeleccionada.value
    })
  }
  localStorage.setItem('carrito', JSON.stringify(carrito))
  notificacion.value = `${producto.value.nombre}${tallaSeleccionada.value ? ` (${tallaSeleccionada.value})` : ''} agregado al carrito`
  setTimeout(() => { notificacion.value = '' }, 3000)
}
</script>

<style scoped>
.detalle-contenido {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-top: 20px;
}

.imagen-principal {
  width: 100%;
  border-radius: 12px;
  object-fit: contain;
  background: #f5f5f5;
  padding: 20px;
  max-height: 400px;
}

.miniaturas {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.miniatura {
  width: 70px;
  height: 70px;
  object-fit: contain;
  border-radius: 8px;
  border: 2px solid #e2e2e2;
  padding: 4px;
  cursor: pointer;
  background: #f5f5f5;
}

.miniatura.activa {
  border-color: #7c3aed;
}

.coleccion-badge {
  display: inline-block;
  background: #f0ebff;
  color: #7c3aed;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: capitalize;
  margin-bottom: 12px;
}

h1 {
  font-size: 1.6rem;
  color: #333;
  margin-bottom: 10px;
}

.precio {
  font-size: 1.8rem;
  font-weight: 700;
  color: #7c3aed;
  margin-bottom: 16px;
}

.descripcion {
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;
}

.opciones {
  margin-bottom: 16px;
}

.opciones label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.tallas-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.talla-btn {
  padding: 8px 16px;
  border: 1px solid #e2e2e2;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.talla-btn.seleccionada {
  border-color: #7c3aed;
  background: #7c3aed;
  color: white;
}

.aviso-talla {
  color: #f59e0b;
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: 8px;
}

.color-texto {
  color: #666;
  text-transform: capitalize;
}

.stock-info {
  font-size: 0.9rem;
  color: #22c55e;
  font-weight: 600;
  margin-top: 8px;
  margin-bottom: 20px;
}

.stock-info.agotado {
  color: #ef4444;
}

.acciones {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn-wishlist {
  flex: 1;
  padding: 12px;
  border: 2px solid #e2e2e2;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-wishlist.activo {
  border-color: #e53e3e;
  color: #e53e3e;
}

.btn-carrito {
  flex: 2;
  padding: 12px;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.btn-carrito:hover:not(:disabled) {
  background: #6d28d9;
}

.btn-carrito:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.cargando, .error {
  text-align: center;
  padding: 60px;
  color: #888;
}

.notificacion-carrito {
  background: #f0ebff;
  color: #7c3aed;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  margin-top: 12px;
  border: 1px solid #ddd5ff;
}

.relacionados {
  margin-top: 50px;
  border-top: 1px solid #f0f0f0;
  padding-top: 30px;
}

.relacionados h2 {
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 20px;
}

.relacionados-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.relacionado-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.relacionado-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
}

.relacionado-imagen {
  height: 160px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.relacionado-imagen img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 10px;
}

.relacionado-info {
  padding: 12px;
}

.relacionado-nombre {
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.relacionado-precio {
  font-size: 0.95rem;
  font-weight: 700;
  color: #7c3aed;
}
</style>