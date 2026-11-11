
import { createApp } from 'vue'
import { defineCustomElements } from '@ionic/pwa-elements/loader'
import './style.css'
import App from './App.vue'

// Habilitar componentes de cámara en el navegador
defineCustomElements(window)

createApp(App).mount('#app')
