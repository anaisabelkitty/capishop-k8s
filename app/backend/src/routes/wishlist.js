// Rutas de wishlist de CapiShop
// Permite guardar y consultar productos favoritos del usuario
// La wishlist se guarda en MongoDB asociada a un identificador de sesión

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Modelo de wishlist en MongoDB
const wishlistSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  productos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Producto' }],
  creadoEn: { type: Date, default: Date.now }
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

// GET /api/wishlist/:sessionId — obtener wishlist de una sesión
router.get('/:sessionId', async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ sessionId: req.params.sessionId })
      .populate('productos');
    if (!wishlist) {
      return res.json({ sessionId: req.params.sessionId, productos: [] });
    }
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la wishlist' });
  }
});

// POST /api/wishlist — agregar producto a la wishlist
router.post('/', async (req, res) => {
  try {
    const { sessionId, productoId } = req.body;

    let wishlist = await Wishlist.findOne({ sessionId });

    if (!wishlist) {
      // Si no existe la wishlist la crea
      wishlist = new Wishlist({ sessionId, productos: [productoId] });
    } else {
      // Si ya existe verifica que el producto no esté duplicado
      if (!wishlist.productos.includes(productoId)) {
        wishlist.productos.push(productoId);
      }
    }

    await wishlist.save();
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar a la wishlist' });
  }
});

// DELETE /api/wishlist/:sessionId/:productoId — quitar producto de la wishlist
router.delete('/:sessionId/:productoId', async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ sessionId: req.params.sessionId });
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist no encontrada' });
    }
    wishlist.productos = wishlist.productos.filter(
      p => p.toString() !== req.params.productoId
    );
    await wishlist.save();
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar de la wishlist' });
  }
});

module.exports = router;