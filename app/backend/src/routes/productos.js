// Rutas y modelo de productos de CapiShop
// Define la estructura de cada producto en MongoDB
// y los endpoints para consultarlos con filtros

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Modelo de producto en MongoDB
const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String, required: true },
  precio: { type: Number, required: true },
  coleccion: {
    type: String,
    enum: ['perros', 'gatos', 'roedores', 'aves', 'acuaticos', 'exoticos'],
    required: true
  },
  categoria: {
    type: String,
    enum: ['arnes', 'correa', 'cama', 'ropa', 'snack', 'rascador', 'juguete', 'jaula', 'rueda', 'pecera', 'decoracion', 'terrario', 'tazon', 'transportadora'],
    required: true
  },
  tallas: [{ type: String, enum: ['XS', 'S', 'M', 'L', 'XL'] }],
  colores: [String],
  imagenes: [String],
  stock: { type: Number, required: true, default: 0 },
  disponible: { type: Boolean, default: true }
});

const Producto = mongoose.model('Producto', productoSchema);

// GET /api/productos — obtener todos los productos con filtros opcionales
router.get('/', async (req, res) => {
  try {
    const filtros = {};

    // Filtro por coleccion (perros, gatos, etc)
    if (req.query.coleccion) filtros.coleccion = req.query.coleccion;

    // Filtro por categoria (arnes, juguete, etc)
    if (req.query.categoria) filtros.categoria = req.query.categoria;

    // Filtro por talla
    if (req.query.talla) filtros.tallas = req.query.talla;

    // Filtro por color
    if (req.query.color) filtros.colores = req.query.color;

    // Solo productos disponibles
    filtros.disponible = true;

    const productos = await Producto.find(filtros);
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// GET /api/productos/:id — obtener un producto por su ID
router.get('/:id', async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el producto' });
  }
});

module.exports = { router, Producto };