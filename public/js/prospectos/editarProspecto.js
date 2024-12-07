// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAOvefpvlXLtbTx1T2hYg2Ds56eiKI3eAk",
    authDomain: "jassodb-4b8e4.firebaseapp.com",
    projectId: "jassodb-4b8e4",
    storageBucket: "jassodb-4b8e4.appspot.com",
    messagingSenderId: "851107842246",
    appId: "1:851107842246:web:aa155261b9acdda47e6fc7"
  };
  
  // Inicializar Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const auth = firebase.auth();
  
  // Obtener el ID del prospecto de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const prospectoId = urlParams.get('id');
  
  // Función para cargar opciones en un select y seleccionar la opción actual
  async function cargarOpciones(selectId, coleccion, campoNombre, valorActual) {
      const select = document.getElementById(selectId);
      select.innerHTML = ''; // Limpiar opciones existentes
      
      const querySnapshot = await db.collection(coleccion).get();
      
      querySnapshot.forEach((doc) => {
          const option = document.createElement('option');
          option.value = doc.data()[campoNombre];
          option.textContent = doc.data()[campoNombre];
          if (doc.data()[campoNombre] === valorActual) {
              option.selected = true;
          }
          select.appendChild(option);
      });
  
      // Si el valor actual no está en la lista, añadirlo como una opción
      if (!Array.from(select.options).some(option => option.value === valorActual)) {
          const option = document.createElement('option');
          option.value = valorActual;
          option.textContent = valorActual;
          option.selected = true;
          select.appendChild(option);
      }
  }
  
  // Función para cargar los datos del prospecto
  async function cargarDatosProspecto() {
      try {
          const doc = await db.collection("prospectos").doc(prospectoId).get();
          if (doc.exists) {
              const data = doc.data();
              document.getElementById("name").value = data.name || '';
              document.getElementById("telefono_prospecto").value = data.telefono_prospecto || '';
              document.getElementById("invitados").value = data.invitados || '';
              document.getElementById("observacion").value = data.observacion || '';
              document.getElementById("fecha_evento").value = data.fecha_evento ? new Date(data.fecha_evento).toISOString().split('T')[0] : '';
              document.getElementById("status").value = data.status || '';
  
              // Cargar opciones para los selects
              await cargarOpciones('pagina', 'paginas', 'nombrePagina', data.pagina);
              await cargarOpciones('pregunta_por', 'lugares', 'nombreLugar', data.pregunta_por);
              await cargarOpciones('tipo_evento', 'eventos', 'evento', data.tipo_evento);
          } else {
              console.log("No se encontró el documento");
          }
      } catch (error) {
          console.log("Error obteniendo el documento:", error);
      }
  }
  
  // Cargar los datos cuando la página se cargue
  document.addEventListener('DOMContentLoaded', cargarDatosProspecto);
  
  // Manejar la actualización del prospecto
  document.getElementById('editarProspectoForm').addEventListener('submit', function(e) {
      e.preventDefault();
  
      const datosActualizados = {
          name: document.getElementById("name").value,
          telefono_prospecto: document.getElementById("telefono_prospecto").value,
          pagina: document.getElementById("pagina").value,
          pregunta_por: document.getElementById("pregunta_por").value,
          invitados: document.getElementById("invitados").value,
          observacion: document.getElementById("observacion").value,
          tipo_evento: document.getElementById("tipo_evento").value,
          fecha_evento: new Date(document.getElementById("fecha_evento").value).getTime(),
          uid_modify: auth.currentUser.uid,
          fechaModificacion: firebase.firestore.FieldValue.serverTimestamp()
      };
  
      db.collection("prospectos").doc(prospectoId).update(datosActualizados)
      .then(() => {
          alert("Prospecto actualizado con éxito");
          window.location.href = "/static/page-prospectoss.html";
      })
      .catch((error) => {
          console.error("Error actualizando el documento: ", error);
          alert("Error al actualizar el prospecto");
      });
  });