let isLoading = false;
let attachmentSuccess = false;
let archivoAdjunto = null;
let pasoActual = 0; // Cambia este valor dependiendo del paso en el que estés

// Define formatearFecha in the global scope
let pasosCompletados = new Set();
function formatearFecha(fecha) {
  if (fecha instanceof firebase.firestore.Timestamp) {
    const date = fecha.toDate();
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  } else if (typeof fecha === "string" || typeof fecha === "number") {
    const date = new Date(fecha);
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  }
  return "Fecha no disponible";
}

async function mostrarModalProspecto(prospecto, id, nombreAsesor) {
  document.getElementById("modalFolio").textContent =
    prospecto.folio || "Sin folio";
  document.getElementById("modalFecha").textContent = formatearFecha(
    prospecto.fecha_create
  );
  document.getElementById("modalNombre").textContent =
    prospecto.name || "Sin nombre";
  document.getElementById("modalTelefono").textContent =
    prospecto.telefono_prospecto || "Sin teléfono";
  document.getElementById("modalLlamadas").textContent =
    prospecto.num_llamadas || "0";
  document.getElementById("modalInvitados").textContent =
    prospecto.invitados || "100";
  document.getElementById("modalFechaEvento").textContent =
    prospecto.fecha_evento
      ? formatearFecha(prospecto.fecha_evento)
      : "Sin Fecha";
  document.getElementById("modalAsesor").textContent = nombreAsesor;
  document.getElementById("modalUltimoEditor").textContent =
    prospecto.nombreUsuarioModificador
      ? prospecto.nombreUsuarioModificador[
          prospecto.nombreUsuarioModificador.length - 1
        ]
      : "Sin editar";
  document.getElementById("modalReferencia").textContent =
    prospecto.referencia || "Sin referencia";
  document.getElementById("modalPreguntoPor").textContent =
    prospecto.pregunta_por || "No especificado";
  document.getElementById("modalTipoEvento").textContent =
    prospecto.tipo_evento || "No especificado";
  document.getElementById("modalCita").textContent = prospecto.cita_hora
    ? formatearFecha(prospecto.cita_hora)
    : "Sin Cita";
  document.getElementById("modalObservaciones").textContent =
    prospecto.observacion || "Sin observaciones";

  prospectoActualId = id;

  // Fetch seguimiento data
  const seguimientoDoc = await db
    .collection("seguimientoProspectos")
    .doc(id)
    .get();
  console.log(seguimientoDoc);
  const seguimientoData = seguimientoDoc.exists ? seguimientoDoc.data() : {};
  console.log(seguimientoData);
  // Calculate completed steps
  pasosCompletados = new Set();
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
  btnSeguimiento.onclick = async () => {
    const prospectoModal = bootstrap.Modal.getInstance(
      document.getElementById("prospectoModal")
    );
    prospectoModal.hide();
    const seguimientoDoc = await db
      .collection("seguimientoProspectos")
      .doc(id)
      .get();
    const seguimientoData = seguimientoDoc.exists ? seguimientoDoc.data() : {};
    const pasoToShow = calcularPasoInicial(seguimientoData);
    mostrarPasoSeguimiento(pasoToShow);
  };

  function calcularPaso(porcentaje) {
    if (porcentaje <= 7) return 2;
    if (porcentaje <= 15) return 3;
    if (porcentaje <= 23) return 4;
    if (porcentaje <= 32) return 5;
    if (porcentaje <= 38) return 6;
    if (porcentaje <= 46) return 7;
    if (porcentaje <= 54) return 8;
    if (porcentaje <= 62) return 9;
    if (porcentaje <= 69) return 10;
    if (porcentaje <= 77) return 11;
    if (porcentaje <= 85) return 12;
    if (porcentaje <= 92) return 13;
    return 13; // Para 93% o más
  }

  const modal = new bootstrap.Modal(document.getElementById("prospectoModal"), {
    backdrop: "static",
    keyboard: false,
  });
  modal.show();
}

function calcularPasoInicial(seguimientoData) {
  // Check each step in order
  if (!seguimientoData.paso1_CrearProspecto) return 1;
  if (
    !seguimientoData.paso2_llamarInformacion &&
    !seguimientoData.paso2_adjuntarEvidenciaURL?.length
  )
    return 2;
  if (!seguimientoData.paso3_agendarCita) return 3;
  if (
    !seguimientoData.paso4_llamarConfirmarCita &&
    !seguimientoData.paso4_adjuntarEvidenciaURL?.length
  )
    return 4;
  if (
    !seguimientoData.paso5_adjuntarCotizacionURL?.length &&
    !seguimientoData.paso5_idsPublicaciones?.length &&
    !seguimientoData.paso5_descripcion
  )
    return 5;
  if (!seguimientoData.paso6_fechaCitaAtendida) return 6;
  if (
    !seguimientoData.paso7_adjuntarRecibosAnticipoURL?.length ||
    !seguimientoData.paso7_revision
  )
    return 7;
  if (!seguimientoData.paso8_agendarCitaParaFirmar) return 8;
  if (!seguimientoData.paso9_confirmacionCita) return 9;
  if (
    !seguimientoData.paso10_firmaContratoEvidendiasURL?.length ||
    !seguimientoData.paso10_revision
  )
    return 10;
  if (!seguimientoData.paso11_agendarCitaParaEntregaPorcentaje) return 11;
  if (
    !seguimientoData.paso12_atencionCitaEvidenciaRecibosURL?.length &&
    !seguimientoData.paso12_revision
  )
    return 12;
  if (!seguimientoData.paso13_asignacionUsuario) return 13;

  // If all steps are completed, return the last step
  return 13;
}

let tempStep5Data = {
  file: null,
  description: "",
};

