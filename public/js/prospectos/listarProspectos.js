
// Asegúrate de que estas líneas estén al principio de tu archivo


// Define formatearFecha in the global scope
function formatearFecha(fecha) {
  if (fecha instanceof firebase.firestore.Timestamp) {
      const date = fecha.toDate();
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  } else if (typeof fecha === "string" || typeof fecha === "number") {
      const date = new Date(fecha);
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }
  return "Fecha no disponible";
}

async function mostrarModalProspecto(prospecto, id, nombreAsesor) {
    document.getElementById("modalFolio").textContent = prospecto.folio || "Sin folio";
    document.getElementById("modalFecha").textContent = formatearFecha(prospecto.fecha_create);
    document.getElementById("modalNombre").textContent = prospecto.name || "Sin nombre";
    document.getElementById("modalTelefono").textContent = prospecto.telefono_prospecto || "Sin teléfono";
    document.getElementById("modalLlamadas").textContent = prospecto.num_llamadas || "0";
    document.getElementById("modalInvitados").textContent = prospecto.invitados || "100";
    document.getElementById("modalFechaEvento").textContent = prospecto.fecha_evento ? formatearFecha(prospecto.fecha_evento) : "Sin Fecha";
    document.getElementById("modalAsesor").textContent = nombreAsesor;
    document.getElementById("modalUltimoEditor").textContent = prospecto.nombreUsuarioModificador ? prospecto.nombreUsuarioModificador[prospecto.nombreUsuarioModificador.length - 1] : "Sin editar";
    document.getElementById("modalReferencia").textContent = prospecto.referencia || "Sin referencia";
    document.getElementById("modalPreguntoPor").textContent = prospecto.pregunta_por || "No especificado";
    document.getElementById("modalTipoEvento").textContent = prospecto.tipo_evento || "No especificado";
    document.getElementById("modalCita").textContent = prospecto.cita_hora ? formatearFecha(prospecto.cita_hora) : "Sin Cita";
    document.getElementById("modalObservaciones").textContent = prospecto.observacion || "Sin observaciones";
    
    prospectoActualId = id;
    
    // Fetch seguimiento data
    const seguimientoDoc = await db.collection("seguimientoProspectos").doc(id).get();
    console.log(seguimientoDoc)
    const seguimientoData = seguimientoDoc.exists ? seguimientoDoc.data() : {};
    console.log(seguimientoData)
    // Calculate completed steps
    let completedSteps = 0;
    pasosData.forEach((paso, index) => {
        if (seguimientoData[paso.campoCompletado]) {
            completedSteps++;
        }
    });

    const totalSteps = pasosData.length;
    const porcentaje = (completedSteps / totalSteps) * 100;

    const btnSeguimiento = document.getElementById("btnSeguimiento");
    btnSeguimiento.textContent = `Seguimiento ${prospecto.porcentaje}%`;

    btnSeguimiento.onclick = () => {
        const prospectoModal = bootstrap.Modal.getInstance(document.getElementById("prospectoModal"));
        prospectoModal.hide();
        mostrarPasoSeguimiento(completedSteps + 1);
    };
    const modal = new bootstrap.Modal(document.getElementById("prospectoModal"));
    modal.show();
    
}

// Agregar event listeners para los nuevos botones
document.getElementById("btnContactar").addEventListener("click", function() {
    // Aquí puedes añadir la lógica para contactar al prospecto
    console.log("Contactar al prospecto");
});

document.getElementById("btnPaquetes").addEventListener("click", function() {
    // Aquí puedes añadir la lógica para mostrar los paquetes
    console.log("Mostrar paquetes");
});



document.getElementById("btnPagos").addEven// Add this to your listarProspectos.js file



let pasoActual = 1;
let pasosCompletados = new Set();
let prospectoActualId = null;

