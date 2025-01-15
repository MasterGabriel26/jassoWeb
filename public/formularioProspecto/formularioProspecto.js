// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAOvefpvlXLtbTx1T2hYg2Ds56eiKI3eAk",
    authDomain: "jassodb-4b8e4.firebaseapp.com",
    databaseURL: "https://jassodb-4b8e4-default-rtdb.firebaseio.com",
    projectId: "jassodb-4b8e4",
    storageBucket: "jassodb-4b8e4.appspot.com",
    messagingSenderId: "851107842246",
    appId: "1:851107842246:web:aa155261b9acdda47e6fc7",
    measurementId: "G-N18F7GL2NG"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const storage = firebase.storage();
  const auth = firebase.auth();
  
  document.addEventListener('DOMContentLoaded', (event) => {
      populateSelect('referencia', 'paginas', 'nombrePagina');
      populateSelect('lugarEvento', 'lugares', 'nombreLugar');
      populateSelect('tipoEvento', 'eventos', 'evento');
  });
  
  function populateSelect(selectId, collectionName, attribute) {
      const select = document.getElementById(selectId);
      db.collection(collectionName).get().then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
              const option = document.createElement('option');
              option.value = doc.id;
              option.textContent = doc.data()[attribute];
              select.appendChild(option);
          });
      }).catch((error) => {
          console.error("Error fetching data: ", error);
      });
  }
  
  document.getElementById("eventoForm").onsubmit = function (e) {
      e.preventDefault();
     
     generarProspecto();
  };
  
  // Función para obtener el texto seleccionado de un select
  function getSelectedText(selectElement) {
      if (selectElement.selectedIndex > 0) {
          return selectElement.options[selectElement.selectedIndex].text;
      } else {
          switch (selectElement.id) {
              case 'referencia':
                  return "Sin referencia";
              case 'lugarEvento':
                  return "Sin preguntar";
              case 'tipoEvento':
                  return "Sin evento";
              default:
                  return null;
          }
      }
  }
  
  function generarFolio() {
    const letrasAleatorias = (longitud) => {
        const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // Letras posibles
        let resultado = "";
        for (let i = 0; i < longitud; i++) {
            const indice = Math.floor(Math.random() * caracteres.length);
            resultado += caracteres[indice];
        }
        return resultado;
    };

    const letras = letrasAleatorias(3); // Generar 3 letras aleatorias
    const numeros = Math.floor(Math.random() * 99999).toString().padStart(5, '0'); // Generar un número aleatorio de 5 dígitos

    return `P-${letras}R-${numeros}`; // Combinar letras y números con la estructura deseada
}
  
  let asesor; // Declarar la variable en un alcance superior
  let nombre;
  let lider;
  
  // Asesor
  firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
          asesor = user.uid; // Asegúrate de usar `uid`, no `id`
          
          try {
              const docU = await db.collection('usuarios').doc(asesor).get();
              if (docU.exists) {
                  nombre = docU.data().name || "Sin nombre";
                  lider = docU.data().uidLiderProspectoCreado || "Sin lider";
                  console.log(`Asesor: ${nombre}`);
              } else {
                  console.log("No se encontró el documento del usuario");
              }
          } catch (error) {
              console.error("Error al obtener datos del usuario:", error);
          }
      } else {
          console.log("Usuario no autenticado.");
      }
  });
  
  async function generarProspecto() {
      const folio = generarFolio();
      const telefonoIngresado = document.getElementById('celular').value.trim();
      const telefonoConPrefijo = telefonoIngresado ? `+52${telefonoIngresado}` : null;
  
      try {
          // Verificar si el número ya existe (solo si se proporcionó un número)
          if (telefonoConPrefijo) {
              const existeTelefono = await db.collection('prospectos')
                  .where('telefono_prospecto', '==', telefonoConPrefijo)
                  .get();
  
              if (!existeTelefono.empty) {
                  alert('El número de teléfono ya está registrado. Intenta con otro.');
                  return;
              }
          }
  
          const id = db.collection('prospectos').doc().id;
          const currentTime = Date.now();
          const fechaEvento = document.getElementById('fecha').value
              ? new Date(document.getElementById('fecha').value).getTime()
              : null;
  
          const prospectoData = {
              asesor: asesor || null,
              citaHora: 0,
              colorEtiqueta: null,
              contador_llamadas: 0,
              etiqueta: null,
              fechaModificacion: [null],
              fechaParaLlamada: 0,
              fecha_cita: 0,
              fecha_create: currentTime,
              fecha_evento: fechaEvento||0,
              folio: folio,
              folioMin: folio.toLowerCase(),
              horaParaLlamada: 0,
              id: id,
              idPaqueteVendido: null,
              invitados: document.getElementById('invitados').value || "0",
              llamada1: null,
              name: document.getElementById('nombre').value || "Sin nombre",
              nameMin: (document.getElementById('nombre').value || "Sin nombre").toLowerCase(),
              nombreUsuarioModificador: [],
              num_llamadas: 0,
              observacion: document.getElementById('observacion').value || "Sin observaciones",
              pagina: getSelectedText(document.getElementById('referencia')),
              porcentaje: 7,
              pregunta_por: getSelectedText(document.getElementById('lugarEvento')),
              pregunta_porMin: getSelectedText(document.getElementById('lugarEvento')).toLowerCase(),
              registro_de_pagos: null,
              segundo_telefono_prospecto: null,
              status: "PROSPECTO_CREADO",
              telefono_prospecto: telefonoIngresado || "Sin teléfono",
              tipo_evento: getSelectedText(document.getElementById('tipoEvento')),
              uid: asesor || null,
              uidLiderProspectoCreado: lider || null,
              uidLider_modifyProspecto: null,
              uid_modify: null,
          };
  
          const seguimientoData = {
              fechaEdicion: currentTime,
              idProspecto: id,
              paso10_firmaContratoEvidendiasURL: [],
              paso10_revision: false,
              paso11_agendarCitaParaEntregaPorcentaje: 0,
              paso12_atencionCitaEvidenciaRecibosURL: [],
              paso12_revision: false,
              paso13_asignacionUsuario: false,
              paso1_CrearProspecto: true,
              paso2_adjuntarEvidenciaURL: [],
              paso2_llamarInformacion: false,
              paso3_agendarCita: 0,
              paso4_adjuntarEvidenciaURL: [],
              paso4_llamarConfirmarCita: false,
              paso5_adjuntarCotizacionURL: [],
              paso5_descripcion: "",
              paso5_idsPublicaciones: [],
              paso6_fechaCitaAtendida: 0,
              paso7_adjuntarRecibosAnticipoURL: [],
              paso7_revision: false,
              paso8_agendarCitaParaFirmar: 0,
              paso9_confirmacionCita: "",
              porcentaje: "0",
              uid: asesor || null
          };
  
          // Guardar el prospecto
          await db.collection('prospectos').doc(id).set(prospectoData);
          console.log('Prospecto guardado en Firebase');
  
          // Guardar el seguimiento
          await db.collection('seguimientoProspectos').doc(id).set(seguimientoData);
          console.log('Seguimiento guardado en Firebase');
  
          // Guardar el prospecto mini (si aún lo necesitas)
          const prospectoMini = {
              fecha_create: currentTime,
              id: id,
              name: prospectoData.name,
              nameMin: prospectoData.nameMin,
              telefono_prospecto: telefonoConPrefijo,
              uid: asesor || null,
              creado_en: "web"
          };
          await db.collection('prospectosMini').doc(id).set(prospectoMini);
          console.log('Prospecto mini guardado en Firebase');
  
          // Resetear el formulario y mostrar mensaje de éxito
          resetearFormulario();
          alert("Prospecto creado con éxito. El formulario ha sido reseteado.");
          window.location.href="/public/page-prospectos.html"
      } catch (error) {
          console.error('Error al guardar el prospecto en Firebase:', error);
          alert("Hubo un error al crear el prospecto. Por favor, intenta de nuevo.");
      }
  }
  
  // Función para resetear el formulario
  function resetearFormulario() {
      document.getElementById("eventoForm").reset();
  }
  