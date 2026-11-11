
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Network } from '@capacitor/network'
import { Camera, MediaTypeSelection } from '@capacitor/camera'

// Dirección de la API configurada en .env
const API = import.meta.env.VITE_API_URL

// Variables reactivas de los cursos
const cursos = ref([])
const estado = ref('Cargando cursos...')
const actualizado = ref('')
const cargando = ref(false)

// Estado de la conexión
const sinConexion = ref(false)
let listenerRed = null

// Variables para la fotografía
const foto = ref('')
const errorFoto = ref('')

// ----------------------------------------
// FUNCIONES PARA LOS CURSOS
// ----------------------------------------

// Consultar los cursos desde Laravel
async function cargarCursos() {
  cargando.value = true
  estado.value = 'Cargando cursos...'

  try {
    const respuesta = await fetch(`${API}/cursos-publicos`, {
      headers: {
        Accept: 'application/json'
      }
    })

    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}`)
    }

    const json = await respuesta.json()
    const lista = Array.isArray(json) ? json : json.data

    if (!Array.isArray(lista)) {
      throw new Error('La API no devolvió una lista de cursos')
    }

    cursos.value = lista
    actualizado.value = new Date().toLocaleString('es-PE')

    estado.value = lista.length === 0
      ? 'No hay cursos registrados.'
      : ''

  } catch (error) {
    console.error('Error al cargar cursos:', error)
    estado.value = 'No se pudo conectar con la API Laravel.'
  } finally {
    cargando.value = false
  }
}

// ----------------------------------------
// DETECCIÓN DE CONEXIÓN - CAPACITOR NETWORK
// ----------------------------------------

async function iniciarDetectorDeRed() {
  try {
    const estadoRed = await Network.getStatus()

    sinConexion.value = !estadoRed.connected

    listenerRed = await Network.addListener(
      'networkStatusChange',
      (nuevoEstado) => {
        sinConexion.value = !nuevoEstado.connected

        if (nuevoEstado.connected) {
          console.log('Conexión restablecida')
        } else {
          console.log('Sin conexión a Internet')
        }
      }
    )

  } catch (error) {
    console.error('Error al comprobar la conexión:', error)
  }
}

// ----------------------------------------
// CÁMARA Y GALERÍA - CAPACITOR CAMERA
// ----------------------------------------

// Elegir una fotografía de la computadora o galería
async function elegirFoto() {
  errorFoto.value = ''

  try {
    const resultado = await Camera.chooseFromGallery({
      mediaType: MediaTypeSelection.Photo,
      allowMultipleSelection: false,
      quality: 85
    })

    if (resultado.results?.length > 0) {
      foto.value = resultado.results[0].webPath
    }

  } catch (error) {
    console.error('Error al elegir foto:', error)
    errorFoto.value = 'No se pudo seleccionar la imagen.'
  }
}

// Tomar una fotografía con la cámara
async function tomarFoto() {
  errorFoto.value = ''

  try {
    const resultado = await Camera.takePhoto({
      quality: 85
    })

    if (resultado.webPath) {
      foto.value = resultado.webPath
    }

  } catch (error) {
    console.error('Error al tomar foto:', error)
    errorFoto.value = 'No se pudo tomar la fotografía.'
  }
}

// Quitar la fotografía de la pantalla
function eliminarFoto() {
  foto.value = ''
  errorFoto.value = ''
}

// ----------------------------------------
// CICLO DE VIDA DE VUE
// ----------------------------------------

onMounted(() => {
  cargarCursos()
  iniciarDetectorDeRed()
})

onUnmounted(() => {
  if (listenerRed) {
    listenerRed.remove()
  }
})
</script>

<template>
  <div class="aplicacion">

    <!-- Aviso de conexión -->
    <div
      v-if="sinConexion"
      class="aviso-sin-conexion"
      role="alert"
    >
      📵 Sin conexión — No tienes acceso a Internet
    </div>

    <!-- Encabezado principal -->
    <header class="encabezado">
      <div class="contenedor">

        <p class="etiqueta">
          INGENIERÍA WEB · LABORATORIO 10
        </p>

        <h1>Gestión de Cursos PWA</h1>

        <p>
          Cliente Vue 3 conectado a una API desarrollada con Laravel.
        </p>

      </div>
    </header>

    <main class="contenedor contenido">

      <!-- SECCIÓN DE CURSOS -->
      <section class="panel">

        <div class="panel-titulo">

          <div>
            <h2>Listado de cursos</h2>

            <p>
              Información obtenida desde nuestra API Laravel.
            </p>
          </div>

          <button
            type="button"
            @click="cargarCursos"
            :disabled="cargando"
          >
            {{ cargando ? 'Cargando...' : 'Actualizar' }}
          </button>

        </div>

        <!-- Mensajes del listado -->
        <p v-if="estado" class="mensaje">
          {{ estado }}
        </p>

        <!-- Tabla de cursos -->
        <div
          v-if="cursos.length > 0"
          class="tabla-contenedor"
        >
          <table>

            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre del curso</th>
                <th>Docente</th>
                <th>Créditos</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="curso in cursos"
                :key="curso.id"
              >
                <td>
                  {{ curso.id }}
                </td>

                <td class="nombre">
                  {{ curso.nombre }}
                </td>

                <td>
                  {{ curso.docente?.nombre ?? 'Sin docente' }}
                </td>

                <td>
                  {{ curso.creditos }}
                </td>
              </tr>
            </tbody>

          </table>
        </div>

        <!-- Resumen -->
        <div class="informacion">

          <span>
            Total de cursos: {{ cursos.length }}
          </span>

          <span v-if="actualizado">
            Última actualización: {{ actualizado }}
          </span>

        </div>

      </section>

      <!-- SECCIÓN DE FOTOGRAFÍA -->
      <section class="panel panel-fotografia">

        <div class="titulo-fotografia">
          <h2>📷 Captura de fotografía</h2>

          <p>
            Utiliza la cámara o selecciona una imagen
            de tu dispositivo para visualizarla en la aplicación.
          </p>
        </div>

        <!-- Botones -->
        <div class="botones-foto">

          <button
            type="button"
            @click="tomarFoto"
          >
            📷 Tomar foto
          </button>

          <button
            type="button"
            @click="elegirFoto"
            class="boton-galeria"
          >
            🖼️ Elegir imagen
          </button>

        </div>

        <!-- Mensaje de error -->
        <p
          v-if="errorFoto"
          class="mensaje-error-foto"
          role="alert"
        >
          {{ errorFoto }}
        </p>

        <!-- Vista previa -->
        <div
          v-if="foto"
          class="vista-previa"
        >

          <h3>Fotografía seleccionada</h3>

          <p class="texto-foto">
            La imagen se ha cargado correctamente.
          </p>

          <img
            :src="foto"
            alt="Fotografía tomada o seleccionada"
            class="imagen-foto"
          />

          <div class="acciones-foto">

            <button
              type="button"
              class="boton-eliminar"
              @click="eliminarFoto"
            >
              Eliminar fotografía
            </button>

          </div>

        </div>

        <!-- Texto inicial -->
        <div
          v-else
          class="sin-foto"
        >
          <p>
            Todavía no has seleccionado una fotografía.
          </p>
        </div>

      </section>

    </main>

    <!-- Pie de página -->
    <footer>
      Gestión de Cursos · Universidad Continental · Vue 3 + Laravel
    </footer>

  </div>
</template>

<style>
:root {
  font-family: Arial, Helvetica, sans-serif;
  color: #1e293b;
  background: #f1f5f9;
}

* {
  box-sizing: border-box;
}

body {
  display: block;
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background: #f1f5f9;
}

#app {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0;
  text-align: left;
}

.aplicacion {
  min-height: 100vh;
}

.contenedor {
  width: min(1100px, 92%);
  margin: 0 auto;
}

/* ----------------------------------------
   AVISO SIN CONEXIÓN
---------------------------------------- */

.aviso-sin-conexion {
  position: relative;
  z-index: 10;
  width: 100%;
  padding: 15px 20px;
  background: #fee2e2;
  color: #991b1b;
  text-align: center;
  font-size: 15px;
  font-weight: bold;
  border-bottom: 2px solid #ef4444;
}

/* ----------------------------------------
   ENCABEZADO
---------------------------------------- */

.encabezado {
  background: #14213d;
  color: white;
  padding: 40px 0;
}

.encabezado h1 {
  color: white;
  margin: 12px 0;
  font-size: 32px;
}

.encabezado p {
  color: #e2e8f0;
}

.encabezado .etiqueta {
  color: #facc15;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 1px;
}

/* ----------------------------------------
   CONTENIDO
---------------------------------------- */

.contenido {
  padding: 35px 0;
}

.panel {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 5px 20px #0000000d;
}

.panel-titulo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.panel-titulo h2 {
  margin: 0 0 8px;
  font-size: 23px;
}

.panel-titulo p {
  margin: 0;
  color: #64748b;
}

/* ----------------------------------------
   BOTONES
---------------------------------------- */

button {
  padding: 12px 20px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background: #1d4ed8;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ----------------------------------------
   TABLA DE CURSOS
---------------------------------------- */

.tabla-contenedor {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

th {
  background: #e2e8f0;
  color: #334155;
  text-align: left;
  padding: 14px;
}

td {
  border-bottom: 1px solid #e2e8f0;
  padding: 14px;
}

.nombre {
  font-weight: bold;
}

/* ----------------------------------------
   MENSAJES
---------------------------------------- */

.mensaje {
  padding: 15px;
  background: #eff6ff;
  border-radius: 8px;
}

/* ----------------------------------------
   INFORMACIÓN DE CURSOS
---------------------------------------- */

.informacion {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
  color: #64748b;
  font-size: 13px;
}

/* ----------------------------------------
   SECCIÓN DE FOTOGRAFÍA
---------------------------------------- */

.panel-fotografia {
  margin-top: 25px;
}

.titulo-fotografia h2 {
  margin: 0 0 12px;
  font-size: 23px;
  color: #14213d;
}

.titulo-fotografia p {
  margin: 0;
  color: #64748b;
  line-height: 1.6;
}

.botones-foto {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}

.boton-galeria {
  background: #0f766e;
}

.boton-galeria:hover {
  background: #115e59;
}

.mensaje-error-foto {
  margin-top: 20px;
  padding: 14px;
  border-radius: 8px;
  background: #fee2e2;
  color: #991b1b;
}

.sin-foto {
  margin-top: 25px;
  padding: 25px;
  border: 2px dashed #cbd5e1;
  border-radius: 10px;
  text-align: center;
  background: #f8fafc;
  color: #64748b;
}

.sin-foto p {
  margin: 0;
}

/* ----------------------------------------
   VISTA PREVIA DE LA FOTO
---------------------------------------- */

.vista-previa {
  margin-top: 25px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.vista-previa h3 {
  margin: 0 0 10px;
  color: #14213d;
  font-size: 20px;
}

.texto-foto {
  margin-bottom: 18px;
  color: #0f766e;
  font-size: 14px;
}

.imagen-foto {
  display: block;
  width: 100%;
  max-width: 450px;
  height: auto;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  object-fit: contain;
}

.acciones-foto {
  margin-top: 18px;
}

.boton-eliminar {
  background: #dc2626;
}

.boton-eliminar:hover {
  background: #b91c1c;
}

/* ----------------------------------------
   PIE DE PÁGINA
---------------------------------------- */

footer {
  text-align: center;
  padding: 25px;
  color: #64748b;
  font-size: 13px;
}

/* ----------------------------------------
   DISEÑO RESPONSIVE
---------------------------------------- */

@media (max-width: 650px) {
  .encabezado h1 {
    font-size: 25px;
  }

  .panel {
    padding: 15px;
  }

  .panel-titulo {
    flex-direction: column;
    align-items: flex-start;
  }

  th,
  td {
    padding: 10px;
    font-size: 13px;
  }

  .aviso-sin-conexion {
    font-size: 13px;
    padding: 12px;
  }

  .titulo-fotografia h2 {
    font-size: 21px;
  }

  .botones-foto {
    flex-direction: column;
  }

  .botones-foto button {
    width: 100%;
  }

  .vista-previa {
    padding: 15px;
  }
}
</style>