// First, let's fix the collection name and add visual indicators for completed steps
async function mostrarPasoSeguimiento(paso) {
    const modal = document.getElementById('seguimientoModal');
    const data = pasosData[paso - 1];
    
    // Fetch seguimiento data from the correct collection
    const seguimientoDoc = await db.collection("seguimientoProspectos").doc(prospectoActualId).get();
    const seguimientoData = seguimientoDoc.exists ? seguimientoDoc.data() : {};

    // Update pasosCompletados based on seguimientoData
    pasosCompletados.clear();
    
    // Check completion status for each step
    if (seguimientoData.paso1_CrearProspecto) pasosCompletados.add(1);
    if (seguimientoData.paso2_llamarInformacion || seguimientoData.paso2_adjuntarEvidenciaURL?.length > 0) pasosCompletados.add(2);
    if (seguimientoData.paso3_agendarCita > 0) pasosCompletados.add(3);
    if (seguimientoData.paso4_llamarConfirmarCita || seguimientoData.paso4_adjuntarEvidenciaURL?.length > 0) pasosCompletados.add(4);
    if (seguimientoData.paso5_adjuntarCotizacionURL?.length > 0 || seguimientoData.paso5_idsPublicaciones?.length > 0) pasosCompletados.add(5);
    if (seguimientoData.paso6_fechaCitaAtendida > 0) pasosCompletados.add(6);
    if (seguimientoData.paso7_adjuntarRecibosAnticipoURL?.length > 0 && seguimientoData.paso7_revision) pasosCompletados.add(7);
    if (seguimientoData.paso8_agendarCitaParaFirmar > 0) pasosCompletados.add(8);
    if (seguimientoData.paso9_confirmacionCita) pasosCompletados.add(9);
    if (seguimientoData.paso10_firmaContratoEvidendiasURL?.length > 0 && seguimientoData.paso10_revision) pasosCompletados.add(10);
    if (seguimientoData.paso11_agendarCitaParaEntregaPorcentaje > 0) pasosCompletados.add(11);
    if (seguimientoData.paso12_atencionCitaEvidenciaRecibosURL?.length > 0 && seguimientoData.paso12_revision) pasosCompletados.add(12);
    if (seguimientoData.paso13_asignacionUsuario) pasosCompletados.add(13);
    
    // Actualizar título y contenido
    document.getElementById('pasoTitulo').textContent = `Paso ${paso}. ${data.titulo}`;
    document.getElementById('pasoContenido').textContent = data.contenido;
    
    // Actualizar acciones recomendadas
    const accionesHTML = data.accionesRecomendadas.map(accion => `<li>${accion}</li>`).join('');
    document.getElementById('accionesRecomendadas').innerHTML = `
        <h6>Acciones recomendadas:</h6>
        <ul>${accionesHTML}</ul>
    `;
    
    // Actualizar botones específicos para cada paso
    const botonesContainer = document.getElementById('botonesAccion');
    let botonesHTML = '';
    
    // Personalizar botones según el paso
    switch(paso) {
        case 5:
            botonesHTML = `
                <button class="btn btn-secondary btn-action" onclick="adjuntarArchivo(5)">
                    <i class="fas fa-paperclip me-2"></i>Adjuntar
                </button>
                <button class="btn btn-secondary btn-action" onclick="mostrarPublicaciones()">
                    <i class="fas fa-share me-2"></i>Publicaciones
                </button>
            `;
            break;
        case 7:
            botonesHTML = `
                <button class="btn btn-secondary btn-action" onclick="guardarDatosAnticipo()">
                    <i class="fas fa-save me-2"></i>Guardar
                </button>
                <button class="btn btn-secondary btn-action" onclick="adjuntarArchivo(7)">
                    <i class="fas fa-paperclip me-2"></i>Adjuntar Recibo
                </button>
            `;
            break;
        default:
            botonesHTML = data.botones.map(boton => `
                <button class="btn ${boton.clase} btn-action" onclick="${boton.accion}">
                    <i class="${boton.icono} me-2"></i>${boton.texto}
                </button>
            `).join('');
    }
    
    botonesContainer.innerHTML = botonesHTML;
    
    // Actualizar navegación
    document.getElementById('numeroPaso').textContent = `Paso ${paso} de 13`;
    document.getElementById('pasoAnterior').disabled = paso === 1;
    document.getElementById('pasoSiguiente').disabled = paso === 13;
    
    // Aplicar estado completado con el indicador visual correcto
    const contenidoContainer = document.getElementById('pasoContenido');
    const contenidoWrapper = document.createElement('div');
    contenidoWrapper.className = 'position-relative';
    contenidoWrapper.innerHTML = data.contenido;
    
    if (pasosCompletados.has(paso)) {
        const checkmark = document.createElement('div');
        checkmark.className = 'position-absolute top-0 end-0 m-3';
        checkmark.innerHTML = `<i class="fas fa-check-circle text-success" style="font-size: 2rem;"></i>`;
        contenidoWrapper.appendChild(checkmark);
    }
    
    contenidoContainer.innerHTML = '';
    contenidoContainer.appendChild(contenidoWrapper);
    
    // Mostrar modal
    if (!modal.classList.contains('show')) {
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    }
}


