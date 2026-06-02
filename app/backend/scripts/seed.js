// Script para cargar los productos iniciales en MongoDB
// Se ejecuta una sola vez al desplegar la aplicación
// Usa los mismos nombres de imagen que están en app/frontend/public/images/productos/

require('dotenv').config();
const mongoose = require('mongoose');
const { Producto } = require('../src/routes/productos');

const productos = [
  // Colección Perros
  {
    nombre: 'Arnés Negro para Perro',
    descripcion: 'Arnés de malla transpirable con hebillas de metal. Ajustable para mayor comodidad.',
    precio: 299,
    coleccion: 'perros',
    categoria: 'arnes',
    tallas: ['XS', 'S', 'M', 'L', 'XL'],
    colores: ['negro'],
    imagenes: ['arnes-perro-1.png', 'arnes-perro-2.png'],
    stock: 25
  },
  {
    nombre: 'Arnés Rosa para Perro',
    descripcion: 'Arnés de malla suave color rosa con hebillas plateadas. Ideal para perras.',
    precio: 299,
    coleccion: 'perros',
    categoria: 'arnes',
    tallas: ['XS', 'S', 'M', 'L'],
    colores: ['rosa'],
    imagenes: ['arnes-perro-2.png', 'arnes-perro-1.png'],
    stock: 20
  },
  {
    nombre: 'Correa Azul Marino para Perro',
    descripcion: 'Correa de cuero azul marino con herrajes dorados. Resistente y cómoda.',
    precio: 199,
    coleccion: 'perros',
    categoria: 'correa',
    tallas: [],
    colores: ['azul marino'],
    imagenes: ['correa-perro-1.png', 'correa-perro-2.png'],
    stock: 30
  },
  {
    nombre: 'Correa Café para Perro',
    descripcion: 'Correa de cuero café con herrajes plateados. Duradera y elegante.',
    precio: 199,
    coleccion: 'perros',
    categoria: 'correa',
    tallas: [],
    colores: ['café'],
    imagenes: ['correa-perro-2.png', 'correa-perro-1.png'],
    stock: 28
  },
  {
    nombre: 'Cama Redonda Gris para Perro',
    descripcion: 'Cama ortopédica redonda con cojín suave. Ideal para perros de talla pequeña y mediana.',
    precio: 599,
    coleccion: 'perros',
    categoria: 'cama',
    tallas: ['S', 'M', 'L'],
    colores: ['gris'],
    imagenes: ['cama-perro-1.png', 'cama-perro-2.png'],
    stock: 15
  },
  {
    nombre: 'Cama Rectangular Beige para Perro',
    descripcion: 'Cama rectangular con bordes acolchados. Perfecta para perros que les gusta recostarse.',
    precio: 649,
    coleccion: 'perros',
    categoria: 'cama',
    tallas: ['M', 'L', 'XL'],
    colores: ['beige'],
    imagenes: ['cama-perro-2.png', 'cama-perro-1.png'],
    stock: 12
  },
  {
    nombre: 'Sudadera Café para Perro',
    descripcion: 'Sudadera hoodie café de tela suave. Perfecta para el frío.',
    precio: 249,
    coleccion: 'perros',
    categoria: 'ropa',
    tallas: ['XS', 'S', 'M', 'L'],
    colores: ['café'],
    imagenes: ['ropa-perro-1.png', 'ropa-perro-2.png'],
    stock: 18
  },
  {
    nombre: 'Sudadera Lila para Perro',
    descripcion: 'Sudadera hoodie lila con detalle de moño. Ideal para perras.',
    precio: 249,
    coleccion: 'perros',
    categoria: 'ropa',
    tallas: ['XS', 'S', 'M'],
    colores: ['lila'],
    imagenes: ['ropa-perro-2.png', 'ropa-perro-1.png'],
    stock: 15
  },
  {
    nombre: 'Snack Natural para Perro',
    descripcion: 'Bolsa de premios naturales para perro. Sin conservadores artificiales.',
    precio: 89,
    coleccion: 'perros',
    categoria: 'snack',
    tallas: [],
    colores: [],
    imagenes: ['snack-perro-1.png', 'snack-perro-2.png'],
    stock: 50
  },
  {
    nombre: 'Snack Dental para Perro',
    descripcion: 'Premios dentales que ayudan a limpiar los dientes de tu perro.',
    precio: 99,
    coleccion: 'perros',
    categoria: 'snack',
    tallas: [],
    colores: [],
    imagenes: ['snack-perro-2.png', 'snack-perro-1.png'],
    stock: 45
  },
  // Colección Gatos
  {
    nombre: 'Arnés Lila para Gato',
    descripcion: 'Arnés suave color lila con hebillas ajustables. Perfecto para paseos.',
    precio: 279,
    coleccion: 'gatos',
    categoria: 'arnes',
    tallas: ['XS', 'S', 'M'],
    colores: ['lila'],
    imagenes: ['arnes-gato-1.png', 'arnes-gato-2.png'],
    stock: 20
  },
  {
    nombre: 'Arnés Azul Cielo para Gato',
    descripcion: 'Arnés suave color azul cielo con hebillas plateadas. Cómodo y seguro.',
    precio: 279,
    coleccion: 'gatos',
    categoria: 'arnes',
    tallas: ['XS', 'S', 'M'],
    colores: ['azul cielo'],
    imagenes: ['arnes-gato-2.png', 'arnes-gato-1.png'],
    stock: 18
  },
  {
    nombre: 'Rascador Torre Naranja para Gato',
    descripcion: 'Torre rascadora con múltiples plataformas y juguetes colgantes. Color naranja.',
    precio: 899,
    coleccion: 'gatos',
    categoria: 'rascador',
    tallas: [],
    colores: ['naranja'],
    imagenes: ['rascador-gato-1.png', 'rascador-gato-2.png'],
    stock: 8
  },
  {
    nombre: 'Rascador Cactus Verde para Gato',
    descripcion: 'Rascador en forma de cactus con cuerda de sisal. Divertido y resistente.',
    precio: 499,
    coleccion: 'gatos',
    categoria: 'rascador',
    tallas: [],
    colores: ['verde'],
    imagenes: ['rascador-gato-2.png', 'rascador-gato-1.png'],
    stock: 12
  },
  {
    nombre: 'Varita con Plumas para Gato',
    descripcion: 'Juguete varita con plumas rosa y morado. Estimula el instinto cazador.',
    precio: 129,
    coleccion: 'gatos',
    categoria: 'juguete',
    tallas: [],
    colores: ['rosa', 'morado'],
    imagenes: ['juguete-gato-1.png', 'juguete-gato-2.png'],
    stock: 35
  },
  {
    nombre: 'Pista Interactiva Azul para Gato',
    descripcion: 'Pista circular interactiva con pelota interior. Mantiene a tu gato entretenido.',
    precio: 179,
    coleccion: 'gatos',
    categoria: 'juguete',
    tallas: [],
    colores: ['azul cielo'],
    imagenes: ['juguete-gato-2.png', 'juguete-gato-1.png'],
    stock: 25
  },
  {
    nombre: 'Snack Natural para Gato',
    descripcion: 'Bolsa de premios naturales para gato con ventana en forma de gato.',
    precio: 89,
    coleccion: 'gatos',
    categoria: 'snack',
    tallas: [],
    colores: [],
    imagenes: ['snack-gato-1.png', 'snack-gato-2.png'],
    stock: 50
  },
  {
    nombre: 'Snack Sticks para Gato',
    descripcion: 'Bolsa de sticks de premio para gato. Suaves y nutritivos.',
    precio: 99,
    coleccion: 'gatos',
    categoria: 'snack',
    tallas: [],
    colores: [],
    imagenes: ['snack-gato-2.png', 'snack-gato-1.png'],
    stock: 45
  },
  // Colección Roedores
  {
    nombre: 'Jaula Blanca para Hámster',
    descripcion: 'Jaula moderna blanca con rueda naranja y accesorios incluidos.',
    precio: 449,
    coleccion: 'roedores',
    categoria: 'jaula',
    tallas: [],
    colores: ['blanco', 'naranja'],
    imagenes: ['jaula-hamster-1.png', 'jaula-hamster-2.png'],
    stock: 10
  },
  {
    nombre: 'Jaula Transparente para Hámster',
    descripcion: 'Jaula acrílica transparente con accesorios lila y verde menta.',
    precio: 499,
    coleccion: 'roedores',
    categoria: 'jaula',
    tallas: [],
    colores: ['transparente', 'lila', 'verde'],
    imagenes: ['jaula-hamster-2.png', 'jaula-hamster-1.png'],
    stock: 8
  },
  {
    nombre: 'Rueda de Ejercicio Naranja para Hámster',
    descripcion: 'Rueda silenciosa transparente con base naranja. Ideal para hámsters activos.',
    precio: 149,
    coleccion: 'roedores',
    categoria: 'rueda',
    tallas: [],
    colores: ['naranja', 'transparente'],
    imagenes: ['rueda-hamster-1.png', 'rueda-hamster-2.png'],
    stock: 20
  },
  {
    nombre: 'Rueda de Ejercicio Lila para Hámster',
    descripcion: 'Rueda silenciosa color lila. Diseño moderno y fácil de limpiar.',
    precio: 149,
    coleccion: 'roedores',
    categoria: 'rueda',
    tallas: [],
    colores: ['lila'],
    imagenes: ['rueda-hamster-2.png', 'rueda-hamster-1.png'],
    stock: 18
  },
  // Colección Aves
  {
    nombre: 'Jaula Dorada para Pájaro',
    descripcion: 'Jaula decorativa color dorado estilo vintage con percha de madera.',
    precio: 799,
    coleccion: 'aves',
    categoria: 'jaula',
    tallas: [],
    colores: ['dorado'],
    imagenes: ['jaula-pajaro-1.png', 'jaula-pajaro-2.png'],
    stock: 6
  },
  {
    nombre: 'Jaula Plateada para Pájaro',
    descripcion: 'Jaula rectangular color plata con percha de madera y comederos.',
    precio: 699,
    coleccion: 'aves',
    categoria: 'jaula',
    tallas: [],
    colores: ['plateado'],
    imagenes: ['jaula-pajaro-2.png', 'jaula-pajaro-1.png'],
    stock: 8
  },
  {
    nombre: 'Columpio de Madera para Pájaro',
    descripcion: 'Columpio de madera natural con cuentas de colores. Entretiene a tu pájaro.',
    precio: 129,
    coleccion: 'aves',
    categoria: 'juguete',
    tallas: [],
    colores: ['multicolor'],
    imagenes: ['juguete-pajaro-1.png', 'juguete-pajaro-2.png'],
    stock: 25
  },
  {
    nombre: 'Escalera de Colores para Pájaro',
    descripcion: 'Escalera de madera con peldaños de colores. Perfecta para pájaros activos.',
    precio: 99,
    coleccion: 'aves',
    categoria: 'juguete',
    tallas: [],
    colores: ['multicolor'],
    imagenes: ['juguete-pajaro-2.png', 'juguete-pajaro-1.png'],
    stock: 30
  },
  // Colección Acuáticos
  {
    nombre: 'Pecera Cúbica con Plantas',
    descripcion: 'Pecera de vidrio cúbica con plantas acuáticas y peces de colores.',
    precio: 899,
    coleccion: 'acuaticos',
    categoria: 'pecera',
    tallas: [],
    colores: ['transparente'],
    imagenes: ['pecera-1.png', 'pecera-2.png'],
    stock: 5
  },
  {
    nombre: 'Pecera Rectangular con Peces',
    descripcion: 'Pecera rectangular con marco negro, plantas y peces de colores incluidos.',
    precio: 999,
    coleccion: 'acuaticos',
    categoria: 'pecera',
    tallas: [],
    colores: ['transparente', 'negro'],
    imagenes: ['pecera-2.png', 'pecera-1.png'],
    stock: 4
  },
  {
    nombre: 'Kit de Decoración para Pecera',
    descripcion: 'Set de plantas artificiales y piedras de colores lila y verde para acuario.',
    precio: 199,
    coleccion: 'acuaticos',
    categoria: 'decoracion',
    tallas: [],
    colores: ['lila', 'verde'],
    imagenes: ['deco-pecera-1.png', 'deco-pecera-2.png'],
    stock: 20
  },
  {
    nombre: 'Kit Castillo y Coral para Pecera',
    descripcion: 'Set de decoración con castillo y piezas de coral naranja para acuario.',
    precio: 249,
    coleccion: 'acuaticos',
    categoria: 'decoracion',
    tallas: [],
    colores: ['naranja', 'multicolor'],
    imagenes: ['deco-pecera-2.png', 'deco-pecera-1.png'],
    stock: 15
  },
  // Colección Exóticos
  {
    nombre: 'Terrario con Plantas Tropicales',
    descripcion: 'Terrario de vidrio grande con plantas tropicales incluidas. Ideal para iguanas.',
    precio: 1499,
    coleccion: 'exoticos',
    categoria: 'terrario',
    tallas: [],
    colores: ['transparente'],
    imagenes: ['terrario-1.png', 'terrario-2.png'],
    stock: 4
  },
  {
    nombre: 'Terrario de Madera y Vidrio',
    descripcion: 'Terrario con marco de madera oscura y vidrio. Diseño aesthetic y funcional.',
    precio: 1699,
    coleccion: 'exoticos',
    categoria: 'terrario',
    tallas: [],
    colores: ['madera oscura'],
    imagenes: ['terrario-2.png', 'terrario-1.png'],
    stock: 3
  },
  {
    nombre: 'Tazón de Cerámica para Reptil',
    descripcion: 'Tazón de cerámica naranja para agua o alimento de reptiles.',
    precio: 89,
    coleccion: 'exoticos',
    categoria: 'tazon',
    tallas: [],
    colores: ['naranja'],
    imagenes: ['tazon-reptil-1.png', 'tazon-reptil-2.png'],
    stock: 30
  },
  {
    nombre: 'Tazón de Piedra para Reptil',
    descripcion: 'Tazón de piedra natural oscura para agua o alimento de reptiles.',
    precio: 119,
    coleccion: 'exoticos',
    categoria: 'tazon',
    tallas: [],
    colores: ['negro'],
    imagenes: ['tazon-reptil-2.png', 'tazon-reptil-1.png'],
    stock: 25
  },
  {
    nombre: 'Transportadora Azul para Hurón',
    descripcion: 'Transportadora azul cielo con malla ventilada y asa. Cómoda y segura.',
    precio: 399,
    coleccion: 'exoticos',
    categoria: 'transportadora',
    tallas: [],
    colores: ['azul cielo'],
    imagenes: ['jaula-huron-1.png', 'jaula-huron-2.png'],
    stock: 10
  },
  {
    nombre: 'Transportadora Lila para Hurón',
    descripcion: 'Transportadora lila con malla ventilada y asa. Ligera y fácil de transportar.',
    precio: 399,
    coleccion: 'exoticos',
    categoria: 'transportadora',
    tallas: [],
    colores: ['lila'],
    imagenes: ['jaula-huron-2.png', 'jaula-huron-1.png'],
    stock: 10
  }
];

const cargarProductos = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/capishop';
    await mongoose.connect(uri);
    console.log('Conectado a MongoDB');

    // Limpia los productos existentes antes de cargar
    await Producto.deleteMany({});
    console.log('Productos anteriores eliminados');

    // Inserta los productos nuevos
    await Producto.insertMany(productos);
    console.log(`${productos.length} productos cargados correctamente`);

    mongoose.connection.close();
  } catch (error) {
    console.error('Error al cargar productos:', error.message);
    process.exit(1);
  }
};

cargarProductos();