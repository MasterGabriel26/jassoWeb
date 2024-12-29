let idEditando;

document.addEventListener("DOMContentLoaded", function () {
  // Configuración del modal con opciones personalizadas
  const modalElement = document.getElementById("crearProspectoModal");
  const modal = new bootstrap.Modal(modalElement, {
    backdrop: "static", // Previene cerrar al hacer clic afuera
    keyboard: false, // Previene cerrar con ESC
  });

  // Efecto de shake cuando se hace clic afuera
  modalElement.addEventListener("click", function (e) {
    if (e.target === modalElement) {
      applyShakeEffect(modalElement.querySelector(".modal-content"));
    }
  });

  // Animación al abrir el modal
  modalElement.addEventListener("show.bs.modal", function () {
    const modalContent = this.querySelector(".modal-content");
    modalContent.style.opacity = "0";
    modalContent.style.transform = "scale(0.7)";

    setTimeout(() => {
      modalContent.style.transition = "all 0.3s ease-out";
      modalContent.style.opacity = "1";
      modalContent.style.transform = "scale(1)";
    }, 50);
  });

  const crearProspectoBtn = document.querySelector(
    'a.btn-primary[href="formularioProspecto/formulario-prospecto.html"]'
  );

  // Populate select options
  populateSelect("tipoEvento", "eventos", "evento");
  populateSelect("lugarEvento", "lugares", "nombreLugar");
  populateSelect("referencia", "paginas", "nombrePagina");

  // Show modal instead of navigating to the form page
  crearProspectoBtn?.addEventListener("click", function (e) {
    e.preventDefault();
    modal.show();
  });

  // Handle form submission
// Modifica esta parte de tu código
document.getElementById("crearProspectoBtn")
    .addEventListener("click", async function() {
        // Validar campos requeridos
        const nombre = document.getElementById("nombre");
        const celular = document.getElementById("celular");
        const tipoEvento = document.getElementById("tipoEvento");


        // Remover clases de invalidación
        [nombre, celular, tipoEvento].forEach(el => el.classList.remove('is-invalid'));

        // Mostrar estado de carga en el botón
        this.disabled = true;
        this.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Procesando...';
        
        try {
            await generarProspecto();
         
        } catch (error) {
            showErrorMessage(error);
        } finally {
            this.disabled = false;
            this.innerHTML = document.getElementById('crearProspectoModal').getAttribute('data-mode') === 'edit' 
                ? 'Actualizar prospecto' 
                : 'Crear prospecto';
        }
    });

// Agregar eventos para quitar la clase is-invalid cuando el usuario empiece a escribir
['nombre', 'celular', 'tipoEvento'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', function() {
        this.classList.remove('is-invalid');
    });
});

  // Agregar evento al botón de editar en el modal de detalles
// Agregar evento al botón de editar en el modal de detalles
document.getElementById("btnEditar")?.addEventListener("click", async function () {
    try {
        // Primero, obtener el folio
        const folio = document.getElementById("modalFolio").textContent;
        
        // Buscar el documento por el folio para obtener el ID real
        const querySnapshot = await db.collection("prospectos")
            .where("folio", "==", folio)
            .limit(1)
            .get();

        if (querySnapshot.empty) {
            throw new Error("No se encontró el prospecto con ese folio");
        }

        // Obtener el ID real del documento
        const docId = querySnapshot.docs[0].id;

        const prospectoData = {
            id: docId, // Usar el ID real del documento
            nombre: document.getElementById("modalNombre").textContent,
            telefono: document.getElementById("modalTelefono").textContent.replace(/\D/g, ""),
            tipoEvento: document.getElementById("modalTipoEvento").textContent,
            invitados: document.getElementById("modalInvitados").textContent,
            fecha: document.getElementById("modalFechaEvento").textContent,
            preguntaPor: document.getElementById("modalPreguntoPor").textContent,
            observacion: document.getElementById("modalObservaciones").textContent,
            referencia: document.getElementById("modalReferencia").textContent,
        };

        // Cerrar modal de detalles y abrir modal de edición
        const modalDetalles = bootstrap.Modal.getInstance(
            document.getElementById("prospectoModal")
        );
        modalDetalles.hide();

        // Abrir modal de crear/editar y cargar datos
        const modalCrear = new bootstrap.Modal(
            document.getElementById("crearProspectoModal")
        );
        modalCrear.show();

        // Establecer modo edición y guardar el ID real
        document.getElementById("crearProspectoModal").setAttribute("data-mode", "edit");
        document.getElementById("crearProspectoModal").setAttribute("data-prospecto-id", docId);

        // Cargar datos en el formulario
        cargarDatosEnFormulario(prospectoData);

    } catch (error) {
        console.error("Error al preparar edición:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo preparar la edición: ' + error.message
        });
    }
});
});