// Función para adjuntar archivo
// Update the adjuntarArchivo function to automatically mark steps as complete
async function adjuntarArchivo(paso) {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const storageRef = firebase.storage().ref(`prospectos/${prospectoActualId}/paso${paso}/${file.name}`);
                await storageRef.put(file);
                const downloadURL = await storageRef.getDownloadURL();
                
                // Prepare update data
                const updateData = {
                    [`paso${paso}_adjuntarEvidenciaURL`]: firebase.firestore.FieldValue.arrayUnion(downloadURL)
                };
                
                // Automatically mark step as complete when evidence is uploaded
                if (paso === 2) {
                    updateData.paso2_llamarInformacion = true;
                } else if (paso === 4) {
                    updateData.paso4_llamarConfirmarCita = true;
                }
                
                // Update the document
                await db.collection("seguimientoProspectos").doc(prospectoActualId).set(updateData, { merge: true });
                
                alert("Archivo adjuntado con éxito");
                mostrarPasoSeguimiento(paso);
            } catch (error) {
                console.error("Error al adjuntar archivo:", error);
                alert("Error al adjuntar archivo: " + error.message);
            }
        }
    };
    input.click();
}


// Función para agendar cita
let fechaCitaSeleccionada = null;


async function agendarCita(paso) {
    // Asegúrate de que tienes un elemento con id 'fecha-cita' en tu HTML
    const input = document.getElementById('fecha-cita');
    if (!input) {
        console.error('No se encontró el elemento de entrada para la fecha');
        return;
    }

    // Inicializar Flatpickr
    const fp = flatpickr(input, {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        minDate: "today",
        locale: {
            firstDayOfWeek: 1,
            weekdays: {
                shorthand: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
                longhand: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
            },
            months: {
                shorthand: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                longhand: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
            }
        }
    });

    // Mostrar el modal del calendario
    const modal = new bootstrap.Modal(document.getElementById('calendarModal'));
    modal.show();

    // Manejar el guardado de la cita
    document.getElementById('guardarCita').onclick = async function() {
        const selectedDates = fp.selectedDates;
        if (selectedDates.length > 0) {
            const fecha = selectedDates[0].getTime();
            try {
                const updateData = {};
                updateData[`paso${paso}_agendarCita`] = fecha;
                await db.collection("seguimientoProspectos").doc(prospectoActualId).update(updateData);
                alert("Cita agendada con éxito");
                modal.hide();
                mostrarPasoSeguimiento(paso);
            } catch (error) {
                console.error("Error al agendar cita:", error);
                alert("Error al agendar cita");
            }
        } else {
            alert("Por favor, selecciona una fecha y hora para la cita.");
        }
    };
}


function initializeFlatpickr() {
  flatpickr("#fecha-cita", {
    enableTime: true,
    dateFormat: "Y-m-d H:i",
    minDate: "today",
    locale: Spanish,
    time_24hr: true,
    onChange: function(selectedDates, dateStr, instance) {
      fechaCitaSeleccionada = selectedDates[0];
    }
  });
}

function mostrarCalendario(paso) {
  pasoActual = paso;
  const calendarModal = new bootstrap.Modal(document.getElementById('calendarModal'));
  calendarModal.show();
  //initializeFlatpickr(); //No longer needed, Flatpickr is initialized within agendarCita
  agendarCita(paso);
}

