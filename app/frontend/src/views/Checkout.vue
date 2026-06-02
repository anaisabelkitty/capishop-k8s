<!-- Vista de checkout de CapiShop -->
<!-- Muestra el resumen del carrito y procesa el pedido descontando el stock en tiempo real -->

<template>
  <div class="checkout">
    <h1>🛒 Mi Carrito</h1>

    <div v-if="carrito.length === 0" class="vacio">
      <p>Tu carrito está vacío.</p>
      <router-link to="/catalogo" class="btn-ir-catalogo">
        Ver catálogo
      </router-link>
    </div>

    <div v-else class="checkout-contenido">
      <div class="items-carrito">
        <div
          v-for="item in carrito"
          :key="item.productoId"
          class="item-card"
        >
          <img
            :src="`/images/productos/${item.imagen}`"
            :alt="item.nombre"
            class="item-imagen"
          />
          <div class="item-info">
            <h3>{{ item.nombre }}</h3>
            <p class="item-precio">${{ item.precio.toLocaleString() }} MXN</p>
          </div>
          <div class="item-cantidad">
            <button @click="cambiarCantidad(item, -1)">−</button>
            <span>{{ item.cantidad }}</span>
            <button @click="cambiarCantidad(item, 1)">+</button>
          </div>
          <p class="item-subtotal">
            ${{ (item.precio * item.cantidad).toLocaleString() }} MXN
          </p>
          <button class="btn-eliminar" @click="eliminarItem(item)">✕</button>
        </div>
      </div>

      <div class="resumen">
        <h2>Resumen del pedido</h2>
        <div class="resumen-linea">
          <span>Subtotal</span>
          <span>${{ total.toLocaleString() }} MXN</span>
        </div>
        <div class="resumen-linea">
          <span>Envío</span>
          <span>Gratis</span>
        </div>
        <div class="resumen-linea total">
          <span>Total</span>
          <span>${{ total.toLocaleString() }} MXN</span>
        </div>

        <div v-if="error" class="error-mensaje">{{ error }}</div>
        <div v-if="exito" class="exito-mensaje">¡Pedido confirmado! Gracias por tu compra.</div>

        <button
          class="btn-confirmar"
          @click="confirmarPedido"
          :disabled="procesando || exito"
        >
          {{ procesando ? 'Procesando...' : 'Confirmar pedido' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { procesarCheckout } from '../api'

const carrito = ref([])
const procesando = ref(false)
const error = ref('')
const exito = ref(false)

const sessionId = localStorage.getItem('sessionId') || (() => {
  const id = Math.random().toString(36).substring(2)
  localStorage.setItem('sessionId', id)
  return id
})()

onMounted(() => {
  carrito.value = JSON.parse(localStorage.getItem('carrito') || '[]')
})

const total = computed(() => {
  return carrito.value.reduce((acc, item) => acc + item.precio * item.cantidad, 0)
})

const cambiarCantidad = (item, delta) => {
  const nueva = item.cantidad + delta
  if (nueva <= 0) {
    eliminarItem(item)
    return
  }
  item.cantidad = nueva
  localStorage.setItem('carrito', JSON.stringify(carrito.value))
}

const eliminarItem = (item) => {
  carrito.value = carrito.value.filter(i => i.productoId !== item.productoId)
  localStorage.setItem('carrito', JSON.stringify(carrito.value))
}

const confirmarPedido = async () => {
  procesando.value = true
  error.value = ''
  try {
    await procesarCheckout(sessionId, carrito.value.map(item => ({
      productoId: item.productoId,
      cantidad: item.cantidad
    })))
    exito.value = true
    carrito.value = []
    localStorage.setItem('carrito', '[]')
  } catch (err) {
    error.value = err.response?.data?.error || 'Error al procesar el pedido'
  } finally {
    procesando.value = false
  }
}
</script>

<style scoped>
.checkout h1 {
  font-size: 1.8rem;
  margin-bottom: 25px;
  color: #333;
}

.checkout-contenido {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 30px;
}

.item-card {
  display: flex;
  align-items: center;
  gap: 15px;
  background: white;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.item-imagen {
  width: 80px;
  height: 80px;
  object-fit: contain;
  border-radius: 8px;
  background: #f5f5f5;
  padding: 5px;
}

.item-info {
  flex: 1;
}

.item-info h3 {
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 4px;
}

.item-precio {
  color: #7c3aed;
  font-weight: 600;
}

.item-cantidad {
  display: flex;
  align-items: center;
  gap: 10px;
}

.item-cantidad button {
  width: 30px;
  height: 30px;
  border: 1px solid #e2e2e2;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-cantidad span {
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.item-subtotal {
  font-weight: 700;
  color: #333;
  min-width: 100px;
  text-align: right;
}

.btn-eliminar {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 1rem;
  padding: 5px;
}

.btn-eliminar:hover {
  color: #ef4444;
}

.resumen {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  height: fit-content;
  position: sticky;
  top: 80px;
}

.resumen h2 {
  font-size: 1.2rem;
  margin-bottom: 20px;
  color: #333;
}

.resumen-linea {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  color: #555;
}

.resumen-linea.total {
  font-weight: 700;
  font-size: 1.1rem;
  color: #333;
  border-bottom: none;
  margin-top: 5px;
}

.btn-confirmar {
  width: 100%;
  padding: 14px;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 1rem;
  margin-top: 20px;
  transition: background-color 0.2s;
}

.btn-confirmar:hover:not(:disabled) {
  background: #6d28d9;
}

.btn-confirmar:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-mensaje {
  background: #fee2e2;
  color: #ef4444;
  padding: 10px;
  border-radius: 8px;
  margin-top: 12px;
  font-size: 0.9rem;
}

.exito-mensaje {
  background: #dcfce7;
  color: #22c55e;
  padding: 10px;
  border-radius: 8px;
  margin-top: 12px;
  font-size: 0.9rem;
}

.vacio {
  text-align: center;
  padding: 60px;
  color: #888;
}

.vacio p {
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
</style>