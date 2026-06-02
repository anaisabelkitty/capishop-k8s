<!-- Componente raíz de CapiShop -->
<!-- Contiene la barra de navegación y el router-view donde se cargan las vistas -->

<template>
  <div id="app">
    <NavBar />
    <main class="contenido-principal">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', sans-serif;
  background-color: #f9f9f9;
  color: #333;
}

.contenido-principal {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
</style>