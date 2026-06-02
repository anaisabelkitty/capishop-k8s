# Imagen base de Node.js versión 18 slim para reducir el tamaño
FROM node:18-slim

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia primero el package.json para aprovechar el caché de Docker
# Si no cambian las dependencias no las reinstala en cada build
COPY package.json .

# Instala las dependencias de producción
RUN npm install --production

# Copia el resto del código fuente
COPY . .

# Puerto que expone el backend
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["node", "src/index.js"]