// Actualizar los datos de los pasos
const pasosData = [
    {
        titulo: "Crear Prospecto",
        contenido: "Registra la información inicial del prospecto en el sistema.",
        accionesRecomendadas: [
            "Ingresa los datos básicos del prospecto",
            "Verifica que toda la información sea correcta"
        ],
        botones: [],
        campoCompletado: "paso1_CrearProspecto"
    },
    {
        titulo: "Llamar para ofrecer paquetes",
        contenido: "Realiza una llamada al prospecto para ofrecer los paquetes disponibles.",
        accionesRecomendadas: [
            "Prepara un guion para la llamada",
            "Toma notas durante la conversación"
        ],
        botones: [
            { texto: "Adjuntar evidencia", icono: "fas fa-paperclip", clase: "btn-secondary", accion: "adjuntarArchivo(2)" }
        ],
        campoCompletado: "paso2_llamarInformacion"
    },
    {
        titulo: "Agendar Cita",
        contenido: "Programa una cita con el prospecto para discutir los detalles en persona.",
        accionesRecomendadas: [
            "Propón varias opciones de fecha y hora",
            "Confirma la ubicación de la cita"
        ],
        botones: [
            { texto: "Agendar cita", icono: "fas fa-calendar", clase: "btn-secondary", accion: "agendarCita(3)" }
        ],
        campoCompletado: "paso3_agendarCita"
    },  {
        titulo: "Confirmar cita dia o horas antes",
        contenido: "Reconfirma la cita programada para asegurar que el prospecto y el personal asignado esten presentes. esto ayuda a manejar mejor el tiempo y los recursos.",
        accionesRecomendadas: [
            "Realiza una llamada envia un mensaje el dia antes y unas horas antes de la cita como recordatorio.",
            "Documenta la confirmacion recibida y cualquier cambio o cancelacion."
        ],
        botones: [
            { texto: "Adjuntar evidencia", icono: "fas fa-paperclip", clase: "btn-secondary", accion: "adjuntarArchivo(2)" }
        ],
        campoCompletado: "paso4_llamarConfirmarCita"
    },  {//Aqui hay que modificar algo, pendiente, paso 5
        titulo: "Subir evidencia de paquetes ofrecidos",
        contenido: "Documenta de forma precisa que servicios fueron discutidos durante la cita, incluyendo detalles sobre paquetes, precios, y cualquier promocion o descuento ofrecido.",
        accionesRecomendadas: [
            "Manten un registro escrito y digital de la oferta presentada al prospecto. Esto inclye cotizaciones, descripciones de servicio y cualquier compromiso verbal durante la reunion."
            
        ],
        botones: [
            { texto: "Adjuntar evidencia", icono: "fas fa-paperclip", clase: "btn-secondary", accion: "adjuntarArchivo(2)" }
        ],
        campoCompletado: "paso5_adjuntarCotizacionURL"
    },   {
        titulo: "Que fecha se atendio",
        contenido: "Conduce la cita presencial de manera profesional asegurando que se aborden todas las preguntas y se proporcionen todas las explicaciones necesarias.",
        accionesRecomendadas: [
            "Prepara material visual o demostraciones si es aplicable para ayudar a ilustrar los beneficios de tus servicios. Toma notas detalladas sobre las reacciones y comentarios del prospecto para ajustar futuras interacciones y ofertas.",
           
        ],
        botones: [
            { texto: "Agendar cita", icono: "fas fa-calendar", clase: "btn-secondary", accion: "agendarCita(3)" }
        ],
        campoCompletado: "paso3_agendarCita"
    },   {//Aqui tambien hay que modificar algoo, muy pendiente paso 7
        titulo: "Subir evidencia de el anticipo",
        contenido: "Asegura la recepcion del pago de anticipo como confirmacion del interes y compromiso del prospecto hacia los servicios contratados.",
        accionesRecomendadas: [
            "Proporciona y explica claramente los termidos de pago. incluyendo cualquier condicion de reembolso o cancelacion. Asegurate de emitir un recibo oficial y almacenar una copia en los registros financieros.",
           
        ],
        botones: [
            { texto: "Guardar", icono: "fas fa-calendar", clase: "btn-secondary", accion: "agendarCita(3)" }
            ,{ texto: "Agendar cita", icono: "fas fa-calendar", clase: "btn-secondary", accion: "agendarCita(3)" }
        
        ],
        campoCompletado: "paso3_agendarCita"
    },{
        titulo: "Agendar Cita para firmar contrato",
        contenido: "Organiza una cita para la firma del contrato, asegurando que todas las partes comprendan y esten de acuerdo con los terminos y condiciones antes de proceder.",
        accionesRecomendadas: [
            "Revisa el contrato en detalle con el prospecto durante la cita, permitiendo tiempo suficiente para preguntas.",
            "Confrima que todas las partes tengan copia del contrato firmado."
        ],
        botones: [
            { texto: "Agendar cita", icono: "fas fa-calendar", clase: "btn-secondary", accion: "agendarCita(3)" }
        ],
        campoCompletado: "paso3_agendarCita"
    },{//hay que hacer cambio, paso 9
        titulo: "Confirmar cita con el prospecto hotas antes",
        contenido: "Confirma nuevamente la cita para la firma del contrato para asegurarte de que no haya cambios de ultima hora y que el prospecto este preparado y presente.",
        accionesRecomendadas: [
            "Envia un recordatorio final y verifica la hora y el lugar",
            "Prepara todos los documentos necesarios y cualquier otra cosa que necesite ser firmada o discutida."
        ],
        botones: [
            { texto: "Agendar cita", icono: "fas fa-calendar", clase: "btn-secondary", accion: "agendarCita(3)" }
        ],
        campoCompletado: "paso3_agendarCita"
    },{
        titulo: "Subir evidencia del contrato",
        contenido: "Ejecuta la firma del contrato de manera formal y profesional, asegurando que se entiendan todos los aspectos legales y practicos.",
        accionesRecomendadas: [
            "Ofrece una ultima oportunidad para resolver dudas. Documenta la firma con una fotografia o escaneo del contrato firmado",
          
        ],
        botones: [
            { texto: "Agendar cita", icono: "fas fa-calendar", clase: "btn-secondary", accion: "agendarCita(3)" }
        ],
        campoCompletado: "paso3_agendarCita"
    },{
        titulo: "Agendar Cita para recibir el pago",
        contenido: "Planifica la recepcion del siguiente pago del 30% segun el contrato. Esta es una etapa critica para mantener el flujo de caja y financiar los servicios acordados.",
        accionesRecomendadas: [
            "Coordina la cita de acuerdo con la disponibilidad del prospecto y asegurate de que comprenda los metodos de pago aceptados. ",
            "Confirma la ubicación de la cita"
        ],
        botones: [
            { texto: "Agendar cita", icono: "fas fa-calendar", clase: "btn-secondary", accion: "agendarCita(3)" }
        ],
        campoCompletado: "paso3_agendarCita"
    },{
        titulo: "Adjuntar recibo",
        contenido: "Asegura que la cita para el pago se lleve a cabo segun lo planeado y que el pago se reciba completamente y sin contratiempos.",
        accionesRecomendadas: [
            "Verifica que el pago recibido y proporciona documentacion adecuada como recibos. Asegurate de actualizar el estado del pago en el sistema para reflejar la transaccion.",
           
        ],
        botones: [
            { texto: "Agendar cita", icono: "fas fa-calendar", clase: "btn-secondary", accion: "agendarCita(3)" }
        ],
        campoCompletado: "paso3_agendarCita"
    },{
        titulo: "Asignacion de usuario y contraseña",
        contenido: "Programa una cita con el prospecto para discutir los detalles en persona.",
        accionesRecomendadas: [
            "Propón varias opciones de fecha y hora",
            "Confirma la ubicación de la cita"
        ],
        botones: [
            { texto: "Agendar cita", icono: "fas fa-calendar", clase: "btn-secondary", accion: "agendarCita(3)" }
        ],
        campoCompletado: "paso3_agendarCita"
    }



    // Add more steps here...
];

