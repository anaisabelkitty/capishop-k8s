// Punto de entrada de la aplicación Vue
// Inicializa Vue, registra el router y monta la app en el div #app del index.html

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')