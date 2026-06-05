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
      cantidad: { type: Number, required: true },
      talla: { type: String, default: '' }
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

      // Verifica stock por talla si aplica
      if (item.talla && producto.stockPorTalla) {
        const stockTalla = producto.stockPorTalla.get(item.talla) || 0;
        if (stockTalla < item.cantidad) {
          await session.abortTransaction();
          return res.status(400).json({
            error: `Stock insuficiente para: ${producto.nombre} en talla ${item.talla}`,
            stockDisponible: stockTalla
          });
        }
      }

      // Descuenta el stock total y stockPorTalla atómicamente
      const updateQuery = { $inc: { stock: -item.cantidad } };
      if (item.talla && producto.stockPorTalla) {
        updateQuery.$inc[`stockPorTalla.${item.talla}`] = -item.cantidad;
      }
      if (producto.stock - item.cantidad === 0) {
        updateQuery.$set = { disponible: false };
      }

      await Producto.findByIdAndUpdate(item.productoId, updateQuery, { session });

      total += producto.precio * item.cantidad;
    }

    // Crea el pedido
    const pedido = new Pedido({
      sessionId,
      productos: productos.map(item => ({
        producto: item.productoId,
        cantidad: item.cantidad,
        talla: item.talla || ''
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