// Función para cargar datos en el formulario
function cargarDatosEnFormulario(datos) {
  document.getElementById("nombre").value = datos.nombre;
  document.getElementById("celular").value = datos.telefono;
  document.getElementById("invitados").value = datos.invitados;
  document.getElementById("observacion").value = datos.observacion;

  // Convertir fecha si existe
  if (datos.fecha && datos.fecha !== "Sin Fecha") {
    try {
      const [dia, mes, anio] = datos.fecha.split("/");
      document.getElementById("fecha").value = `${anio}-${mes.padStart(
        2,
        "0"
      )}-${dia.padStart(2, "0")}`;
    } catch (e) {
      console.error("Error al convertir fecha:", e);
    }
  }

  // Seleccionar opciones en los select
  setTimeout(() => {
    seleccionarOpcionEnSelect("tipoEvento", datos.tipoEvento);
    seleccionarOpcionEnSelect("lugarEvento", datos.preguntaPor);
    seleccionarOpcionEnSelect("referencia", datos.referencia);
  }, 500); // Dar tiempo a que se carguen las opciones

  // Cambiar texto del botón
  document.getElementById("crearProspectoBtn").textContent =
    "Actualizar prospecto";
}

// Función auxiliar para seleccionar opción en select
function seleccionarOpcionEnSelect(selectId, valorABuscar) {
  const select = document.getElementById(selectId);
  for (let i = 0; i < select.options.length; i++) {
    if (
      select.options[i].text.trim().toLowerCase() ===
      valorABuscar.trim().toLowerCase()
    ) {
      select.selectedIndex = i;
      break;
    }
  }
}

// Función para aplicar el efecto shake
function applyShakeEffect(element) {
  element.style.animation = "none";
  element.offsetHeight; // Trigger reflow
  element.style.animation = "shakeEffect 0.5s ease-in-out";
}

// Función para mostrar mensaje de éxito
function showSuccessMessage() {
  Swal.fire({
    icon: "success",
    title: "¡Éxito!",
    text: "Prospecto creado correctamente",
    showConfirmButton: false,
    timer: 2000,
  }).then(() => {
    window.location.reload();
  });
}

// Función para mostrar mensaje de error
function showErrorMessage(error) {
  Swal.fire({
    icon: "error",
    title: "Error",
    text: "Hubo un problema al crear el prospecto: " + error.message,
  });
}

function populateSelect(selectId, collectionName, attribute) {
  const select = document.getElementById(selectId);
  db.collection(collectionName)
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const option = document.createElement("option");
        option.value = doc.id;
        option.textContent = doc.data()[attribute];
        select.appendChild(option);
      });
    })
    .catch((error) => {
      console.error("Error fetching data: ", error);
    });
}

let asesor; // Declarar la variable en un alcance superior
let nombre;
let lider;