async function mostrarPasoSeguimiento(paso) {
  if (typeof pasosCompletados === "undefined") {
    pasosCompletados = new Set();
  }
  if (!paso) {
    const seguimientoDoc = await db
      .collection("seguimientoProspectos")
      .doc(prospectoActualId)
      .get();
    const seguimientoData = seguimientoDoc.exists ? seguimientoDoc.data() : {};
    paso = calcularPasoInicial(seguimientoData);
  }
  pasoActual = paso;
  const modal = document.getElementById("seguimientoModal");
  const data = pasosData[paso - 1];

  // Fetch seguimiento data from the correct collection
  const seguimientoDoc = await db
    .collection("seguimientoProspectos")
    .doc(prospectoActualId)
    .get();
  const seguimientoData = seguimientoDoc.exists ? seguimientoDoc.data() : {};

  // Update pasosCompletados based on seguimientoData
  pasosCompletados.clear();

  // Check completion status for each step
  if (seguimientoData.paso1_CrearProspecto) pasosCompletados.add(1);
  if (
    seguimientoData.paso2_llamarInformacion ||
    seguimientoData.paso2_adjuntarEvidenciaURL?.length > 0
  )
    pasosCompletados.add(2);
  if (seguimientoData.paso3_agendarCita > 0) pasosCompletados.add(3);
  if (
    seguimientoData.paso4_llamarConfirmarCita ||
    seguimientoData.paso4_adjuntarEvidenciaURL?.length > 0
  )
    pasosCompletados.add(4);
  if (
    seguimientoData.paso5_adjuntarCotizacionURL?.length > 0 ||
    seguimientoData.paso5_idsPublicaciones?.length > 0 ||
    seguimientoData.paso5_descripcion
  )
    pasosCompletados.add(5);
  if (seguimientoData.paso6_fechaCitaAtendida > 0) pasosCompletados.add(6);
  if (
    seguimientoData.paso7_adjuntarRecibosAnticipoURL?.length > 0 &&
    seguimientoData.paso7_revision
  )
    pasosCompletados.add(7);
  if (seguimientoData.paso8_agendarCitaParaFirmar > 0) pasosCompletados.add(8);
  if (seguimientoData.paso9_confirmacionCita) pasosCompletados.add(9);
  if (
    seguimientoData.paso10_firmaContratoEvidendiasURL?.length > 0 &&
    seguimientoData.paso10_revision
  )
    pasosCompletados.add(10);
  if (seguimientoData.paso11_agendarCitaParaEntregaPorcentaje > 0)
    pasosCompletados.add(11);
  if (
    seguimientoData.paso12_atencionCitaEvidenciaRecibosURL?.length > 0 ||
    seguimientoData.paso12_revision
  )
    pasosCompletados.add(12);
  if (seguimientoData.paso13_asignacionUsuario) pasosCompletados.add(13);

  // Actualizar título y contenido
  document.getElementById(
    "pasoTitulo"
  ).textContent = `Paso ${paso}. ${data.titulo}`;
  document.getElementById("pasoContenido").textContent = data.contenido;

  // Actualizar acciones recomendadas
  const accionesHTML = data.accionesRecomendadas
    .map((accion) => `<li>${accion}</li>`)
    .join("");
  document.getElementById("accionesRecomendadas").innerHTML = `
        <h6>Acciones recomendadas:</h6>
        <ul>${accionesHTML}</ul>
    `;

  // Actualizar botones específicos para cada paso
  const botonesContainer = document.getElementById("botonesAccion");
  let botonesHTML = "";

  // Personalizar botones según el paso
  switch (paso) {
    case 10:
      if (
        seguimientoData.paso10_revision ||
        seguimientoData.paso10_firmaContratoEvidendiasURL?.length > 0
      ) {
        if (seguimientoData.paso10_revision) {
          botonesHTML = `
                <div class="contract-status success">
                    <div class="status-badge">
                        <i class="fas fa-file-signature"></i>
                        <span>Contrato firmado y verificado</span>
                    </div>
                    <div class="status-message">
                        <i class="fas fa-check-circle"></i>
                        <span>Documentación completa y validada</span>
                    </div>
                </div>
            `;
        } else {
          botonesHTML = `
                <div class="contract-status pending">
                    <div class="status-badge">
                        <i class="fas fa-clock"></i>
                        <span>Contrato en revisión</span>
                    </div>
                    <div class="status-message">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>Esperando validación de documentos</span>
                    </div>
                    <button class="btn btn-secondary btn-action" onclick="adjuntarArchivo(${paso})" data-paso="${paso}">
                        <i class="fas fa-paperclip"></i> Adjuntar más documentos
                    </button>
                </div>
            `;
        }
      } else {
        botonesHTML = `
            <div class="contract-upload-container">
                <div class="upload-header">
                    <i class="fas fa-file-contract"></i>
                    <span>Documentación del contrato</span>
                </div>
                <div class="upload-instructions">
                    <p>Por favor, adjunte los siguientes documentos:</p>
                    <ul>
                        <li>Contrato firmado</li>
                        <li>Identificaciones</li>
                        <li>Comprobantes adicionales</li>
                    </ul>
                </div>
                <button class="btn btn-primary btn-action" onclick="adjuntarArchivo(${paso})" data-paso="${paso}">
                    <i class="fas fa-paperclip"></i> Adjuntar documentos
                </button>
            </div>
        `;
      }
      break;
    case 3:
        if (pasosCompletados.has(paso)) {
            const fechaCita = new Date(
                seguimientoData[`paso3_agendarCita`] ||
                seguimientoData[`paso${paso}_fechaCitaAtendida`]
            );
            botonesHTML = `
                <div class="contract-status success">
                    <div class="status-badge">
                        <i class="fas fa-calendar-check"></i>
                        <span>Cita confirmada</span>
                    </div>
                    <div class="appointment-details">
                        <div class="date-time-info">
                            <div class="info-item">
                                <i class="fas fa-calendar-day"></i>
                                <span>Fecha: ${fechaCita.toLocaleDateString('es-ES', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-clock"></i>
                                <span>Hora: ${fechaCita.toLocaleTimeString('es-ES', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                })}</span>
                            </div>
                        </div>
                        <div class="status-message">
                            <i class="fas fa-check-circle"></i>
                            <span>Cita agendada y confirmada</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            botonesHTML = `
                <div class="contract-upload-container">
                    <div class="upload-header">
                        <i class="fas fa-calendar-alt"></i>
                        <span>Agendar Cita para Firma</span>
                    </div>
                    <div class="upload-instructions">
                        <p>Seleccione una fecha y hora para la firma del contrato:</p>
                        <div class="appointment-reminder">
                            <i class="fas fa-info-circle"></i>
                            <div class="reminder-text">
                                <span class="reminder-title">Recordatorio</span>
                                <span class="reminder-content">Asegúrese de coordinar un horario conveniente para todas las partes involucradas.</span>
                            </div>
                        </div>
                    </div>
                    <button class="btn btn-primary btn-action full-width" onclick="agendarCita(${paso})">
                        <i class="fas fa-calendar-plus"></i>
                        <span>Programar cita</span>
                    </button>
                </div>
            `;
        }
        break;
    case 9:
      if (pasosCompletados.has(paso)) {
        const mensajeWhatsApp = seguimientoData.paso9_confirmacionCita || "";
        botonesHTML = `
                <div class="confirmation-container">
                    <div class="status-badge">
                        <i class="fas fa-check-circle"></i>
                        <span>Confirmación enviada</span>
                    </div>
                    <div class="message-display">
                        <div class="message-header">
                            <i class="fab fa-whatsapp"></i>
                            <span>Mensaje enviado</span>
                        </div>
                        <div class="message-content">
                            <div class="message-bubble">${mensajeWhatsApp}</div>
                          
                        </div>
                    </div>
                </div>
            `;
      } else {
        botonesHTML = `
                <div class="confirmation-form">
                    <div class="form-header">
                        <i class="fab fa-whatsapp"></i>
                        <span>Registrar confirmación</span>
                    </div>
                    <div class="message-input-container">
                        <textarea 
                            id="mensajeWhatsApp" 
                            class="message-input"
                            rows="4"
                            placeholder="Escribe el mensaje que enviaste al prospecto..."
                        ></textarea>
                        <div class="input-footer">
                            <span class="input-hint">
                                <i class="fas fa-info-circle"></i>
                                <span>Ingresa el mensaje exacto que enviaste</span>
                            </span>
                        </div>
                    </div>
                    <button class="save-button" onclick="guardarConfirmacionCita()">
                        <i class="fas fa-paper-plane"></i>
                        <span>Guardar confirmación</span>
                    </button>
                </div>
            `;
      }

      break;
    case 12:
        case 12:
            if (seguimientoData.paso12_revision || seguimientoData.paso12_atencionCitaEvidenciaRecibosURL?.length > 0) {
                if (seguimientoData.paso12_revision) {
                    botonesHTML = `
                        <div class="contract-status success">
                            <div class="status-badge">
                                <i class="fas fa-file-invoice-dollar"></i>
                                <span>Evidencia verificada</span>
                            </div>
                            <div class="status-message">
                                <i class="fas fa-check-circle"></i>
                                <span>Documentación validada y registrada</span>
                            </div>
                        </div>
                    `;
                } else {
                    botonesHTML = `
                        <div class="contract-status pending">
                            <div class="status-badge">
                                <i class="fas fa-clock"></i>
                                <span>Evidencia en revisión</span>
                            </div>
                            <div class="status-message">
                                <i class="fas fa-exclamation-circle"></i>
                                <span>Esperando validación de documentos</span>
                            </div>
                            <button class="btn btn-secondary btn-action" onclick="adjuntarArchivo(${paso})" data-paso="${paso}">
                                <i class="fas fa-paperclip"></i> Adjuntar más documentos
                            </button>
                        </div>
                    `;
                }
            } else {
                botonesHTML = `
                    <div class="contract-upload-container">
                        <div class="upload-header">
                            <i class="fas fa-receipt"></i>
                            <span>Evidencia de Entrega</span>
                        </div>
                        <div class="upload-instructions">
                            <p>Por favor, adjunte los siguientes documentos:</p>
                            <ul class="document-checklist">
                                <li>
                                    <i class="fas fa-check-circle"></i>
                                    <span>Recibos de pago final</span>
                                </li>
                                <li>
                                    <i class="fas fa-check-circle"></i>
                                    <span>Evidencia fotográfica del evento</span>
                                </li>
                                <li>
                                    <i class="fas fa-check-circle"></i>
                                    <span>Documentación adicional relevante</span>
                                </li>
                            </ul>
                        </div>
                        <div class="upload-action">
                            <button class="btn btn-primary btn-action full-width" onclick="adjuntarArchivo(${paso})" data-paso="${paso}">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <span>Subir documentos</span>
                            </button>
                        </div>
                    </div>
                `;
            }
            break;

            case 6:
                if (pasosCompletados.has(paso)) {
                    const fechaCita = new Date(
                        seguimientoData[`paso6_fechaCitaAtendida`] ||
                        seguimientoData[`paso${paso}_fechaCitaAtendida`]
                    );
                    botonesHTML = `
                        <div class="contract-status success">
                            <div class="status-badge">
                                <i class="fas fa-calendar-check"></i>
                                <span>Cita confirmada</span>
                            </div>
                            <div class="appointment-details">
                                <div class="date-time-info">
                                    <div class="info-item">
                                        <i class="fas fa-calendar-day"></i>
                                        <span>Fecha: ${fechaCita.toLocaleDateString('es-ES', { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}</span>
                                    </div>
                                    <div class="info-item">
                                        <i class="fas fa-clock"></i>
                                        <span>Hora: ${fechaCita.toLocaleTimeString('es-ES', { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })}</span>
                                    </div>
                                </div>
                                <div class="status-message">
                                    <i class="fas fa-check-circle"></i>
                                    <span>Cita agendada y confirmada</span>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    botonesHTML = `
                        <div class="contract-upload-container">
                            <div class="upload-header">
                                <i class="fas fa-calendar-alt"></i>
                                <span>Agendar Cita para Firma</span>
                            </div>
                            <div class="upload-instructions">
                                <p>Seleccione una fecha y hora para la firma del contrato:</p>
                                <div class="appointment-reminder">
                                    <i class="fas fa-info-circle"></i>
                                    <div class="reminder-text">
                                        <span class="reminder-title">Recordatorio</span>
                                        <span class="reminder-content">Asegúrese de coordinar un horario conveniente para todas las partes involucradas.</span>
                                    </div>
                                </div>
                            </div>
                            <button class="btn btn-primary btn-action full-width" onclick="agendarCita(${paso})">
                                <i class="fas fa-calendar-plus"></i>
                                <span>Programar cita</span>
                            </button>
                        </div>
                    `;
                }
                break;


            case 8:
                if (pasosCompletados.has(paso)) {
                    const fechaCita = new Date(
                        seguimientoData[`paso8_agendarCitaParaFirmar`] ||
                        seguimientoData[`paso${paso}_fechaCitaAtendida`]
                    );
                    botonesHTML = `
                        <div class="contract-status success">
                            <div class="status-badge">
                                <i class="fas fa-calendar-check"></i>
                                <span>Cita confirmada</span>
                            </div>
                            <div class="appointment-details">
                                <div class="date-time-info">
                                    <div class="info-item">
                                        <i class="fas fa-calendar-day"></i>
                                        <span>Fecha: ${fechaCita.toLocaleDateString('es-ES', { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}</span>
                                    </div>
                                    <div class="info-item">
                                        <i class="fas fa-clock"></i>
                                        <span>Hora: ${fechaCita.toLocaleTimeString('es-ES', { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })}</span>
                                    </div>
                                </div>
                                <div class="status-message">
                                    <i class="fas fa-check-circle"></i>
                                    <span>Cita agendada y confirmada</span>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    botonesHTML = `
                        <div class="contract-upload-container">
                            <div class="upload-header">
                                <i class="fas fa-calendar-alt"></i>
                                <span>Agendar Cita para Firma</span>
                            </div>
                            <div class="upload-instructions">
                                <p>Seleccione una fecha y hora para la firma del contrato:</p>
                                <div class="appointment-reminder">
                                    <i class="fas fa-info-circle"></i>
                                    <div class="reminder-text">
                                        <span class="reminder-title">Recordatorio</span>
                                        <span class="reminder-content">Asegúrese de coordinar un horario conveniente para todas las partes involucradas.</span>
                                    </div>
                                </div>
                            </div>
                            <button class="btn btn-primary btn-action full-width" onclick="agendarCita(${paso})">
                                <i class="fas fa-calendar-plus"></i>
                                <span>Programar cita</span>
                            </button>
                        </div>
                    `;
                }
                break;
    case 11:
     case 8:
                if (pasosCompletados.has(paso)) {
                    const fechaCita = new Date(
                        seguimientoData[`paso11_agendarCitaParaEntregaPorcentaje`] ||
                        seguimientoData[`paso${paso}_fechaCitaAtendida`]
                    );
                    botonesHTML = `
                        <div class="contract-status success">
                            <div class="status-badge">
                                <i class="fas fa-calendar-check"></i>
                                <span>Cita confirmada</span>
                            </div>
                            <div class="appointment-details">
                                <div class="date-time-info">
                                    <div class="info-item">
                                        <i class="fas fa-calendar-day"></i>
                                        <span>Fecha: ${fechaCita.toLocaleDateString('es-ES', { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}</span>
                                    </div>
                                    <div class="info-item">
                                        <i class="fas fa-clock"></i>
                                        <span>Hora: ${fechaCita.toLocaleTimeString('es-ES', { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })}</span>
                                    </div>
                                </div>
                                <div class="status-message">
                                    <i class="fas fa-check-circle"></i>
                                    <span>Cita agendada y confirmada</span>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    botonesHTML = `
                        <div class="contract-upload-container">
                            <div class="upload-header">
                                <i class="fas fa-calendar-alt"></i>
                                <span>Agendar Cita para Firma</span>
                            </div>
                            <div class="upload-instructions">
                                <p>Seleccione una fecha y hora para la firma del contrato:</p>
                                <div class="appointment-reminder">
                                    <i class="fas fa-info-circle"></i>
                                    <div class="reminder-text">
                                        <span class="reminder-title">Recordatorio</span>
                                        <span class="reminder-content">Asegúrese de coordinar un horario conveniente para todas las partes involucradas.</span>
                                    </div>
                                </div>
                            </div>
                            <button class="btn btn-primary btn-action full-width" onclick="agendarCita(${paso})">
                                <i class="fas fa-calendar-plus"></i>
                                <span>Programar cita</span>
                            </button>
                        </div>
                    `;
                }
                break;
    case 5:
      if (pasosCompletados.has(paso)) {
        const descripcion = seguimientoData.paso5_descripcion || "";
        botonesHTML = `
                    <div class="paso5-container completed">
                        <div class="status-badge">
                            <i class="fas fa-check-circle"></i>
                            <span>Paquetes ofrecidos</span>
                        </div>
                        <div class="description-content">
                            <p>${descripcion}</p>
                        </div>
                    </div>
                `;
      } else {
        botonesHTML = `
                    <div class="paso5-container">
                        <div class="paso5-layout">
                            <div class="input-column">
                                <textarea 
                                    id="descripcion" 
                                    class="custom-textarea"
                                    placeholder="Ingrese la descripción de los paquetes ofrecidos..."
                                >${
                                  seguimientoData.paso5_descripcion || ""
                                }</textarea>
                            </div>
                            <div class="buttons-column">
                                <button class="action-btn" onclick="adjuntarArchivoPaso(5)" data-paso="5">
                                    <i class="fas fa-paperclip"></i> Adjuntar
                                </button>
                                <button class="action-btn" onclick="mostrarPublicaciones()" data-paso="55">
                                    <i class="fas fa-share"></i> Paquetes
                                </button>
                                <button class="action-btn save" onclick="verificarPaso5()">
                                    <i class="fas fa-save"></i> Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                `;
      }
      break;
      case 7:
        if (seguimientoData.paso7_revision || seguimientoData.paso7_adjuntarRecibosAnticipoURL?.length > 0) {
            if (seguimientoData.paso7_revision) {
                botonesHTML = `
                    <div class="contract-status success">
                        <div class="status-badge">
                            <i class="fas fa-money-check-alt"></i>
                            <span>Anticipo verificado</span>
                        </div>
                        <div class="status-message">
                            <i class="fas fa-check-circle"></i>
                            <span>Pago validado y registrado</span>
                        </div>
                    </div>
                `;
            } else {
                botonesHTML = `
                    <div class="contract-status pending">
                        <div class="status-badge">
                            <i class="fas fa-clock"></i>
                            <span>Anticipo en revisión</span>
                        </div>
                        <div class="status-message">
                            <i class="fas fa-exclamation-circle"></i>
                            <span>Esperando validación del pago</span>
                        </div>
                        <button class="btn btn-secondary btn-action" onclick="adjuntarArchivo(${paso})" data-paso="${paso}">
                            <i class="fas fa-paperclip"></i> Adjuntar más documentos
                        </button>
                    </div>
                `;
            }
        } else {
            botonesHTML = `
                <div class="contract-upload-container">
                    <div class="upload-header">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>Registro de Anticipo</span>
                    </div>
                    <div class="upload-instructions">
                        <p>Complete la siguiente información:</p>
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="fecha">
                                    <i class="fas fa-calendar"></i>
                                    Fecha
                                </label>
                                <input type="date" id="fecha" class="form-control custom-input" />
                            </div>
                            <div class="form-group">
                                <label for="numPersonas">
                                    <i class="fas fa-users"></i>
                                    No. Personas
                                </label>
                                <input type="number" id="numPersonas" class="form-control custom-input" />
                            </div>
                            <div class="form-group">
                                <label for="lugar">
                                    <i class="fas fa-map-marker-alt"></i>
                                    Lugar
                                </label>
                                <select id="lugar" class="form-control custom-input">
                                    <option value="">Seleccione un lugar</option>
                                    ${await obtenerLugaresOptions()}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-action" onclick="guardarDatosAnticipo()">
                            <i class="fas fa-save"></i> Guardar información
                        </button>
                        <button class="btn btn-secondary btn-action" onclick="adjuntarArchivo(${paso})" data-paso="${paso}">
                            <i class="fas fa-paperclip"></i> Adjuntar recibo
                        </button>
                    </div>
                </div>
            `;
        }
        break;
    case 13:
        if (pasosCompletados.has(13)) {
            const email = seguimientoData.paso13_correo;
            const password = seguimientoData.paso13_pass;
            botonesHTML = `
                <div class="credentials-card">
                    <div class="credentials-grid">
                        <div class="credential-box">
                            <i class="fas fa-envelope"></i>
                            <div class="credential-info">
                                <label>Email</label>
                                <span>${email}</span>
                            </div>
                        </div>
                        <div class="credential-box">
                            <i class="fas fa-key"></i>
                            <div class="credential-info">
                                <label>Contraseña</label>
                                <span>${password}</span>
                            </div>
                        </div>
                    </div>
                    <button class="copy-btn" onclick="copiarCredenciales('${email}', '${password}')">
                        <i class="fas fa-copy"></i>
                        <span>Copiar</span>
                    </button>
                </div>
            `;
        } else {
            botonesHTML = `
                <button class="generate-btn" onclick="generarCredenciales()">
                    <i class="fas fa-user-plus"></i>
                    <span>Generar Credenciales</span>
                </button>
            `;
        }
        break;
    default:
      if (pasosCompletados.has(paso)) {
        botonesHTML = `
                    <button class="btn btn-success btn-action" disabled>
                        <i class="fas fa-check"></i> Paso completado
                    </button>
                `;
      } else {
        botonesHTML = data.botones
          .map(
            (boton) => `
                    <button class="btn ${boton.clase} btn-action" onclick="${
              boton.accion
            }" ${
              boton.accion.startsWith("adjuntarArchivo")
                ? `data-paso="${paso}"`
                : ""
            }>
                        <i class="${boton.icono} me-2"></i>${boton.texto}
                    </button>
                `
          )
          .join("");
      }
  }

  botonesContainer.innerHTML = botonesHTML;

  // Actualizar navegación
  document.getElementById("numeroPaso").textContent = `Paso ${paso} de 13`;
  document.getElementById("pasoAnterior").disabled = paso === 1;
  document.getElementById("pasoSiguiente").disabled =
    paso === 13 || !pasosCompletados.has(paso);

  // Aplicar estado completado con el indicador visual correcto
  const contenidoContainer = document.getElementById("pasoContenido");
  const contenidoWrapper = document.createElement("div");
  contenidoWrapper.className = "position-relative";
  contenidoWrapper.innerHTML = data.contenido;

  if (pasosCompletados.has(paso)) {
    const checkmark = document.createElement("div");
    checkmark.className = "position-absolute top-0 end-0 m-3";
    checkmark.innerHTML = `<i class="fas fa-check-circle text-success" style="font-size: 2rem;"></i>`;
    contenidoWrapper.appendChild(checkmark);
  }

  contenidoContainer.innerHTML = "";
  contenidoContainer.appendChild(contenidoWrapper);

  // Mostrar modal
  if (!modal.classList.contains("show")) {
    const modalInstance = new bootstrap.Modal(modal, {
      backdrop: "static",
      keyboard: false,
    });
    modalInstance.show();
  }
}

// Función auxiliar para obtener las opciones de lugares
async function obtenerLugaresOptions() {
  const lugaresSnapshot = await db.collection("lugares").get();
  return lugaresSnapshot.docs
    .map((doc) => {
      const data = doc.data();
      return `<option value="${data.nombreLugar}">${data.nombreLugar}</option>`;
    })
    .join("");
}

function updateProgress(progress, text, subtext = '') {
    Swal.update({
      title: 'Generando credenciales',
      html: `
        <div class="progress-container">
          <div class="progress-status">
            <div class="progress-text">${text}</div>
            ${subtext ? `<div class="progress-subtext">${subtext}</div>` : ''}
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="progress-percentage">${progress}%</div>
          </div>
        </div>
      `
    });
  }

async function generarCredenciales() {


    Swal.fire({
        title: 'Generando credenciales',
        html: `
          <div class="upload-progress">
            <div class="upload-progress-text">
              Preparando la información
            </div>
            <div class="progress-bar">
              <div class="progress" style="width: 0%"></div>
            </div>
            <div class="progress-text">0%</div>
          </div>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

  try {
     updateProgress(20, 'Obteniendo información del usuario');

    const prospectoDoc = await db
      .collection("prospectos")
      .doc(prospectoActualId)
      .get();
    const prospectoData = prospectoDoc.data();

    if (!prospectoData || !prospectoData.name) {
      throw new Error(
        "El prospecto no tiene nombre registrado o no se encontró"
      );
    }

    console.log("Datos del prospecto obtenidos:", prospectoData);

    // Generar email y contraseña
    const fechaActual = new Date();
    const nombreLimpio = prospectoData.name
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[áäà]/g, "a")
      .replace(/[éëè]/g, "e")
      .replace(/[íïì]/g, "i")
      .replace(/[óöò]/g, "o")
      .replace(/[úüù]/g, "u")
      .replace(/ñ/g, "n")
      .replace(/[^a-z0-9]/g, "");

    const dia = fechaActual.getDate().toString().padStart(2, "0");
    const mes = (fechaActual.getMonth() + 1).toString().padStart(2, "0");
    const año = fechaActual.getFullYear().toString().slice(-4);

    updateProgress(40, 'Generando credenciales de acceso');

    const email = `${nombreLimpio}${dia}${mes}${año}@jasso.com`;
    const password = Math.floor(100000 + Math.random() * 900000).toString();

     
    // Crear una instancia secundaria de Firebase
    updateProgress(60, 'Creando cuenta de usuario');
    let secondaryApp;
    try {
      secondaryApp = firebase.initializeApp(
        {
          ...firebase.app().options,
          apiKey: firebase.app().options.apiKey,
          authDomain: firebase.app().options.authDomain,
          projectId: firebase.app().options.projectId,
        },
        "secondary"
      );
    } catch (e) {
      // Si la app ya existe, obtenerla
      secondaryApp = firebase.app("secondary");
    }

    // Crear usuario usando la instancia secundaria
    let userCredential;
    try {
      userCredential = await secondaryApp
        .auth()
        .createUserWithEmailAndPassword(email, password);
      console.log("Usuario creado en Firebase Authentication");
    } catch (authError) {
      console.error(
        "Error al crear usuario en Firebase Authentication:",
        authError
      );
      // Asegurarse de eliminar la app secundaria en caso de error
      await secondaryApp.delete();
      throw authError;
    }

    updateProgress(80, 'Guardando información');


    // Guardar información en Firestore (seguimientoProspectos)
    try {
      await db
        .collection("seguimientoProspectos")
        .doc(prospectoActualId)
        .update({
          paso13_asignacionUsuario: true,
          paso13_correo: email,
          paso13_pass: password,
        });
      console.log("Información guardada en seguimientoProspectos");
    } catch (seguimientoError) {
      console.error(
        "Error al guardar en seguimientoProspectos:",
        seguimientoError
      );
      // Revertir la creación del usuario
      await userCredential.user.delete();
      await secondaryApp.delete();
      throw seguimientoError;
    }

    // Crear documento en 'usuarios' colección
    const userData = {
      active: true,
      email: email,
      imageProfile: "",
      name: prospectoData.name,
      onLine: true,
      password: password,
      phone: prospectoData.telefono_prospecto || "",
      timestamp: Date.now(),
      uid: userCredential.user.uid,
      userType: "cliente",
    };

    try {
      await db
        .collection("usuarios")
        .doc(userCredential.user.uid)
        .set(userData);
      console.log("Usuario creado exitosamente en la colección 'usuarios'");
    } catch (usuariosError) {
      console.error(
        "Error al crear usuario en la colección 'usuarios':",
        usuariosError
      );
      // Revertir la creación del usuario
      await userCredential.user.delete();
      await db
        .collection("seguimientoProspectos")
        .doc(prospectoActualId)
        .update({
          paso13_asignacionUsuario: false,
          paso13_correo: firebase.firestore.FieldValue.delete(),
          paso13_pass: firebase.firestore.FieldValue.delete(),
        });
      await secondaryApp.delete();
      throw usuariosError;
    }

    // Actualizar porcentaje
    try {
      await db.collection("prospectos").doc(prospectoActualId).update({
        porcentaje: 100,
      });
      console.log("Porcentaje actualizado en la colección 'prospectos'");
    } catch (porcentajeError) {
      console.error("Error al actualizar el porcentaje:", porcentajeError);
    }

    // Eliminar la instancia secundaria después de completar todo
    await secondaryApp.delete();

    console.log("Proceso de generación de credenciales completado con éxito");
    updateProgress(100, '¡Proceso completado!');

    // Mostrar mensaje de éxito
    setTimeout(() => {
      Swal.fire({
        icon: "success",
        title: "¡Credenciales generadas exitosamente!",
        html: `
          <div class="success-credentials">
            <div class="credentials-info">
              <i class="fas fa-check-circle success-icon"></i>
              <p>Las credenciales se han generado correctamente</p>
            </div>
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#28a745"
      });
    }, 1000);

    mostrarPasoSeguimiento(13);
  } catch (error) { console.error("Error en generación de credenciales:", error);
    
    let errorMessage = "Ocurrió un error al generar las credenciales.";
    let errorDetails = "";

    // Identificar tipo específico de error
    if (error.code) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = "El correo electrónico ya está en uso.";
                errorDetails = "Intenta con un nombre diferente o contacta a soporte.";
                break;
            case 'auth/invalid-email':
                errorMessage = "El correo electrónico no es válido.";
                errorDetails = "Verifica el formato del correo generado.";
                break;
            case 'auth/operation-not-allowed':
                errorMessage = "Operación no permitida.";
                errorDetails = "La creación de usuarios está deshabilitada.";
                break;
            case 'auth/weak-password':
                errorMessage = "La contraseña es muy débil.";
                errorDetails = "La contraseña debe cumplir con los requisitos mínimos.";
                break;
            default:
                errorDetails = error.message || "Error desconocido";
        }
    }

    // Si es un error de Firestore
    if (error.name === "FirebaseError") {
        errorMessage = "Error en la base de datos";
        errorDetails = "No se pudo guardar la información del usuario.";
    }

    // Mostrar error con Swal
    Swal.fire({
        icon: 'error',
        title: errorMessage,
        html: `
            <div class="error-container">
                <p class="error-details">${errorDetails}</p>
                <div class="error-code">
                    <small>Código de error: ${error.code || 'UNKNOWN'}</small>
                </div>
            </div>
        `,
        confirmButtonColor: '#dc3545',
        showConfirmButton: true,
        confirmButtonText: 'Entendido'
    });

    // Registrar error en consola con más detalles
    console.group('Detalles del error');
    console.error('Mensaje:', error.message);
    console.error('Código:', error.code);
    console.error('Stack:', error.stack);
    console.groupEnd();
  }
}

