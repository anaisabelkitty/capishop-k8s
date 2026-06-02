// Rutas de checkout de CapiShop
// Procesa el pedido y descuenta el stock en MongoDB en tiempo real
// Si un producto no tiene stock suficiente regresa un error antes de procesar

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { Producto } = require('./productos');

// Modelo de pedido en MongoDB
const pedidoSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  productos: [
    {
      producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
      cantidad: { type: Number, required: true }
    }
  ],
  total: { type: Number, required: true },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmado', 'cancelado'],
    default: 'pendiente'
  },
  creadoEn: { type: Date, default: Date.now }
});

const Pedido = mongoose.model('Pedido', pedidoSchema);

// POST /api/checkout — procesar pedido y descontar stock
router.post('/', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { sessionId, productos } = req.body;
    let total = 0;

    // Verifica stock de cada producto antes de procesar
    for (const item of productos) {
      const producto = await Producto.findById(item.productoId).session(session);

      if (!producto) {
        await session.abortTransaction();
        return res.status(404).json({
          error: `Producto no encontrado: ${item.productoId}`
        });
      }

      if (producto.stock < item.cantidad) {
        await session.abortTransaction();
        return res.status(400).json({
          error: `Stock insuficiente para: ${producto.nombre}`,
          stockDisponible: producto.stock
        });
      }

      // Descuenta el stock
      producto.stock -= item.cantidad;
      if (producto.stock === 0) producto.disponible = false;
      await producto.save({ session });

      total += producto.precio * item.cantidad;
    }

    // Crea el pedido
    const pedido = new Pedido({
      sessionId,
      productos: productos.map(item => ({
        producto: item.productoId,
        cantidad: item.cantidad
      })),
      total,
      estado: 'confirmado'
    });

    await pedido.save({ session });
    await session.commitTransaction();

    res.json({ mensaje: 'Pedido confirmado', pedido });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ error: 'Error al procesar el pedido' });
  } finally {
    session.endSession();
  }
});

// GET /api/checkout/:sessionId — obtener pedidos de una sesión
router.get('/:sessionId', async (req, res) => {
  try {
    const pedidos = await Pedido.find({ sessionId: req.params.sessionId })
      .populate('productos.producto');
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los pedidos' });
  }
});

module.exports = router;