// Asesor
firebase.auth().onAuthStateChanged(async (user) => {
  if (user) {
    asesor = user.uid; // Asegúrate de usar `uid`, no `id`

    try {
      const docU = await db.collection("usuarios").doc(asesor).get();
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

async function generarProspecto() {
  const isEditing =
    document.getElementById("crearProspectoModal").getAttribute("data-mode") ===
    "edit";
  const prospectoId = isEditing
    ? document
        .getElementById("crearProspectoModal")
        .getAttribute("data-prospecto-id")
    : null;


    const folio = generarFolio();
  const nombre = document.getElementById("nombre").value;
  const celular = document.getElementById("celular").value;
  const tipoEvento = document.getElementById("tipoEvento").value;
  const fecha = document.getElementById("fecha").value;
  const invitados = document.getElementById("invitados").value;
  const lugarEvento = document.getElementById("lugarEvento").value;
  const observacion = document.getElementById("observacion").value;

  try {
    if (isEditing && prospectoId) {
      // Actualizar prospecto existente
      const updateData = {
        name: nombre || "Sin nombre",
        nameMin: (nombre || "Sin nombre").toLowerCase(),
        telefono_prospecto: celular || "Sin teléfono",
        tipo_evento: getSelectedText(document.getElementById("tipoEvento")),
        fecha_evento: fecha || 0,
        invitados: invitados || "0",
        pregunta_por: getSelectedText(document.getElementById("lugarEvento")),
        pregunta_porMin: getSelectedText(document.getElementById("lugarEvento")).toLowerCase(),
        observacion: observacion || "Sin observaciones",
        pagina: getSelectedText(document.getElementById("referencia")),
        fechaModificacion: firebase.firestore.FieldValue.arrayUnion(Date.now()),
        nombreUsuarioModificador: firebase.firestore.FieldValue.arrayUnion(nombre),
        uid_modify: asesor
      };
          // Agregar console.log para verificar el ID
    console.log("ID del prospecto a editar:",prospectoId);

      await db.collection("prospectos").doc(prospectoId).update(updateData);
      console.log("Prospecto actualizado en Firebase");
    } else {
      const id = db.collection("prospectos").doc().id;
      const currentTime = Date.now();
      const fechaEvento = fecha ? new Date(fecha).getTime() : null;

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
        fecha_evento: fecha || 0,
        folio: folio,
        folioMin: folio.toLowerCase(),
        horaParaLlamada: 0,
        id: id,
        idPaqueteVendido: null,
        invitados: document.getElementById("invitados").value || "0",
        llamada1: null,
        name: document.getElementById("nombre").value || "Sin nombre",
        nameMin: (
          document.getElementById("nombre").value || "Sin nombre"
        ).toLowerCase(),
        nombreUsuarioModificador: [],
        num_llamadas: 0,
        observacion:
          document.getElementById("observacion").value || "Sin observaciones",
        pagina: getSelectedText(document.getElementById("referencia")),
        porcentaje: 7,
        pregunta_por: getSelectedText(document.getElementById("lugarEvento")),
        pregunta_porMin: getSelectedText(
          document.getElementById("lugarEvento")
        ).toLowerCase(),
        registro_de_pagos: null,
        segundo_telefono_prospecto: null,
        status: "PROSPECTO_CREADO",
        telefono_prospecto: celular || "Sin teléfono",
        tipo_evento: getSelectedText(document.getElementById("tipoEvento")),
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
        uid: asesor || null,
      };

      await db.collection("prospectos").doc(id).set(prospectoData);
      console.log("Prospecto guardado en Firebase");

      // Guardar el seguimiento
      await db.collection("seguimientoProspectos").doc(id).set(seguimientoData);
      console.log("Seguimiento guardado en Firebase");

      // Guardar el prospecto mini (si aún lo necesitas)
      const prospectoMini = {
        fecha_create: currentTime,
        id: id,
        name: prospectoData.name,
        nameMin: prospectoData.nameMin,
        telefono_prospecto: telefonoConPrefijo,
        uid: asesor || null,
        creado_en: "web",
      };
      await db.collection("prospectosMini").doc(id).set(prospectoMini);
      console.log("Prospecto mini guardado en Firebase");

    
    }



    // Cerrar modal y mostrar mensaje de éxito
    bootstrap.Modal.getInstance(document.getElementById("crearProspectoModal")).hide();

    Swal.fire({
      icon: 'success',
      title: isEditing ? 'Prospecto actualizado' : 'Prospecto creado',
      text: isEditing ? 'Los cambios se guardaron correctamente' : 'El prospecto se creó correctamente',
      showConfirmButton: false,
      timer: 2000
    }).then(() => {
      window.location.reload();
    });
  } catch (error) {
   // Log detallado del error
   console.error("Error completo:", error);
   console.error("Mensaje de error:", error.message);
   console.error("Stack trace:", error.stack);
   
   if (error.code) {
       console.error("Código de error Firebase:", error.code);
   }
   
   // Verificar valores de variables críticas
   console.log("Valores de variables importantes:");
   console.log("asesor:", asesor);
   console.log("nombre:", nombre);
   console.log("lider:", lider);
   console.log("folio:", folio);
   console.log("Modo edición:", isEditing);
   console.log("ID del prospecto:", prospectoId);
   console.log("Datos del formulario:", {
       nombre: document.getElementById("nombre").value,
       celular: document.getElementById("celular").value,
       tipoEvento: document.getElementById("tipoEvento").value,
       fecha: document.getElementById("fecha").value,
       invitados: document.getElementById("invitados").value,
       lugarEvento: document.getElementById("lugarEvento").value,
       observacion: document.getElementById("observacion").value
   });

   // Mostrar alerta con más detalles y esperar confirmación
   await Swal.fire({
       icon: 'error',
       title: 'Error en la operación',
       text: `Error: ${error.message}`,
       html: `
           <div style="text-align: left;">
               <p><strong>Tipo de error:</strong> ${error.name}</p>
               <p><strong>Mensaje:</strong> ${error.message}</p>
               <p><strong>Código:</strong> ${error.code || 'No disponible'}</p>
               <p>Consulta la consola para más detalles.</p>
           </div>
       `,
       confirmButtonText: 'Entendido',
       showCancelButton: true,
       cancelButtonText: 'Cerrar modal',
       allowOutsideClick: false
   }).then((result) => {
       if (result.isConfirmed) {
           // Mantener el modal abierto
           return;
       } else {
           // Cerrar el modal si el usuario lo desea
           bootstrap.Modal.getInstance(document.getElementById("crearProspectoModal")).hide();
       }
   });

   // Importante: lanzar el error para que se maneje en el catch superior
   throw error;;
  }
}

// Helper function to get selected text from a select element
function getSelectedText(selectElement) {
  if (selectElement.selectedIndex > 0) {
    return selectElement.options[selectElement.selectedIndex].text;
  } else {
    return selectElement.id === "tipoEvento" ? "Sin evento" : "Sin preguntar";
  }
}

// Agregar estos estilos para las animaciones
const stylei = `
@keyframes shakeEffect {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-10px); }
    40%, 80% { transform: translateX(10px); }
}

#crearProspectoModal .modal-content {
    transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}

.spinner-border {
    margin-right: 5px;
}

#crearProspectoBtn:disabled {
    cursor: not-allowed;
    opacity: 0.7;
}
`;

// Agregar los estilos
if (!document.getElementById("modal-animations")) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "modal-animations";
  styleSheet.textContent = stylei;
  document.head.appendChild(styleSheet);
}