async function copiarCredenciales(email, password) {
  try {
    const texto = `Email: ${email}\nContraseña: ${password}`;
    await navigator.clipboard.writeText(texto);
    alert("Credenciales copiadas al portapapeles");
  } catch (err) {
    console.error("Error al copiar al portapapeles:", err);
    alert("Error al copiar las credenciales");
  }
}

async function guardarConfirmacionCita() {
  const mensajeWhatsApp = document
    .getElementById("mensajeWhatsApp")
    .value.trim();

  if (!mensajeWhatsApp) {
    Swal.fire({
      icon: "warning",
      title: "Campo requerido",
      text: "Por favor, ingrese el mensaje que envió por WhatsApp.",
      confirmButtonText: "Entendido",
    });
    return;
  }

  try {
    // Mostrar loading
    Swal.fire({
      title: "Guardando confirmación",
      html: `
                <div class="confirmation-progress">
                    <div class="confirmation-icon">
                        <i class="fab fa-whatsapp"></i>
                    </div>
                    <div class="confirmation-text">
                        Registrando confirmación de cita...
                    </div>
                </div>
            `,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Guardar en Firestore
    await db.collection("seguimientoProspectos").doc(prospectoActualId).update({
      paso9_confirmacionCita: mensajeWhatsApp,
    });

    // Actualizar porcentaje
    const porcentaje = calcularPorcentaje(9);
    await db.collection("prospectos").doc(prospectoActualId).update({
      porcentaje: porcentaje,
    });

    // Mostrar mensaje de éxito
    await Swal.fire({
      icon: "success",
      title: "¡Confirmación guardada!",
      html: `
                <div class="success-confirmation">
                    <div class="success-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="message-preview">
                        <p class="preview-label">Mensaje registrado:</p>
                        <div class="message-content">
                            ${mensajeWhatsApp}
                        </div>
                    </div>
                </div>
            `,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });

    mostrarPasoSeguimiento(9);
  } catch (error) {
    console.error("Error al guardar la confirmación:", error);

    Swal.fire({
      icon: "error",
      title: "Error al guardar",
      text: "Hubo un problema al guardar la confirmación: " + error.message,
      confirmButtonText: "Entendido",
    });
  }
}

let modalAnteriorAbierto;

function abrirModalMasInformacion() {
  modalAnteriorAbierto = bootstrap.Modal.getInstance(
    document.getElementById("seguimientoModal")
  );
  modalAnteriorAbierto.hide();

  const modalMasInformacion = new bootstrap.Modal(
    document.getElementById("modalMasInformacion"),
    {
      backdrop: "static",
      keyboard: false,
    }
  );
  modalMasInformacion.show();

  cargarArchivosAdjuntos();
}

function cerrarModalMasInformacion() {
  const modalMasInformacion = bootstrap.Modal.getInstance(
    document.getElementById("modalMasInformacion")
  );
  modalMasInformacion.hide();

  if (modalAnteriorAbierto) {
    modalAnteriorAbierto.show();
  }
}

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js";

async function cargarArchivosAdjuntos() {
  try {
    const seguimientoDoc = await db
      .collection("seguimientoProspectos")
      .doc(prospectoActualId)
      .get();

    if (!seguimientoDoc.exists) {
      mostrarMensajeVacio("No hay archivos adjuntos disponibles.");
      return;
    }

    const seguimientoData = seguimientoDoc.data();
    let archivos = obtenerArchivosPorPaso(seguimientoData, pasoActual);
    archivos = archivos.filter((url) => url);

    if (archivos.length === 0) {
      mostrarMensajeVacio("No hay archivos adjuntos para este paso.");
      return;
    }

    const thumbnailsHTML = await Promise.all(
      archivos.map(async (archivoURL, index) => {
        try {
          // Obtener la URL de descarga real de Firebase Storage
          const storageRef = firebase.storage().refFromURL(archivoURL);
          const url = await storageRef.getDownloadURL();
          const nombreArchivo = storageRef.name; // Obtener el nombre del archivo
          const extension = nombreArchivo.split(".").pop().toLowerCase();

          return generarThumbnail(url, extension, index);
        } catch (error) {
          console.error(`Error al procesar archivo ${index + 1}:`, error);
          return "";
        }
      })
    );

    mostrarGaleriaArchivos(thumbnailsHTML);
  } catch (error) {
    console.error("Error al cargar archivos:", error);
    mostrarError();
  }
}

function generarThumbnail(url, extension, index) {
  const esImagen = ["jpg", "jpeg", "png", "gif"].includes(extension);
  const esPDF = extension === "pdf";

  let contenidoThumbnail;
  if (esImagen) {
    contenidoThumbnail = `
            <div class="image-preview">
                <img src="${url}" alt="Archivo ${
      index + 1
    }" class="thumbnail-image">
            </div>`;
  } else if (esPDF) {
    contenidoThumbnail = `
            <div class="pdf-preview">
                <i class="fas fa-file-pdf"></i>
                <span>PDF</span>
            </div>`;
  } else {
    contenidoThumbnail = `
            <div class="file-preview">
                <i class="fas fa-file"></i>
                <span>${extension.toUpperCase()}</span>
            </div>`;
  }

  return `
        <div class="thumbnail-wrapper">
            <a href="${url}" target="_blank" class="thumbnail-link" data-type="${extension}">
                <div class="thumbnail-image-container ${
                  !esImagen ? "file-container" : ""
                }">
                    ${contenidoThumbnail}
                </div>
                <div class="thumbnail-info">
                    <span class="thumbnail-name">Archivo ${index + 1}</span>
                    <span class="thumbnail-type">${extension.toUpperCase()}</span>
                </div>
            </a>
        </div>
    `;
}

// Actualiza los estilos CSS
const styles = `
.thumbnails-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 15px;
    padding: 15px;
}

.thumbnail-wrapper {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s ease;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.thumbnail-wrapper:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.thumbnail-link {
    text-decoration: none;
    color: inherit;
}

.thumbnail-image-container {
    width: 100%;
    aspect-ratio: 1;
    position: relative;
    background: #f8fafc;
}

.image-preview {
    width: 100%;
    height: 100%;
}

.thumbnail-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.pdf-preview, .file-preview {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #f8fafc;
    color: #64748b;
    gap: 8px;
}

.pdf-preview i {
    font-size: 24px;
    color: #ef4444;
}

.file-preview i {
    font-size: 24px;
    color: #64748b;
}

.thumbnail-info {
    padding: 8px;
    background: white;
    border-top: 1px solid #e2e8f0;
}

.thumbnail-name {
    display: block;
    font-size: 0.75rem;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.thumbnail-type {
    display: block;
    font-size: 0.7rem;
    color: #64748b;
    margin-top: 2px;
}

.empty-state {
    text-align: center;
    padding: 30px;
    color: #64748b;
}

.empty-state i {
    font-size: 32px;
    margin-bottom: 10px;
}

@media (max-width: 768px) {
    .thumbnails-container {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 10px;
        padding: 10px;
    }
}
`;

// Agregar los estilos
if (!document.getElementById("thumbnails-styles")) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "thumbnails-styles";
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
// Funciones auxiliares
function obtenerArchivosPorPaso(seguimientoData, paso) {
  const mapaPasos = {
    12: "paso12_atencionCitaEvidenciaRecibosURL",
    10: "paso10_firmaContratoEvidendiasURL",
    7: "paso7_adjuntarRecibosAnticipoURL",
    5: "paso5_adjuntarCotizacionURL",
    4: "paso4_adjuntarEvidenciaURL",
    2: "paso2_adjuntarEvidenciaURL",
  };

  const campo = mapaPasos[paso];
  return campo
    ? Array.isArray(seguimientoData[campo])
      ? seguimientoData[campo]
      : [seguimientoData[campo]]
    : [];
}

function obtenerExtension(url) {
  return url.split(".").pop().toLowerCase();
}

async function obtenerURLDescarga(archivoURL) {
  const storageRef = firebase.storage().refFromURL(archivoURL);
  return await storageRef.getDownloadURL();
}

function mostrarGaleriaArchivos(thumbnails) {
  document.getElementById("archivosAdjuntos").innerHTML = `
        <div class="thumbnails-container">
            ${thumbnails.join("")}
        </div>
    `;
}

function mostrarMensajeVacio(mensaje) {
  document.getElementById("archivosAdjuntos").innerHTML = `
        <div class="empty-state">
            <i class="fas fa-folder-open"></i>
            <p>${mensaje}</p>
        </div>
    `;
}

function mostrarError() {
  document.getElementById("archivosAdjuntos").innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-circle"></i>
            <p>Error al cargar los archivos adjuntos.</p>
        </div>
    `;
}

// Estilos CSS actualizados

async function mostrarPublicaciones() {
  // Crear el modal de publicaciones
  const modalHTML = `
    <div class="modal fade" id="publicacionesModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="search-container">
                        <i class="fas fa-search search-icon"></i>
                        <input type="text" id="searchPublicaciones" class="search-input" placeholder="Buscar paquetes...">
                    </div>
                    <button type="button" class="close-button" data-bs-dismiss="modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div id="publicacionesList" class="publications-grid">
                        <!-- Las publicaciones se cargarán aquí -->
                    </div>
                </div>
                <div class="modal-footer">
                    <span class="selected-count">0 paquetes seleccionados</span>
                    <button type="button" class="action-button save" onclick="guardarPublicacionesSeleccionadas()">
                        <i class="fas fa-check"></i> Guardar selección
                    </button>
                </div>
            </div>
        </div>
    </div>
`;

  // Eliminar modal anterior si existe
  const modalAnterior = document.getElementById("publicacionesModal");
  if (modalAnterior) {
    modalAnterior.remove();
  }

  // Agregar el nuevo modal al DOM
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Mostrar el modal
  const modal = new bootstrap.Modal(
    document.getElementById("publicacionesModal")
  );
  modal.show();

  // Cargar las publicaciones
  await cargarPublicaciones();

  // Configurar el buscador
  const searchInput = document.getElementById("searchPublicaciones");
  searchInput.addEventListener(
    "input",
    debounce(async (e) => {
      const searchTerm = e.target.value.toLowerCase();
      await cargarPublicaciones(searchTerm);
    }, 300)
  );
}

// Función de debounce para el buscador
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

let publicacionesSeleccionadas = new Set();

async function cargarPublicaciones(searchTerm = "") {
  const publicacionesList = document.getElementById("publicacionesList");
  publicacionesList.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <span>Cargando paquetes...</span>
        </div>
    `;
  try {
    // Obtener las publicaciones ya seleccionadas
    const seguimientoDoc = await db
      .collection("seguimientoProspectos")
      .doc(prospectoActualId)
      .get();
    const seguimientoData = seguimientoDoc.exists ? seguimientoDoc.data() : {};
    const idsSeleccionados = seguimientoData.paso5_idsPublicaciones || [];
    publicacionesSeleccionadas = new Set(idsSeleccionados);

    // Obtener las publicaciones de Firestore
    let query = db.collection("publicaciones");

    if (searchTerm) {
      query = query
        .where("titulo", ">=", searchTerm)
        .where("titulo", "<=", searchTerm + "\uf8ff");
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      publicacionesList.innerHTML =
        '<div class="text-center">No se encontraron publicaciones</div>';
      return;
    }

    let publicacionesHTML = "";
    snapshot.forEach((doc) => {
      const publicacion = doc.data();
      const isSelected = publicacionesSeleccionadas.has(doc.id);
      publicacionesHTML += `
                <div class="publication-card ${isSelected ? "selected" : ""}" 
                     onclick="togglePublicacion('${doc.id}', this)">
                    <div class="publication-image">
                        <img src="${
                          publicacion.multimediaUrl[0] || "/placeholder.svg"
                        }" alt="${publicacion.titulo}">
                        <div class="selection-overlay">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </div>
                    <div class="publication-info">
                        <h3>${publicacion.categoria}</h3>
                        <p>${publicacion.lugar || "Sin descripción"}</p>
                    </div>
                </div>
            `;
    });

    publicacionesList.innerHTML =
      publicacionesHTML ||
      '<div class="empty-state">No se encontraron paquetes</div>';
    actualizarContador();
  } catch (error) {
    console.error("Error al cargar publicaciones:", error);
    publicacionesList.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error al cargar los paquetes</p>
            </div>
        `;
  }
}

function actualizarContador() {
  const contador = document.querySelector(".selected-count");
  if (contador) {
    contador.textContent = `${publicacionesSeleccionadas.size} paquetes seleccionados`;
  }
}

function togglePublicacion(publicacionId, element) {
  if (publicacionesSeleccionadas.has(publicacionId)) {
    publicacionesSeleccionadas.delete(publicacionId);
    element.classList.remove("selected");
  } else {
    publicacionesSeleccionadas.add(publicacionId);
    element.classList.add("selected");
  }
  actualizarContador();
}

let publicacionesGuardadas = [];

async function guardarPublicacionesSeleccionadas() {
  try {
    // Almacenar los IDs en la variable global
    publicacionesGuardadas = Array.from(publicacionesSeleccionadas);
    console.log("Publicaciones guardadas en memoria:", publicacionesGuardadas);

    // Cerrar el modal
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("publicacionesModal")
    );
    modal.hide();

    // Opcional: mostrar confirmación
    console.log("Publicaciones almacenadas exitosamente en memoria");

    const botonAdjuntar = document.querySelector(`button[data-paso="55"]`);
    if (botonAdjuntar) {
      botonAdjuntar.innerHTML = `<i class="fas fa-check me-2"></i>${publicacionesGuardadas.length} paquete(s) seleccionado(s)`;
      botonAdjuntar.classList.remove("btn-secondary");
      botonAdjuntar.classList.add("btn-success");
    }
  } catch (error) {
    console.error("Error al procesar las publicaciones:", error);
    alert("Error al procesar las publicaciones seleccionadas");
  }
}

// Función para adjuntar archivo
// Función para comprimir imagen
async function comprimirImagen(file) {
  const options = {
    maxSizeMB: 1, // Tamaño máximo de 1MB
    maxWidthOrHeight: 1920, // Máximo 1920px de ancho o alto
    useWebWorker: true,
    fileType: file.type,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error("Error al comprimir imagen:", error);
    throw error;
  }
}

// Función para procesar archivo según su tipo
async function procesarArchivo(file) {
  const tiposImagen = ["image/jpeg", "image/png", "image/jpg"];

  if (tiposImagen.includes(file.type)) {
    // Comprimir imagen
    return await comprimirImagen(file);
  } else if (file.type === "application/pdf") {
    // Si el PDF es mayor a 2MB, mostrar advertencia
    if (file.size > 2 * 1024 * 1024) {
      await Swal.fire({
        icon: "warning",
        title: "Archivo PDF grande",
        text: "El PDF supera los 2MB. Considera comprimirlo antes de subirlo.",
        showCancelButton: true,
        confirmButtonText: "Subir de todos modos",
        cancelButtonText: "Cancelar",
      });
    }
    return file;
  } else {
    return file;
  }
}

async function adjuntarArchivo(paso) {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.accept = ".jpg,.jpeg,.png,.pdf";
  const button = document.querySelector(`button[data-paso="${paso}"]`);

  input.onchange = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length > 0) {
      try {
        // Validar tamaño total
        const totalSize = files.reduce((acc, file) => acc + file.size, 0);
        const maxSize = 25 * 1024 * 1024; // 25MB

        if (totalSize > maxSize) {
          throw new Error(
            `El tamaño total de los archivos excede el límite de ${(
              maxSize /
              1024 /
              1024
            ).toFixed(0)}MB`
          );
        }

        // Mostrar loading inicial
        Swal.fire({
          title: "Preparando archivos",
          html: `
                        <div class="upload-progress">
                            <div class="upload-progress-text">Procesando ${
                              files.length
                            } archivo(s)...</div>
                            <div class="upload-files-preview">
                                ${files
                                  .map(
                                    (file) => `
                                    <div class="file-item">
                                        <i class="fas ${
                                          file.type.includes("pdf")
                                            ? "fa-file-pdf"
                                            : "fa-file-image"
                                        }"></i>
                                        <span>${file.name}</span>
                                    </div>
                                `
                                  )
                                  .join("")}
                            </div>
                        </div>
                    `,
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        // Procesar archivos
        const processedFiles = await Promise.all(
          files.map(async (file) => {
            try {
              return await procesarArchivo(file);
            } catch (error) {
              throw new Error(
                `Error al procesar ${file.name}: ${error.message}`
              );
            }
          })
        );

        // Iniciar carga
        let totalProgress = 0;
        const uploadPromises = processedFiles.map(async (file, index) => {
          const timestamp = Date.now();
          const fileName = `${timestamp}_${files[index].name}`;
          const storageRef = firebase
            .storage()
            .ref(`prospectos/${prospectoActualId}/paso${paso}/${fileName}`);

          const uploadTask = storageRef.put(file);

          // Mostrar progreso
          uploadTask.on("state_changed", (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            totalProgress = (index * 100 + progress) / files.length;

            Swal.update({
              title: "Subiendo archivos",
              html: `
                                    <div class="upload-progress">
                                        <div class="upload-progress-text">
                                            Subiendo archivo ${index + 1} de ${
                files.length
              }
                                        </div>
                                        <div class="progress-bar">
                                            <div class="progress" style="width: ${totalProgress}%"></div>
                                        </div>
                                        <div class="progress-text">${Math.round(
                                          totalProgress
                                        )}%</div>
                                    </div>
                                `,
            });
          });

          await uploadTask;
          return storageRef.getDownloadURL();
        });

        const downloadURLs = await Promise.all(uploadPromises);

        // Actualizar Firestore
        const updateData = {
          [`paso${paso}_${
            paso === 10
              ? "firmaContratoEvidendiasURL"
              : paso === 12
              ? "atencionCitaEvidenciaRecibosURL"
              : "adjuntarEvidenciaURL"
          }`]: firebase.firestore.FieldValue.arrayUnion(...downloadURLs),
        };

        await db
          .collection("seguimientoProspectos")
          .doc(prospectoActualId)
          .update(updateData);

        // Actualizar porcentaje
        const porcentaje = calcularPorcentaje(paso);
        await db.collection("prospectos").doc(prospectoActualId).update({
          porcentaje: porcentaje,
        });


        if ([7, 10, 12].includes(paso)) {
            // Mensaje especial para pasos que requieren revisión
            await Swal.fire({
                icon: 'info',
                title: 'Enviado a revisión',
                html: `
                    <div class="review-status">
                        <div class="review-icon">
                            <i class="fas fa-clock-rotate-left"></i>
                        </div>
                        <div class="review-message">
                            <p>La información ha sido enviada para revisión.</p>
                            <div class="review-steps">
                                <div class="step-item">
                                    <i class="fas fa-paper-plane"></i>
                                    <span>Información enviada</span>
                                </div>
                                <div class="step-item current">
                                    <i class="fas fa-magnifying-glass"></i>
                                    <span>En revisión</span>
                                </div>
                                <div class="step-item">
                                    <i class="fas fa-check-circle"></i>
                                    <span>Pendiente de aprobación</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                showConfirmButton: true,
                confirmButtonText: 'Entendido',
                allowOutsideClick: false,
                customClass: {
                    popup: 'review-popup'
                }
            });}else{
        // Mostrar éxito
        Swal.fire({
          icon: "success",
          title: "¡Archivos subidos!",
          html: `
                        <div class="success-message">
                            <div class="success-icon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="success-text">
                                Se subieron ${
                                  files.length
                                } archivo(s) correctamente
                            </div>
                            <div class="files-summary">
                                ${files
                                  .map(
                                    (file) => `
                                    <div class="file-item success">
                                        <i class="fas ${
                                          file.type.includes("pdf")
                                            ? "fa-file-pdf"
                                            : "fa-file-image"
                                        }"></i>
                                        <span>${file.name}</span>
                                    </div>
                                `
                                  )
                                  .join("")}
                            </div>
                        </div>
                    `,
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
            }

        mostrarPasoSeguimiento(paso);
      } catch (error) {
        console.error("Error:", error);
        Swal.fire({
          icon: "error",
          title: "Error al subir archivos",
          html: `
                        <div class="error-message">
                            <div class="error-icon">
                                <i class="fas fa-exclamation-circle"></i>
                            </div>
                            <div class="error-text">
                                ${error.message}
                            </div>
                        </div>
                    `,
          confirmButtonText: "Entender",
        });
      } finally {
        button.innerHTML = '<i class="fas fa-paperclip me-2"></i>Adjuntar';
        button.disabled = false;
      }
    }
  };
  input.click();
}

