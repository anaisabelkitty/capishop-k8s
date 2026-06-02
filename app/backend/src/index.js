// Punto de entrada del backend de CapiShop
// Inicializa Express, conecta a MongoDB y registra las rutas

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const conectarDB = require('./db');

const productosRouter = require('./routes/productos');
const wishlistRouter = require('./routes/wishlist');
const checkoutRouter = require('./routes/checkout');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Conexión a la base de datos
conectarDB();

// Rutas
app.use('/api/productos', productosRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/checkout', checkoutRouter);

// Ruta de salud para verificar que el backend está corriendo
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mensaje: 'CapiShop backend funcionando' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});