/*
document.getElementById('marcarCompletado').addEventListener('click', async () => {
    try {
        const updateData = {};
        const pasoActualData = pasosData[pasoActual - 1];
        
        if (pasoActualData.campoCompletado === "paso3_agendarCita") {
            if (seguimientoData[pasoActualData.campoCompletado] === 0) {
                alert("Por favor, agenda una cita antes de marcar este paso como completado.");
                return;
            }
            updateData[pasoActualData.campoCompletado] = seguimientoData[pasoActualData.campoCompletado];
        } else {
            updateData[pasoActualData.campoCompletado] = true;
        }
        
        await db.collection("seguimientoProspecto").doc(prospectoActualId).update(updateData);
        
        pasosCompletados.add(pasoActual);
        mostrarPasoSeguimiento(pasoActual);
        
        alert(`Paso ${pasoActual} completado exitosamente`);
    } catch (error) {
        console.error("Error al actualizar el progreso:", error);
        alert("Error al actualizar el progreso");
    }
});*/




// Event Listeners para navegación
document.getElementById('pasoAnterior').addEventListener('click', () => {
    if (pasoActual > 1) {
        pasoActual--;
        mostrarPasoSeguimiento(pasoActual);
    }
});

document.getElementById('pasoSiguiente').addEventListener('click', () => {
    if (pasoActual < 13) {
        pasoActual++;
        mostrarPasoSeguimiento(pasoActual);
    }
});

