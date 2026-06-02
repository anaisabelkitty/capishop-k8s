# Etapa 1: construcción de la aplicación Vue
# Usa Node.js 18 para compilar el proyecto con Vite
FROM node:20-slim AS build

WORKDIR /app

# Copia primero el package.json para aprovechar el caché de Docker
COPY package.json package-lock.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código fuente
COPY . .

# Compila la aplicación para producción
RUN npm run build

# Etapa 2: servir la aplicación con Nginx
# La imagen de Nginx sirve los archivos estáticos generados por Vite
FROM nginx:alpine

# Copia los archivos compilados al directorio de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copia la configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Puerto que expone el frontend
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]