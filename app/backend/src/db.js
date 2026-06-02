// Conexión a MongoDB usando Mongoose
// La URL de conexión viene de la variable de entorno MONGODB_URI
// Si no está definida usa localhost por defecto para desarrollo local

const mongoose = require('mongoose');

const conectarDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/capishop';
    await mongoose.connect(uri);
    console.log('Conexión a MongoDB exitosa');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = conectarDB;