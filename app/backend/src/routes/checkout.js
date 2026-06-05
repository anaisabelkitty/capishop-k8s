// Rutas de checkout de CapiShop
// Procesa el pedido y descuenta el stock en MongoDB en tiempo real
// Si un producto no tiene stock suficiente regresa un error antes de procesar

const express = require('express');
const mongoose = require('mongoose');
const https = require('https');
const router = express.Router();
const { Producto } = require('./productos');

// Webhook de Slack para alertas
const webhookUrl = process.env.SLACK_WEBHOOK_URL;

// Arma el mensaje en JSON y lo manda al webhook de Slack por una petición HTTPS
const enviarAlertaSlack = (mensaje) => {
  const payload = JSON.stringify({ text: mensaje });
  const url = new URL(SLACK_WEBHOOK);
  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };
  const req = https.request(options);
  req.write(payload);
  req.end();
};

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
  // Uso una transacción para que, si algo falla, no se descuente stock a medias
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { sessionId, productos } = req.body;
    let total = 0;

    // Recorro cada producto del carrito para revisar el stock antes de descontarlo
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

      if (item.talla && producto.tallas && producto.tallas.length > 0) {
        const stockTalla = (producto.stockPorTalla && producto.stockPorTalla[item.talla]) || 0;
        if (stockTalla < item.cantidad) {
          await session.abortTransaction();
          return res.status(400).json({
            error: `Stock insuficiente para: ${producto.nombre} en talla ${item.talla}`,
            stockDisponible: stockTalla
          });
        }
      }

      const updateQuery = { $inc: { stock: -item.cantidad } };
      if (item.talla && producto.tallas && producto.tallas.length > 0) {
        updateQuery.$inc[`stockPorTalla.${item.talla}`] = -item.cantidad;
      }
      if (producto.stock - item.cantidad === 0) {
        updateQuery.$set = { disponible: false };
      }

      await Producto.collection.updateOne(
        { _id: producto._id },
        updateQuery,
        { session }
      );

      // Alerta de stock bajo — capturada por Loki y enviada a Slack
      const stockRestante = producto.stock - item.cantidad;
      if (stockRestante <= 5) {
        console.log(JSON.stringify({
          level: "warn",
          msg: "stock bajo",
          producto: producto.nombre,
          coleccion: producto.coleccion,
          categoria: producto.categoria,
          stock: stockRestante,
          umbral: 5
        }));
        enviarAlertaSlack(`🚨 *Stock bajo en CapiShop*\n*Producto:* ${producto.nombre}\n*Colección:* ${producto.coleccion}\n*Stock restante:* ${stockRestante} unidades\n*Umbral:* 5 unidades`);
      }

      total += producto.precio * item.cantidad;
    }

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