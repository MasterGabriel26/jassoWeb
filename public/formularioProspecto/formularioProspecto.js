

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
    })};




  

  document.getElementById("eventoForm").onsubmit = function (e) {
    e.preventDefault();
  
    const camposVacios = validarCampos();
    if (camposVacios.length > 0) {
      alert("Todos los campos deben estar llenos. Te falta: " + camposVacios.join(", "));
      return;
    }
  
    generarProspecto();
  };
  
  // Función para validar que todos los campos estén llenos
  function validarCampos() {
    const camposVacios = [];
    const camposObligatorios = [];
    
 
  
    camposObligatorios.forEach(id => {
      const campo = document.getElementById(id);
      if (campo.value.trim() === "" && !campo.disabled) {
        camposVacios.push(id);
      }
    });
  
    return camposVacios;
  }
  
  // Función para obtener el texto seleccionado de un select
  function getSelectedText(selectElement) {
    return selectElement.options[selectElement.selectedIndex].text;
  }
  
  function generarFolio() {
    // Función para generar letras aleatorias
    const letrasAleatorias = (longitud) => {
        const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // Letras posibles
        let resultado = "";
        for (let i = 0; i < longitud; i++) {
            const indice = Math.floor(Math.random() * caracteres.length);
            resultado += caracteres[indice];
        }
        return resultado;
    };

    // Generar las partes del folio
    const letras = letrasAleatorias(4); // Generar 4 letras aleatorias
    const numeros = Math.floor(Math.random() * 99999).toString().padStart(5, '0'); // Generar un número aleatorio de 5 dígitos

    // Combinar letras y números
    return `${letras}${numeros}`;
}

let asesor; // Declarar la variable en un alcance superior
let nombre;
let lider;
// Asesor
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        asesor = user.uid; // Asegúrate de usar `uid`, no `id`
        
        try {
            // Obtener el documento del asesor en Firestore
            const docU = await db.collection('usuarios').doc(asesor).get();

            if (docU.exists) {
                 nombre = docU.data().name || "Sin nombre";
                 lider= docU.data().uidLiderProspectoCreado || "Sin lider";
                 // Asegúrate de que el campo es correcto
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

    // Concatenar el prefijo +52 al número de teléfono
    const telefonoConPrefijo = `+52${telefonoIngresado}`;

    try {
        // Verificar si el número ya existe
        const existeTelefono = await db.collection('prospectos')
            .where('telefono_prospecto', '==', telefonoConPrefijo)
            .get();

        if (!existeTelefono.empty) {
            alert('El número de teléfono ya está registrado. Intenta con otro.');
            return;
        }

        // Guardar datos en Firebase
        const id = db.collection('prospectos').doc().id;
        const currentTime = Date.now(); // Obtener la fecha actual en milisegundos
        const fechaEvento = document.getElementById('fecha').value
            ? new Date(document.getElementById('fecha').value).getTime()
            : null; // Convertir fecha_evento a Long o null si no se proporciona

        const prospectoData = {
            asesor: asesor,
            citaHora: null,
            colorEtiqueta: null,
            contador_llamadas: null,
            etiqueta: null,
            fechaModificacion: [null],
            fechaParaLlamada: null,
            fecha_cita: null,
            fecha_create: currentTime, // Guardar como Long
            fecha_evento: fechaEvento, // Guardar como Long
            folio: folio,
            folioMin: folio.toLowerCase(),
            horaParaLlamada: null,
            id: id,
            idPaqueteVendido: null,
            invitados: document.getElementById('invitados').value,
            llamada1: null,
            name: document.getElementById('nombre').value,
            nameMin: document.getElementById('nombre').value.toLowerCase(),
            nombreUsuarioModificador: [],
            num_llamadas: null,
            observacion: document.getElementById('observacion').value,
            pagina: getSelectedText(document.getElementById('referencia')),
            porcentaje: null,
            pregunta_por: getSelectedText(document.getElementById('lugarEvento')),
            pregunta_porMin: getSelectedText(document.getElementById('lugarEvento')).toLowerCase(),
            registro_de_pagos: null,
            segundo_telefono_prospecto: null,
            status: "PROSPECTO_CREADO",
            telefono_prospecto: telefonoConPrefijo, // Guardar con prefijo
            tipo_evento: getSelectedText(document.getElementById('tipoEvento')),
            uid: asesor,
            uidLiderProspectoCreado: lider,
            uidLider_modifyProspecto: null,
            uid_modify: null,
        };

        const prospectoMini = {
            fecha_create: currentTime, // Guardar como Long
            id: id,
            name: document.getElementById('nombre').value,
            nameMin: document.getElementById('nombre').value.toLowerCase(),
            telefono_prospecto: telefonoConPrefijo, // Guardar con prefijo
            uid: asesor,
        };

        await db.collection('prospectos').doc(id).set(prospectoData);
        console.log('Prospecto guardado en Firebase');

        await db.collection('prospectosMini').doc(id).set(prospectoMini);
        console.log('Prospecto mini guardado en Firebase');
    } catch (error) {
        console.error('Error al guardar el prospecto en Firebase:', error);
    }

    // Resetear el formulario después de generar el contrato
    resetearFormulario();

    // Mostrar un mensaje de éxito
    alert("Prospecto creado con éxito. El formulario ha sido reseteado.");
}




 function getSelectedText(selectElement) {
     return selectElement.options[selectElement.selectedIndex].text;
 }

 // Función para resetear el formulario
function resetearFormulario() {
    document.getElementById("eventoForm").reset();
}
