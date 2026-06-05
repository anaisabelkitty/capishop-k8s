// Script para cargar los productos iniciales en MongoDB
require('dotenv').config();
const mongoose = require('mongoose');
const { Producto } = require('../src/routes/productos');

const productos = [
  // ==================== PERROS ====================
  {
    nombre: 'Arnés Negro para Perro',
    descripcion: 'Arnés de malla negra con hebillas metálicas y argolla central.',
    precio: 299,
    coleccion: 'perros',
    categoria: 'arnes',
    tallas: ['XS', 'S', 'M', 'L', 'XL'],
    stockPorTalla: { XS: 8, S: 12, M: 15, L: 10, XL: 5 },
    colores: ['negro'],
    imagenes: ['arnes-perro-1.png'],
    stock: 50
  },
  {
    nombre: 'Arnés Rosa para Perro',
    descripcion: 'Arnés de malla rosa con hebillas doradas y argolla central.',
    precio: 299,
    coleccion: 'perros',
    categoria: 'arnes',
    tallas: ['XS', 'S', 'M', 'L'],
    stockPorTalla: { XS: 10, S: 15, M: 12, L: 6 },
    colores: ['rosa'],
    imagenes: ['arnes-perro-2.png'],
    stock: 43
  },
  {
    nombre: 'Correa Azul Marino para Perro',
    descripcion: 'Correa de cuero azul marino con herraje metálico en la punta.',
    precio: 199,
    coleccion: 'perros',
    categoria: 'correa',
    tallas: [],
    stockPorTalla: {},
    colores: ['azul marino'],
    imagenes: ['correa-perro-1.png'],
    stock: 15
  },
  {
    nombre: 'Correa Café para Perro',
    descripcion: 'Correa de cuero café con herraje plateado en la punta.',
    precio: 199,
    coleccion: 'perros',
    categoria: 'correa',
    tallas: [],
    stockPorTalla: {},
    colores: ['café'],
    imagenes: ['correa-perro-2.png'],
    stock: 12
  },
  {
    nombre: 'Cama Redonda Gris para Perro',
    descripcion: 'Cama redonda gris de tela suave con bordes acolchados.',
    precio: 599,
    coleccion: 'perros',
    categoria: 'cama',
    tallas: ['S', 'M', 'L'],
    stockPorTalla: { S: 8, M: 10, L: 6 },
    colores: ['gris'],
    imagenes: ['cama-perro-1.png'],
    stock: 24
  },
  {
    nombre: 'Cama Rectangular Beige para Perro',
    descripcion: 'Cama rectangular beige con bordes elevados y base antideslizante.',
    precio: 649,
    coleccion: 'perros',
    categoria: 'cama',
    tallas: ['M', 'L', 'XL'],
    stockPorTalla: { M: 7, L: 9, XL: 5 },
    colores: ['beige'],
    imagenes: ['cama-perro-2.png'],
    stock: 21
  },
  {
    nombre: 'Sudadera Café para Perro',
    descripcion: 'Hoodie café de tela gruesa con bolsillo frontal y capucha.',
    precio: 249,
    coleccion: 'perros',
    categoria: 'ropa',
    tallas: ['XS', 'S', 'M', 'L'],
    stockPorTalla: { XS: 8, S: 12, M: 15, L: 7 },
    colores: ['café'],
    imagenes: ['ropa-perro-1.png'],
    stock: 42
  },
  {
    nombre: 'Hoodie Lila para Perro',
    descripcion: 'Hoodie lila con capucha y moño decorativo al frente.',
    precio: 249,
    coleccion: 'perros',
    categoria: 'ropa',
    tallas: ['XS', 'S', 'M'],
    stockPorTalla: { XS: 10, S: 14, M: 8 },
    colores: ['lila'],
    imagenes: ['ropa-perro-2.png'],
    stock: 32
  },
  {
    nombre: 'Disfraz Abeja para Perro',
    descripcion: 'Disfraz amarillo y negro con capucha y antenas de pompón.',
    precio: 279,
    coleccion: 'perros',
    categoria: 'ropa',
    tallas: ['XS', 'S', 'M', 'L'],
    stockPorTalla: { XS: 6, S: 9, M: 12, L: 5 },
    colores: ['amarillo', 'negro'],
    imagenes: ['ropa-perro-3.png'],
    stock: 32
  },
  {
    nombre: 'Disfraz Dinosaurio para Perro',
    descripcion: 'Traje verde con capucha y pinchos de tela a lo largo de la espalda.',
    precio: 299,
    coleccion: 'perros',
    categoria: 'ropa',
    tallas: ['XS', 'S', 'M', 'L'],
    stockPorTalla: { XS: 5, S: 8, M: 10, L: 6 },
    colores: ['verde'],
    imagenes: ['ropa-perro-4.png'],
    stock: 29
  },
  {
    nombre: 'Traje de Gala para Perro',
    descripcion: 'Saco negro de rayas con camisa blanca y moño negro incluido.',
    precio: 349,
    coleccion: 'perros',
    categoria: 'ropa',
    tallas: ['XS', 'S', 'M', 'L'],
    stockPorTalla: { XS: 4, S: 7, M: 9, L: 5 },
    colores: ['negro', 'blanco'],
    imagenes: ['ropa-perro-5.png'],
    stock: 25
  },
  {
    nombre: 'Vestido con Top de Mezclilla para Perro',
    descripcion: 'Vestido con top de mezclilla y falda de tul rosa en capas con moño.',
    precio: 329,
    coleccion: 'perros',
    categoria: 'ropa',
    tallas: ['XS', 'S', 'M'],
    stockPorTalla: { XS: 6, S: 10, M: 7 },
    colores: ['azul', 'rosa'],
    imagenes: ['ropa-perro-6.png'],
    stock: 23
  },
  {
    nombre: 'Snack Natural para Perro',
    descripcion: 'Bolsa de premios naturales para perro sin conservadores artificiales.',
    precio: 89,
    coleccion: 'perros',
    categoria: 'snack',
    tallas: [],
    stockPorTalla: {},
    colores: [],
    imagenes: ['snack-perro-1.png'],
    stock: 20
  },
  {
    nombre: 'Snack Dental para Perro',
    descripcion: 'Premios en forma de hueso para limpieza dental.',
    precio: 99,
    coleccion: 'perros',
    categoria: 'snack',
    tallas: [],
    stockPorTalla: {},
    colores: [],
    imagenes: ['snack-perro-2.png'],
    stock: 18
  },
  {
    nombre: 'Juguete Cuerda para Perro',
    descripcion: 'Cuerda trenzada verde y azul con nudos en los extremos.',
    precio: 119,
    coleccion: 'perros',
    categoria: 'juguete',
    tallas: [],
    stockPorTalla: {},
    colores: ['verde', 'azul'],
    imagenes: ['juguete-perro-1.png'],
    stock: 15
  },
  {
    nombre: 'Hueso de Caucho para Perro',
    descripcion: 'Hueso de caucho amarillo resistente para masticar.',
    precio: 149,
    coleccion: 'perros',
    categoria: 'juguete',
    tallas: [],
    stockPorTalla: {},
    colores: ['amarillo'],
    imagenes: ['juguete-perro-2.png'],
    stock: 18
  },
  {
    nombre: 'Jaula Metálica para Perro',
    descripcion: 'Jaula de metal plegable con bandeja extraíble y puerta frontal.',
    precio: 899,
    coleccion: 'perros',
    categoria: 'jaula',
    tallas: ['M', 'L', 'XL'],
    stockPorTalla: { M: 5, L: 8, XL: 4 },
    colores: ['negro'],
    imagenes: ['jaula-perro-1.png'],
    stock: 17
  },
  {
    nombre: 'Transportadora para Perro',
    descripcion: 'Transportadora rígida color salmón con puerta de rejilla metálica.',
    precio: 599,
    coleccion: 'perros',
    categoria: 'transportadora',
    tallas: ['S', 'M', 'L'],
    stockPorTalla: { S: 6, M: 9, L: 5 },
    colores: ['salmón'],
    imagenes: ['transportadora-perro-1.png'],
    stock: 20
  },
  // ==================== GATOS ====================
  {
    nombre: 'Arnés Lila para Gato',
    descripcion: 'Arnés acolchado lila con hebillas plateadas ajustables.',
    precio: 279,
    coleccion: 'gatos',
    categoria: 'arnes',
    tallas: ['XS', 'S', 'M'],
    stockPorTalla: { XS: 9, S: 13, M: 7 },
    colores: ['lila'],
    imagenes: ['arnes-gato-1.png'],
    stock: 29
  },
  {
    nombre: 'Arnés Azul Cielo para Gato',
    descripcion: 'Arnés acolchado azul cielo con hebillas plateadas ajustables.',
    precio: 279,
    coleccion: 'gatos',
    categoria: 'arnes',
    tallas: ['XS', 'S', 'M'],
    stockPorTalla: { XS: 7, S: 11, M: 6 },
    colores: ['azul cielo'],
    imagenes: ['arnes-gato-2.png'],
    stock: 24
  },
  {
    nombre: 'Rascador Torre para Gato',
    descripcion: 'Torre rascadora naranja con plataformas y juguetes colgantes.',
    precio: 899,
    coleccion: 'gatos',
    categoria: 'rascador',
    tallas: [],
    stockPorTalla: {},
    colores: ['naranja'],
    imagenes: ['rascador-gato-1.png'],
    stock: 8
  },
  {
    nombre: 'Rascador Cactus para Gato',
    descripcion: 'Rascador en forma de cactus verde con cuerda de sisal.',
    precio: 499,
    coleccion: 'gatos',
    categoria: 'rascador',
    tallas: [],
    stockPorTalla: {},
    colores: ['verde'],
    imagenes: ['rascador-gato-2.png'],
    stock: 12
  },
  {
    nombre: 'Varita con Plumas para Gato',
    descripcion: 'Varita con plumas rosas en la punta.',
    precio: 129,
    coleccion: 'gatos',
    categoria: 'juguete',
    tallas: [],
    stockPorTalla: {},
    colores: ['rosa'],
    imagenes: ['juguete-gato-1.png'],
    stock: 20
  },
  {
    nombre: 'Pista Circular para Gato',
    descripcion: 'Pista circular azul con pelota interior giratoria.',
    precio: 179,
    coleccion: 'gatos',
    categoria: 'juguete',
    tallas: [],
    stockPorTalla: {},
    colores: ['azul'],
    imagenes: ['juguete-gato-2.png'],
    stock: 15
  },
  {
    nombre: 'Snack Natural para Gato',
    descripcion: 'Bolsa de premios naturales para gato.',
    precio: 89,
    coleccion: 'gatos',
    categoria: 'snack',
    tallas: [],
    stockPorTalla: {},
    colores: [],
    imagenes: ['snack-gato-1.png'],
    stock: 20
  },
  {
    nombre: 'Snack Sticks para Gato',
    descripcion: 'Bolsa de sticks de pollo para gato.',
    precio: 99,
    coleccion: 'gatos',
    categoria: 'snack',
    tallas: [],
    stockPorTalla: {},
    colores: [],
    imagenes: ['snack-gato-2.png'],
    stock: 18
  },
  {
    nombre: 'Playera de Rayas Pastel para Gato',
    descripcion: 'Playera sin mangas de rayas en colores pastel: rosa, amarillo, verde y lila.',
    precio: 199,
    coleccion: 'gatos',
    categoria: 'ropa',
    tallas: ['XS', 'S', 'M'],
    stockPorTalla: { XS: 8, S: 12, M: 7 },
    colores: ['multicolor'],
    imagenes: ['ropa-gato-1.png'],
    stock: 27
  },
  {
    nombre: 'Playera de Rayas Naranja para Gato',
    descripcion: 'Playera sin mangas de rayas naranja y gris.',
    precio: 199,
    coleccion: 'gatos',
    categoria: 'ropa',
    tallas: ['XS', 'S', 'M'],
    stockPorTalla: { XS: 6, S: 10, M: 8 },
    colores: ['naranja', 'gris'],
    imagenes: ['ropa-gato-2.png'],
    stock: 24
  },
  {
    nombre: 'Suéter de Punto Rojo para Gato',
    descripcion: 'Suéter de punto rojo con cuello alto y mangas largas.',
    precio: 229,
    coleccion: 'gatos',
    categoria: 'ropa',
    tallas: ['XS', 'S', 'M'],
    stockPorTalla: { XS: 5, S: 9, M: 6 },
    colores: ['rojo'],
    imagenes: ['ropa-gato-3.png'],
    stock: 20
  },
  {
    nombre: 'Cama Canasta de Mimbre para Gato',
    descripcion: 'Canasta redonda de mimbre con cojín blanco interior y asas a los lados.',
    precio: 749,
    coleccion: 'gatos',
    categoria: 'cama',
    tallas: [],
    stockPorTalla: {},
    colores: ['natural'],
    imagenes: ['cama-gato-2.png'],
    stock: 8
  },
  {
    nombre: 'Casita Tipi para Gato',
    descripcion: 'Casita tipi mostaza con estructura de madera, pompones blancos y cojín interior.',
    precio: 699,
    coleccion: 'gatos',
    categoria: 'cama',
    tallas: [],
    stockPorTalla: {},
    colores: ['mostaza'],
    imagenes: ['cama-gato-1.png'],
    stock: 6
  },
  {
    nombre: 'Transportadora Café para Gato',
    descripcion: 'Transportadora rígida color salmón con puerta de rejilla metálica.',
    precio: 549,
    coleccion: 'gatos',
    categoria: 'transportadora',
    tallas: [],
    stockPorTalla: {},
    colores: ['salmón'],
    imagenes: ['transportadora-gato-2.png'],
    stock: 10
  },
  {
    nombre: 'Mochila Burbuja para Gato',
    descripcion: 'Mochila negra con ventana circular transparente en el frente.',
    precio: 799,
    coleccion: 'gatos',
    categoria: 'transportadora',
    tallas: [],
    stockPorTalla: {},
    colores: ['negro'],
    imagenes: ['transportadora-gato-1.png'],
    stock: 8
  },
  // ==================== ROEDORES ====================
  {
    nombre: 'Jaula Blanca para Hámster',
    descripcion: 'Jaula blanca con rueda naranja, comedero y bebedero incluidos.',
    precio: 449,
    coleccion: 'roedores',
    categoria: 'jaula',
    tallas: [],
    stockPorTalla: {},
    colores: ['blanco', 'naranja'],
    imagenes: ['jaula-hamster-1.png'],
    stock: 10
  },
  {
    nombre: 'Jaula Acrílica para Hámster',
    descripcion: 'Jaula acrílica transparente con accesorios lila y verde.',
    precio: 499,
    coleccion: 'roedores',
    categoria: 'jaula',
    tallas: [],
    stockPorTalla: {},
    colores: ['transparente'],
    imagenes: ['jaula-hamster-2.png'],
    stock: 8
  },
  {
    nombre: 'Rueda de Ejercicio Naranja para Hámster',
    descripcion: 'Rueda transparente con base naranja.',
    precio: 149,
    coleccion: 'roedores',
    categoria: 'rueda',
    tallas: [],
    stockPorTalla: {},
    colores: ['naranja'],
    imagenes: ['rueda-hamster-1.png'],
    stock: 20
  },
  {
    nombre: 'Rueda de Ejercicio Lila para Hámster',
    descripcion: 'Rueda silenciosa de color lila.',
    precio: 149,
    coleccion: 'roedores',
    categoria: 'rueda',
    tallas: [],
    stockPorTalla: {},
    colores: ['lila'],
    imagenes: ['rueda-hamster-2.png'],
    stock: 15
  },
  {
    nombre: 'Arnés para Roedor',
    descripcion: 'Arnés gris de malla ajustable para conejos y cobayas.',
    precio: 179,
    coleccion: 'roedores',
    categoria: 'arnes',
    tallas: ['XS', 'S'],
    stockPorTalla: { XS: 10, S: 14 },
    colores: ['gris'],
    imagenes: ['arnes-roedor-1.png'],
    stock: 24
  },
  {
    nombre: 'Transportadora para Roedor',
    descripcion: 'Transportadora de tela café con ventana de malla y asa superior.',
    precio: 349,
    coleccion: 'roedores',
    categoria: 'transportadora',
    tallas: [],
    stockPorTalla: {},
    colores: ['café'],
    imagenes: ['transportadora-roedor-1.png'],
    stock: 10
  },
  // ==================== AVES ====================
  {
    nombre: 'Jaula Dorada para Pájaro',
    descripcion: 'Jaula decorativa dorada con percha de madera y base redonda.',
    precio: 799,
    coleccion: 'aves',
    categoria: 'jaula',
    tallas: [],
    stockPorTalla: {},
    colores: ['dorado'],
    imagenes: ['jaula-pajaro-1.png'],
    stock: 6
  },
  {
    nombre: 'Jaula Plateada para Pájaro',
    descripcion: 'Jaula rectangular plateada con percha de madera y comederos.',
    precio: 699,
    coleccion: 'aves',
    categoria: 'jaula',
    tallas: [],
    stockPorTalla: {},
    colores: ['plateado'],
    imagenes: ['jaula-pajaro-2.png'],
    stock: 8
  },
  {
    nombre: 'Columpio de Madera para Pájaro',
    descripcion: 'Columpio de madera con cuentas de colores colgantes.',
    precio: 129,
    coleccion: 'aves',
    categoria: 'juguete',
    tallas: [],
    stockPorTalla: {},
    colores: ['multicolor'],
    imagenes: ['juguete-pajaro-1.png'],
    stock: 20
  },
  {
    nombre: 'Escalera de Colores para Pájaro',
    descripcion: 'Escalera de madera con peldaños pintados de colores.',
    precio: 99,
    coleccion: 'aves',
    categoria: 'juguete',
    tallas: [],
    stockPorTalla: {},
    colores: ['multicolor'],
    imagenes: ['juguete-pajaro-2.png'],
    stock: 18
  },
  {
    nombre: 'Bebedero para Pájaro',
    descripcion: 'Bebedero azul con clip para sujetar a la jaula.',
    precio: 79,
    coleccion: 'aves',
    categoria: 'tazon',
    tallas: [],
    stockPorTalla: {},
    colores: ['azul'],
    imagenes: ['bebedero-pajaro-1.png'],
    stock: 20
  },
  {
    nombre: 'Comedero Casa para Pájaro',
    descripcion: 'Comedero transparente en forma de casita con ventosas.',
    precio: 149,
    coleccion: 'aves',
    categoria: 'tazon',
    tallas: [],
    stockPorTalla: {},
    colores: ['transparente'],
    imagenes: ['comedero-pajaro-1.png'],
    stock: 15
  },
  // ==================== ACUÁTICOS ====================
  {
    nombre: 'Pecera con Plantas',
    descripcion: 'Pecera de vidrio con plantas acuáticas y sustrato de colores.',
    precio: 899,
    coleccion: 'acuaticos',
    categoria: 'pecera',
    tallas: [],
    stockPorTalla: {},
    colores: ['transparente'],
    imagenes: ['pecera-1.png'],
    stock: 5
  },
  {
    nombre: 'Pecera Rectangular',
    descripcion: 'Pecera rectangular de vidrio con marco negro y sustrato de grava.',
    precio: 999,
    coleccion: 'acuaticos',
    categoria: 'pecera',
    tallas: [],
    stockPorTalla: {},
    colores: ['transparente', 'negro'],
    imagenes: ['pecera-2.png'],
    stock: 4
  },
  {
    nombre: 'Decoración Plantas para Pecera',
    descripcion: 'Set de plantas artificiales lila y verde con piedras decorativas.',
    precio: 199,
    coleccion: 'acuaticos',
    categoria: 'decoracion',
    tallas: [],
    stockPorTalla: {},
    colores: ['lila', 'verde'],
    imagenes: ['deco-pecera-1.png'],
    stock: 15
  },
  {
    nombre: 'Decoración Castillo para Pecera',
    descripcion: 'Set de castillo y coral naranja para acuario.',
    precio: 249,
    coleccion: 'acuaticos',
    categoria: 'decoracion',
    tallas: [],
    stockPorTalla: {},
    colores: ['naranja'],
    imagenes: ['deco-pecera-2.png'],
    stock: 12
  },
  {
    nombre: 'Alimento para Peces',
    descripcion: 'Alimento en hojuelas para peces tropicales.',
    precio: 89,
    coleccion: 'acuaticos',
    categoria: 'snack',
    tallas: [],
    stockPorTalla: {},
    colores: [],
    imagenes: ['comida-peces-1.png'],
    stock: 20
  },
  {
    nombre: 'Alimento para Tortuga',
    descripcion: 'Alimento en pellets para tortugas acuáticas.',
    precio: 99,
    coleccion: 'acuaticos',
    categoria: 'snack',
    tallas: [],
    stockPorTalla: {},
    colores: [],
    imagenes: ['comida-tortuga-1.png'],
    stock: 18
  },
  // ==================== EXÓTICOS ====================
  {
    nombre: 'Terrario con Plantas',
    descripcion: 'Terrario de vidrio con plantas tropicales y sustrato incluidos.',
    precio: 1499,
    coleccion: 'exoticos',
    categoria: 'terrario',
    tallas: [],
    stockPorTalla: {},
    colores: ['transparente'],
    imagenes: ['terrario-1.png'],
    stock: 4
  },
  {
    nombre: 'Terrario de Madera',
    descripcion: 'Terrario con estructura de madera oscura y paneles de vidrio.',
    precio: 1699,
    coleccion: 'exoticos',
    categoria: 'terrario',
    tallas: [],
    stockPorTalla: {},
    colores: ['madera oscura'],
    imagenes: ['terrario-2.png'],
    stock: 3
  },
  {
    nombre: 'Tazón Naranja para Reptil',
    descripcion: 'Tazón de cerámica naranja para agua o alimento.',
    precio: 89,
    coleccion: 'exoticos',
    categoria: 'tazon',
    tallas: [],
    stockPorTalla: {},
    colores: ['naranja'],
    imagenes: ['tazon-reptil-1.png'],
    stock: 20
  },
  {
    nombre: 'Tazón Negro para Reptil',
    descripcion: 'Tazón de piedra negra para agua o alimento.',
    precio: 119,
    coleccion: 'exoticos',
    categoria: 'tazon',
    tallas: [],
    stockPorTalla: {},
    colores: ['negro'],
    imagenes: ['tazon-reptil-2.png'],
    stock: 15
  },
  {
    nombre: 'Transportadora Azul para Hurón',
    descripcion: 'Transportadora azul cielo con malla ventilada y asa superior.',
    precio: 399,
    coleccion: 'exoticos',
    categoria: 'transportadora',
    tallas: [],
    stockPorTalla: {},
    colores: ['azul cielo'],
    imagenes: ['jaula-huron-1.png'],
    stock: 10
  },
  {
    nombre: 'Transportadora Lila para Hurón',
    descripcion: 'Transportadora lila con malla ventilada y asa superior.',
    precio: 399,
    coleccion: 'exoticos',
    categoria: 'transportadora',
    tallas: [],
    stockPorTalla: {},
    colores: ['lila'],
    imagenes: ['jaula-huron-2.png'],
    stock: 10
  }
];

const cargarProductos = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/capishop';
    await mongoose.connect(uri);
    console.log('Conectado a MongoDB');
    await Producto.deleteMany({});
    console.log('Productos anteriores eliminados');
    await Producto.insertMany(productos);
    console.log(`${productos.length} productos cargados correctamente`);
    mongoose.connection.close();
  } catch (error) {
    console.error('Error al cargar productos:', error.message);
    process.exit(1);
  }
};

cargarProductos();