/*
document.getElementById('marcarCompletado').addEventListener('click', async () => {
    pasosCompletados.add(pasoActual);
    const porcentaje = pasoActual * 7.7;
    
    try {
        // Actualizar en Firebase
        await db.collection("prospectos").doc(prospectoActualId).update({
            porcentaje: Math.round(porcentaje)
        });
        
        // Actualizar UI
        mostrarPasoSeguimiento(pasoActual);
        
        // Mostrar notificación
        alert(`Paso ${pasoActual} completado exitosamente`);
    } catch (error) {
        console.error("Error al actualizar el progreso:", error);
        alert("Error al actualizar el progreso");
    }
})*/



document.addEventListener("DOMContentLoaded", () => {
  const filtroSelect = document.getElementById("filtro-select");
  const filtroInput = document.getElementById("filtro-input");
  const filtrarBtn = document.getElementById("filtrar-btn");
  const filtrarContainer = document.getElementById("filtrar-container");
  const prospectosLista = document.getElementById("prospectos-lista");

  let lastVisible = null;
  const pageSize = 20;
  let isLoading = false;
  let currentQuery = null;

  filtroSelect.addEventListener("change", () => {
      const filtro = filtroSelect.value;
      if (filtro === "all") {
          filtrarContainer.style.display = "none";
          filtroInput.innerHTML = "";
          resetAndLoadProspectos();
      } else {
          filtrarContainer.style.display = "block";
          setupFilterInput(filtro);
      }
  });

  filtrarBtn.addEventListener("click", () => {
      const filtro = filtroSelect.value;
      const valor = getFilterValue(filtro);
      if (valor !== null) {
          filtrarProspectos(filtro, valor);
      } else {
          alert("Por favor, ingrese un valor para filtrar.");
      }
  });

  // Evento de scroll en el contenedor de la tabla
  const tableBody = document.querySelector('.table-responsive');
  tableBody.addEventListener("scroll", () => {
      if (tableBody.scrollTop + tableBody.clientHeight >= tableBody.scrollHeight - 100) {
          cargarMasProspectos(); // Llama a la función para cargar más prospectos
      }
  });

  resetAndLoadProspectos();

  function setupFilterInput(filtro) {
      switch (filtro) {
          case "fecha_create":
              filtroInput.innerHTML = `
                  <input type="date" id="filtro-min" class="form-control mb-2" placeholder="Fecha mínima">
                  <input type="date" id="filtro-max" class="form-control" placeholder="Fecha máxima">
              `;
              break;
          case "telefono_prospecto":
              filtroInput.innerHTML = `<input type="tel" id="filtro-valor" class="form-control" style="margin-top:30px;" placeholder="Teléfono (con o sin prefijo)">`;
              break;
          default:
              filtroInput.innerHTML = `<input type="text" id="filtro-valor" class="form-control" style="margin-top:30px;" placeholder="Buscar por ${filtro}">`;
      }
  }

  async function filtrarProspectos(filtro, valor) {
      prospectosLista.innerHTML = "";
      lastVisible = null;
      let query = db.collection("prospectos");

      if (filtro === "fecha_create") {
          const maxDate = new Date(valor.max);
          maxDate.setDate(maxDate.getDate() + 1);

          query = query
              .where("fecha_create", ">=", valor.min.getTime())
              .where("fecha_create", "<", maxDate.getTime())
              .orderBy("fecha_create", "desc");
      } else if (filtro === "telefono_prospecto") {
          query = query.where(filtro, "==", valor);
      } else if (filtro === "asesor") {
          const asesoresSnapshot = await db
              .collection("usuarios")
              .where("name", ">=", valor)
              .where("name", "<=", valor + "\uf8ff")
              .get();

          if (!asesoresSnapshot.empty) {
              const asesorIds = asesoresSnapshot.docs.map((doc) => doc.id);
              query = query
                  .where("asesor", "in", asesorIds)
                  .orderBy("fecha_create", "desc");
          } else {
              alert("No se encontraron asesores que coincidan con la búsqueda.");
              return;
          }
      } else if (
          filtro === "folio" ||
          filtro === "name" ||
          filtro === "pregunta_por" ||
          filtro === "tipo_evento"
      ) {
          query = query
              .orderBy(filtro)
              .orderBy("fecha_create", "desc")
              .startAt(valor)
              .endAt(valor + "\uf8ff");
      }

      currentQuery = query;
      cargarProspectos(query);
  }

  function getFilterValue(filtro) {
      if (filtro === "fecha_create") {
          const min = document.getElementById("filtro-min").value;
          const max = document.getElementById("filtro-max").value;
          return min && max ? { min: new Date(min), max: new Date(max) } : null;
      } else {
          return document.getElementById("filtro-valor").value.trim() || null;
      }
  }

  const loaderContainer = document.getElementById('loader');
  async function cargarProspectos(query) {
      isLoading = true;
      try {
          const querySnapshot = await query.limit(pageSize).get();
          if (querySnapshot.empty) {
              prospectosLista.innerHTML =
                  "<tr><td colspan='8'>No se encontraron prospectos.</td></tr>";
          } else {
              actualizarTabla(querySnapshot.docs);
              lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
          }
      } catch (error) {
          console.error("Error al cargar prospectos:", error);
          prospectosLista.innerHTML =
              "<tr><td colspan='8'>Error al cargar prospectos. Por favor, intente de nuevo.</td></tr>";
      } finally {
          isLoading = false;
          loaderContainer.classList.add('hidden');
      }
  }

  async function cargarMasProspectos() {
      if (!lastVisible || !currentQuery || isLoading) return;

      isLoading = true;
      try {
          const querySnapshot = await currentQuery
              .startAfter(lastVisible)
              .limit(pageSize)
              .get();

          if (!querySnapshot.empty) {
              actualizarTabla(querySnapshot.docs, true);
              lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
          }
      } catch (error) {
          console.error("Error al cargar más prospectos:", error);
      } finally {
          isLoading = false;
      }
  }

  function actualizarTabla(docs, append = false) {
      if (!append) {
          prospectosLista.innerHTML = "";
      }

      docs.forEach(async (doc) => {
          const prospecto = doc.data();
          const nombreAsesor = await obtenerNombreAsesor(prospecto.asesor);
          const row = crearFilaProspecto(prospecto, doc.id, nombreAsesor);
          prospectosLista.appendChild(row);
      });
  }

  async function obtenerNombreAsesor(asesorId) {
      if (!asesorId) return "Sin asesor";
      try {
          const doc = await db.collection("usuarios").doc(asesorId).get();
          return doc.exists ? doc.data().name || "Sin nombre" : "Sin asesor";
      } catch (error) {
          console.error("Error al obtener el nombre del asesor:", error);
          return "Error al obtener asesor";
      }
  }

  function crearFilaProspecto(prospecto, id, nombreAsesor) {
      const row = document.createElement("tr");
      row.style.cursor = "pointer";
      row.addEventListener("click", () => mostrarModalProspecto(prospecto, id, nombreAsesor));
      row.innerHTML = `
          <td>${prospecto.folio || "Sin folio"}</td>
          <td>${prospecto.name || "Sin nombre"}</td>
          <td>${prospecto.telefono_prospecto || "Sin teléfono"}</td>
          <td>${prospecto.pregunta_por || "No especificado"}</td>
          <td>${prospecto.tipo_evento || "No especificado"}</td>
          <td>${nombreAsesor}</td>
          <td>${formatearFecha(prospecto.fecha_create)}</td>
      `;
      return row;
  }

  function resetAndLoadProspectos() {
      prospectosLista.innerHTML = "";
      lastVisible = null;
      currentQuery = db.collection("prospectos").orderBy("fecha_create", "desc");
      cargarProspectos(currentQuery);
  }
});