// En la función donde muestras el mensaje de éxito (por ejemplo, después de guardar)
async function showSuccessMessage(paso) {
    if ([7, 10, 12].includes(paso)) {
        // Mensaje especial para pasos que requieren revisión
        await Swal.fire({
            icon: 'info',
            title: 'Enviado a revisión',
            html: `
                <div class="review-status">
                    <div class="review-icon">
                        <i class="fas fa-clock-rotate-left"></i>
                    </div>
                    <div class="review-message">
                        <p>La información ha sido enviada para revisión.</p>
                        <div class="review-steps">
                            <div class="step-item">
                                <i class="fas fa-paper-plane"></i>
                                <span>Información enviada</span>
                            </div>
                            <div class="step-item current">
                                <i class="fas fa-magnifying-glass"></i>
                                <span>En revisión</span>
                            </div>
                            <div class="step-item">
                                <i class="fas fa-check-circle"></i>
                                <span>Pendiente de aprobación</span>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            showConfirmButton: true,
            confirmButtonText: 'Entendido',
            allowOutsideClick: false,
            customClass: {
                popup: 'review-popup'
            }
        });
    } else {
        // Mensaje normal para otros pasos
        await Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'La información se guardó correctamente',
            showConfirmButton: false,
            timer: 2000
        });
    }

    window.location.reload();
}


function calcularPorcentaje(paso) {
  return Math.round(paso * 7.69); // Redondear el porcentaje
}

// Función para agendar cita
let fechaCitaSeleccionada = null;

async function agendarCita(paso) {
  const input = document.getElementById("fecha-cita");
  if (!input) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Error en la configuración del calendario",
    });
    return;
  }

  // Inicializar Flatpickr con tema personalizado
  const fp = flatpickr(input, {
    enableTime: true,
    dateFormat: "Y-m-d H:i",
    minDate: "today",
    locale: {
      firstDayOfWeek: 1,
      weekdays: {
        shorthand: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
        longhand: [
          "Domingo",
          "Lunes",
          "Martes",
          "Miércoles",
          "Jueves",
          "Viernes",
          "Sábado",
        ],
      },
      months: {
        shorthand: [
          "Ene",
          "Feb",
          "Mar",
          "Abr",
          "May",
          "Jun",
          "Jul",
          "Ago",
          "Sep",
          "Oct",
          "Nov",
          "Dic",
        ],
        longhand: [
          "Enero",
          "Febrero",
          "Marzo",
          "Abril",
          "Mayo",
          "Junio",
          "Julio",
          "Agosto",
          "Septiembre",
          "Octubre",
          "Noviembre",
          "Diciembre",
        ],
      },
    },
    theme: "dark", // Tema oscuro para combinar con el diseño
  });

  // Mostrar el modal del calendario
  const modal = new bootstrap.Modal(document.getElementById("calendarModal"));
  modal.show();

  // Manejar el guardado de la cita
  document.getElementById("guardarCita").onclick = async function () {
    const selectedDates = fp.selectedDates;
    if (selectedDates.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Fecha requerida",
        text: "Por favor, selecciona una fecha y hora para la cita.",
        confirmButtonText: "Entendido",
      });
      return;
    }

    try {
      // Mostrar loading
      Swal.fire({
        title: "Agendando cita",
        html: `
                    <div class="scheduling-progress">
                        <div class="scheduling-icon">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <div class="scheduling-text">
                            Guardando información de la cita...
                        </div>
                    </div>
                `,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const fecha = selectedDates[0].getTime();
      const updateData = {};

      // Determinar el campo a actualizar según el paso
      switch (paso) {
        case 6:
          updateData.paso6_fechaCitaAtendida = fecha;
          break;
        case 8:
          updateData.paso8_agendarCitaParaFirmar = fecha;
          break;
        case 11:
          updateData.paso11_agendarCitaParaEntregaPorcentaje = fecha;
          break;
        default:
          updateData[`paso${paso}_agendarCita`] = fecha;
      }

      // Actualizar en Firestore
      await db
        .collection("seguimientoProspectos")
        .doc(prospectoActualId)
        .update(updateData);

      // Actualizar porcentaje
      const porcentaje = calcularPorcentaje(paso);
      await db.collection("prospectos").doc(prospectoActualId).update({
        porcentaje: porcentaje,
      });

      // Mostrar mensaje de éxito
      await Swal.fire({
        icon: "success",
        title: "¡Cita agendada!",
        html: `
                    <div class="success-schedule">
                        <div class="success-icon">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <div class="success-details">
                            <p>La cita se ha agendado para:</p>
                            <strong>${selectedDates[0].toLocaleString("es-ES", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}</strong>
                        </div>
                    </div>
                `,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      modal.hide();
      mostrarPasoSeguimiento(paso);
    } catch (error) {
      console.error("Error al agendar cita:", error);
      Swal.fire({
        icon: "error",
        title: "Error al agendar la cita",
        text: error.message,
        confirmButtonText: "Entendido",
      });
    }
  };
}

function calcularPorcentaje(paso) {
  return Math.round(paso * 7.69); // Redondear el porcentaje
}

function adjuntarArchivoPaso(paso) {
  const inputFile = document.createElement("input");
  inputFile.type = "file";
  inputFile.accept = ".pdf,.jpg,.jpeg,.png";
  inputFile.multiple = true;

  inputFile.onchange = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      archivoAdjunto = Array.from(files);
      console.log(
        "Archivos seleccionados en adjuntarArchivoPaso:",
        archivoAdjunto
      );

      // Actualizar el botón para indicar que se adjuntaron correctamente
      const botonAdjuntar = document.querySelector(
        `button[data-paso="${paso}"]`
      );
      if (botonAdjuntar) {
        botonAdjuntar.innerHTML = `<i class="fas fa-check me-2"></i>${archivoAdjunto.length} archivo(s) adjuntado(s)`;
        botonAdjuntar.classList.remove("btn-secondary");
        botonAdjuntar.classList.add("btn-success");
      }
    } else {
      archivoAdjunto = [];
      alert("No se seleccionó ningún archivo.");
    }
  };

  inputFile.click(); // Abrir el selector de archivos
}

// Primero, necesitamos una variable global para almacenar los archivos

async function guardarDatosAnticipo() {
  try {
    const fecha = document.getElementById("fecha").value;
    const numPersonas = document.getElementById("numPersonas").value;
    const lugar = document.getElementById("lugar").value;

    // Validaciones con SweetAlert2
    if (!fecha || !numPersonas || !lugar) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Por favor, complete todos los campos requeridos",
        confirmButtonText: "Entendido",
      });
      return;
    }

    if (archivoAdjunto.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Archivo requerido",
        text: "Por favor, adjunte el recibo del anticipo antes de guardar",
        confirmButtonText: "Entendido",
      });
      return;
    }

    // Mostrar loader inicial
    Swal.fire({
      title: "Procesando anticipo",
      html: `
                <div class="upload-progress">
                    <div class="upload-icon">
                        <i class="fas fa-file-invoice-dollar"></i>
                    </div>
                    <div class="upload-text">
                        Preparando archivos...
                    </div>
                </div>
            `,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Array para almacenar las URLs de los archivos
    const downloadURLs = [];

    // Subir cada archivo
    for (let i = 0; i < archivoAdjunto.length; i++) {
      const archivo = archivoAdjunto[i];
      const timestamp = Date.now();
      const nombreArchivo = `${timestamp}_${archivo.name}`;
      const storageRef = firebase
        .storage()
        .ref(`recibosAnticipo/${prospectoActualId}/${nombreArchivo}`);

      // Subir con progreso
      const uploadTask = storageRef.put(archivo);

      await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            Swal.update({
              html: `
                                <div class="upload-progress">
                                    <div class="upload-icon">
                                        <i class="fas fa-file-upload"></i>
                                    </div>
                                    <div class="upload-text">
                                        Subiendo archivo ${i + 1} de ${
                archivoAdjunto.length
              }
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress" style="width: ${progress}%"></div>
                                    </div>
                                    <div class="upload-percentage">${Math.round(
                                      progress
                                    )}%</div>
                                </div>
                            `,
            });
          },
          (error) => {
            reject(error);
          },
          async () => {
            const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
            downloadURLs.push(downloadURL);
            resolve();
          }
        );
      });
    }

    // Convertir fecha
    const fechaEvento = new Date(fecha).getTime();

    // Actualizar Firestore
    const seguimientoDoc = await db
      .collection("seguimientoProspectos")
      .doc(prospectoActualId)
      .get();
    const seguimientoData = seguimientoDoc.data();

    await db
      .collection("seguimientoProspectos")
      .doc(prospectoActualId)
      .update({
        paso7_adjuntarRecibosAnticipoURL:
          firebase.firestore.FieldValue.arrayUnion(...downloadURLs),
      });

    await db.collection("prospectos").doc(prospectoActualId).update({
      fecha_evento: fechaEvento,
      invitados: numPersonas,
      pregunta_por: lugar,
      pregunta_porMin: lugar.toLowerCase(),
    });

    // Calcular y actualizar porcentaje
    const completedSteps = Object.values(seguimientoData).filter(
      (value) => value === true || (Array.isArray(value) && value.length > 0)
    ).length;
    const porcentaje = Math.round((completedSteps / 13) * 100);

    await db.collection("prospectos").doc(prospectoActualId).update({
      porcentaje: porcentaje.toString(),
    });

    // Limpiar los archivos almacenados
    archivosAnticipo = [];

    // Mostrar mensaje de éxito
    await Swal.fire({
      icon: "success",
      title: "¡Anticipo registrado!",
      html: `
                <div class="success-message">
                    <div class="success-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="success-details">
                        <p>Se ha registrado el anticipo correctamente</p>
                        <div class="details-grid">
                            <div class="detail-item">
                                <i class="fas fa-calendar"></i>
                                <span>Fecha: ${new Date(
                                  fechaEvento
                                ).toLocaleDateString()}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-users"></i>
                                <span>Invitados: ${numPersonas}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>Lugar: ${lugar}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });

    mostrarPasoSeguimiento(7);
  } catch (error) {
    console.error("Error al guardar anticipo:", error);
    Swal.fire({
      icon: "error",
      title: "Error al guardar",
      text: "Hubo un problema al procesar el anticipo: " + error.message,
      confirmButtonText: "Entendido",
    });
  }
}

function initializeFlatpickr() {
  flatpickr("#fecha-cita", {
    enableTime: true,
    dateFormat: "Y-m-d H:i",
    minDate: "today",
    locale: Spanish,
    time_24hr: true,
    onChange: function (selectedDates, dateStr, instance) {
      fechaCitaSeleccionada = selectedDates[0];
    },
  });
}

function mostrarCalendario(paso) {
  pasoActual = paso;
  const calendarModal = new bootstrap.Modal(
    document.getElementById("calendarModal")
  );
  calendarModal.show();
  //initializeFlatpickr(); //No longer needed, Flatpickr is initialized within agendarCita
  agendarCita(paso);
}

// Actualizar los datos de los pasos
const pasosData = [
    {
      titulo: "Crear Prospecto",
      contenido: "Captura inicial de datos del prospecto en el sistema.",
      accionesRecomendadas: [
        "Registrar información básica",
        "Verificar datos ingresados",
      ],
      botones: [],
      campoCompletado: "paso1_CrearProspecto",
    },
    {
      titulo: "Llamar para ofrecer paquetes",
      contenido: "Primer contacto telefónico para presentación de servicios.",
      accionesRecomendadas: [
        "Preparar presentación de paquetes",
        "Documentar respuesta del cliente",
      ],
      botones: [{ texto: "Adjuntar evidencia", icono: "fas fa-paperclip", clase: "btn-secondary", accion: "adjuntarArchivo(2)" }],
      campoCompletado: "paso2_llamarInformacion",
    },
    {
      titulo: "Agendar Cita",
      contenido: "Coordinar reunión presencial para presentación detallada.",
      accionesRecomendadas: [
        "Definir fecha y hora conveniente",
        "Confirmar lugar de reunión",
      ],
      botones: [{ texto: "Agendar cita", icono: "fas fa-calendar", clase: "btn-secondary", accion: "agendarCita(3)" }],
      campoCompletado: "paso3_agendarCita",
    },
    {
      titulo: "Confirmar cita dia o horas antes",
      contenido: "Verificación previa de asistencia a la reunión programada.",
      accionesRecomendadas: [
        "Enviar recordatorio 24h antes",
        "Confirmar asistencia el mismo día",
      ],
      botones: [{ texto: "Adjuntar evidencia", icono: "fas fa-paperclip", clase: "btn-secondary", accion: "adjuntarArchivo(4)" }],
      campoCompletado: "paso4_llamarConfirmarCita",
    },
    {
      titulo: "Subir evidencia de paquetes ofrecidos",
      contenido: "Documentación de propuesta comercial presentada.",
      accionesRecomendadas: [
        "Detallar servicios presentados",
        "Registrar cotización formal",
        "Documentar condiciones especiales",
      ],
      botones: [],
      campoCompletado: "paso5_completado",
    },
    {
      titulo: "Que fecha se atendio",
      contenido: "Registro de reunión presencial realizada.",
      accionesRecomendadas: [
        "Documentar puntos tratados y acuerdos alcanzados",
      ],
      botones: [{ texto: "Agendar cita", icono: "fas fa-calendar", clase: "btn-secondary", accion: "agendarCita(6)" }],
      campoCompletado: "paso6_fechaCitaAtendida",
    },
    {
      titulo: "Anticipo",
      contenido: "Gestión del pago inicial y documentación.",
      accionesRecomendadas: [
        "Verificar monto recibido",
        "Emitir comprobante oficial",
      ],
      botones: [],
      campoCompletado: "paso7_adjuntarRecibosAnticipoURL",
    },
    {
      titulo: "Agendar Cita para firmar contrato",
      contenido: "Programación de firma de documentos oficiales.",
      accionesRecomendadas: [
        "Preparar documentación completa",
        "Confirmar disponibilidad de todas las partes",
      ],
      botones: [{ texto: "Agendar cita", icono: "fas fa-calendar", clase: "btn-secondary", accion: "agendarCita(8)" }],
      campoCompletado: "paso8_agendarCitaParaFirmar",
    },
    {
      titulo: "Confirmar cita",
      contenido: "Verificación final para firma de contrato.",
      accionesRecomendadas: [
        "Confirmar horario y ubicación",
        "Verificar documentación necesaria",
      ],
      botones: [{ texto: "Registrar confirmación", icono: "fab fa-whatsapp", clase: "btn-secondary", accion: "adjuntarArchivo(9)" }],
      campoCompletado: "paso9_confirmacionCita",
    },
    {
      titulo: "Subir evidencia del contrato",
      contenido: "Documentación del proceso de firma de contrato.",
      accionesRecomendadas: [
        "Verificar firmas completas",
        "Digitalizar documentación",
      ],
      botones: [{ texto: "Adjuntar evidencia", icono: "fas fa-paperclip", clase: "btn-secondary", accion: "adjuntarArchivo(10)" }],
      campoCompletado: "paso10_firmaContratoEvidendiasURL",
    },
    {
      titulo: "Agendar Cita para recibir el pago",
      contenido: "Coordinación para recepción del segundo pago (30%).",
      accionesRecomendadas: [
        "Confirmar método de pago",
        "Programar fecha de recepción",
      ],
      botones: [{ texto: "Agendar cita", icono: "fas fa-calendar", clase: "btn-secondary", accion: "agendarCita(11)" }],
      campoCompletado: "paso11_agendarCitaParaEntregaPorcentaje",
    },
    {
      titulo: "Adjuntar recibo",
      contenido: "Registro y documentación del pago recibido.",
      accionesRecomendadas: [
        "Verificar monto completo",
        "Emitir documentación correspondiente",
      ],
      botones: [{ texto: "Adjuntar evidencia", icono: "fas fa-paperclip", clase: "btn-secondary", accion: "adjuntarArchivo(12)" }],
      campoCompletado: "paso12_atencionCitaEvidenciaRecibosURL",
    },
    {
      titulo: "Asignación de usuario y contraseña",
      contenido: "Creación de accesos para el cliente.",
      accionesRecomendadas: [
        "Generar credenciales únicas",
        "Enviar información de acceso",
      ],
      botones: [{ texto: "Generar Credenciales", icono: "fas fa-user-plus", clase: "btn-primary", accion: "generarCredenciales()" }],
      campoCompletado: "paso13_asignacionUsuario",
    },
  ];

async function cargarDatosAnticipo() {
  try {
    // Obtener el documento del prospecto
    const prospectoDoc = await db
      .collection("prospectos")
      .doc(prospectoActualId)
      .get();

    if (!prospectoDoc.exists) {
      console.error("No se encontró el prospecto con el ID proporcionado.");
      alert("No se encontraron datos para este prospecto.");
      return;
    }

    const prospectoData = prospectoDoc.data();

    // Asignar valores a los campos
    if (prospectoData.fecha_evento) {
      const fecha = new Date(prospectoData.fecha_evento)
        .toISOString()
        .split("T")[0]; // Convertir milisegundos a formato YYYY-MM-DD
      document.getElementById("fecha").value = fecha;
    }

    if (prospectoData.invitados) {
      document.getElementById("numPersonas").value = prospectoData.invitados;
    }

    if (prospectoData.pregunta_por) {
      document.getElementById("lugar").value = prospectoData.pregunta_por;
    }

    console.log("Datos cargados correctamente:", prospectoData);
  } catch (error) {
    console.error("Error al cargar los datos del anticipo:", error);
    alert("Error al cargar los datos del anticipo.");
  }
}

async function verificarPaso5() {
  const descripcion = document.getElementById("descripcion").value.trim();

  // Validaciones con SweetAlert2
  if (!descripcion) {
    Swal.fire({
      icon: "warning",
      title: "Campo requerido",
      text: "Por favor, ingrese una descripción de los paquetes ofrecidos.",
      confirmButtonText: "Entendido",
    });
    return;
  }

  if (archivoAdjunto.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Archivo requerido",
      text: "Por favor, adjunte al menos un archivo de evidencia.",
      confirmButtonText: "Entendido",
    });
    return;
  }

  if (publicacionesGuardadas.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Selección requerida",
      text: "Por favor, seleccione al menos un paquete.",
      confirmButtonText: "Entendido",
    });
    return;
  }

  // Mostrar loading
  Swal.fire({
    title: "Guardando información",
    html: "Por favor espere...",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  try {
    const updateData = {
      paso5_descripcion: descripcion,
      paso5_idsPublicaciones: Array.from(publicacionesGuardadas),
    };

    // Subir archivos
    const downloadURLs = [];
    for (const file of archivoAdjunto) {
      const storageRef = firebase
        .storage()
        .ref(`prospectos/${prospectoActualId}/paso5/${file.name}`);
      await storageRef.put(file);
      const downloadURL = await storageRef.getDownloadURL();
      downloadURLs.push(downloadURL);
    }
    updateData.paso5_adjuntarCotizacionURL =
      firebase.firestore.FieldValue.arrayUnion(...downloadURLs);

    // Actualizar datos en Firestore
    await db
      .collection("seguimientoProspectos")
      .doc(prospectoActualId)
      .set(updateData, { merge: true });

    // Completar paso 5
    await completarPaso(5);

    const porcentaje = calcularPorcentaje(5);
    await db.collection("prospectos").doc(prospectoActualId).update({
      porcentaje: porcentaje,
    });

    // Mostrar mensaje de éxito
    await Swal.fire({
      icon: "success",
      title: "¡Completado!",
      text: "La información se guardó correctamente",
      showConfirmButton: false,
      timer: 2000,
    });

    mostrarPasoSeguimiento(5);
  } catch (error) {
    console.error("Error al guardar:", error);

    // Mostrar mensaje de error
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Hubo un problema al guardar los cambios. Por favor, intente nuevamente.",
      confirmButtonText: "Entendido",
      footer: `<small class="text-muted">Error: ${error.message}</small>`,
    });
  }
}

