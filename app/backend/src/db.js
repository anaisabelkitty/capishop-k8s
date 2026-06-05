// Conexión a MongoDB usando Mongoose
// La URL de conexión viene de la variable de entorno MONGODB_URI
// Si no está definida usa localhost por defecto para desarrollo local

const mongoose = require('mongoose');

const conectarDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/capishop';
  // Intenta conectarse y, si falla, vuelve a reintentar cada 5 segundos
  const intentarConexion = async () => {
    try {
      await mongoose.connect(uri);
      console.log('Conexión a MongoDB exitosa');
    } catch (error) {
      console.error('Error al conectar a MongoDB:', error.message);
      console.log('Reintentando en 5 segundos...');
      setTimeout(intentarConexion, 5000);
    }
  };
  intentarConexion();
};

module.exports = conectarDB;