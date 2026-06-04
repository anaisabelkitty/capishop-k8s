<!-- Barra de navegación de CapiShop -->
<template>
  <nav class="navbar">
    <div class="navbar-contenido">
      <router-link to="/" class="logo">
        <img src="/images/logo-capishop.png" alt="CapiShop" class="logo-img" />
        <span>CapiShop</span>
      </router-link>
      <div class="nav-links">
        <router-link to="/">Inicio</router-link>
        <router-link to="/catalogo">Catálogo</router-link>
        <router-link to="/wishlist" class="wishlist-link">
          ❤️ Wishlist
        </router-link>
        <router-link to="/checkout" class="checkout-link">
          🛒 Carrito
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
</script>

<style scoped>
.navbar {
  background-color: #ffffff;
  border-bottom: 2px solid #f0f0f0;
  padding: 12px 20px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.navbar-contenido {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #7c3aed;
  text-decoration: none;
}

.logo-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.nav-links {
  display: flex;
  gap: 25px;
  align-items: center;
}

.nav-links a {
  text-decoration: none;
  color: #555;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-links a:hover {
  color: #7c3aed;
}

.nav-links a.router-link-active {
  color: #7c3aed;
  font-weight: 600;
}

.wishlist-link {
  color: #e53e3e !important;
}

.checkout-link {
  background-color: #7c3aed;
  color: white !important;
  padding: 8px 16px;
  border-radius: 20px;
}

.checkout-link:hover {
  background-color: #6d28d9 !important;
  color: white !important;
}
</style>