// Función auxiliar para mostrar el progreso de carga de archivos (opcional)
function mostrarProgresoArchivos(progreso) {
  const porcentaje = Math.round(progreso);
  Swal.update({
    title: "Subiendo archivos",
    html: `
            <div class="progress" style="height: 20px;">
                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                     role="progressbar" 
                     style="width: ${porcentaje}%" 
                     aria-valuenow="${porcentaje}" 
                     aria-valuemin="0" 
                     aria-valuemax="100">
                    ${porcentaje}%
                </div>
            </div>
        `,
  });
}

// Event Listeners para navegación
document.getElementById("pasoAnterior").addEventListener("click", () => {
  if (pasoActual > 1) {
    pasoActual--;
    mostrarPasoSeguimiento(pasoActual);
  }
});

document.getElementById("pasoSiguiente").addEventListener("click", () => {
  if (pasoActual < 13 && pasosCompletados.has(pasoActual)) {
    pasoActual++;
    mostrarPasoSeguimiento(pasoActual);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const filtroSelect = document.getElementById("filtro-select");
  const filtroInput = document.getElementById("filtro-input");
  const filtrarBtn = document.getElementById("filtrar-btn");
  const filtrarContainer = document.getElementById("filtrar-container");
  const prospectosLista = document.getElementById("prospectos-lista");
  const loaderContainer = document.getElementById("loader");

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
  const tableBody = document.querySelector(".table-responsive");
  tableBody.addEventListener("scroll", () => {
    if (
      tableBody.scrollTop + tableBody.clientHeight >=
      tableBody.scrollHeight - 100
    ) {
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

  async function cargarProspectos(query) {
    isLoading = true;
    loaderContainer.classList.remove("hidden");
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
      loaderContainer.classList.add("hidden");
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
    row.addEventListener("click", () =>
      mostrarModalProspecto(prospecto, id, nombreAsesor)
    );
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

async function completarPaso(paso) {
  // Logic to mark the step as completed
  pasosCompletados.add(paso);

  // Enable the next step button
  document.getElementById("pasoSiguiente").disabled = false;

  // Update the current step visualization
  mostrarPasoSeguimiento(paso);
}

// Add this function to handle backdrop cleanup
function limpiarBackdrop() {
  const backdrops = document.getElementsByClassName("modal-backdrop");
  while (backdrops.length > 0) {
    backdrops[0].parentNode.removeChild(backdrops[0]);
  }
  document.body.classList.remove("modal-open");
}

// Modify the event listeners for modal closing
document
  .getElementById("prospectoModal")
  .addEventListener("hidden.bs.modal", limpiarBackdrop);
document
  .getElementById("seguimientoModal")
  .addEventListener("hidden.bs.modal", limpiarBackdrop);
document
  .getElementById("modalMasInformacion")
  .addEventListener("hidden.bs.modal", limpiarBackdrop);

console.log("Modal backdrop and outside click issues have been addressed.");
