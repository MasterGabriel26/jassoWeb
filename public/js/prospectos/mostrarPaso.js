async function mostrarPasoSeguimiento(paso) {
    if (typeof pasosCompletados === "undefined") {
      pasosCompletados = new Set();
    }
    if (!paso) {
      const seguimientoDoc = await db
        .collection("seguimientoProspectos2")
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
      .collection("seguimientoProspectos2")
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
                            <div class="anticipo-actions">
                                <button class="btn btn-secondary" onclick="adjuntarArchivo(${paso})" data-paso="${paso}">
                                    <i class="fas fa-paperclip"></i> Adjuntar más documentos
                                </button>
                            </div>
                        </div>
                    `;
                }
            } else {
                botonesHTML = `
                    <div class="anticipo-modal">
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
                            <div class="anticipo-buttons">
                                <button class="btn btn-primary" onclick="guardarDatosAnticipo()">
                                    <i class="fas fa-save"></i> Guardar información
                                </button>
                                <button class="btn btn-secondary" onclick="seleccionarArchivosAnticipo(${paso})" data-paso="${paso}">
                                    <i class="fas fa-paperclip"></i> Adjuntar recibo
                                </button>
                            </div>
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


  async function mostrarModalProspecto(prospecto, id, nombreAsesor) {


    const loading = document.getElementById('modalLoading');
    loading.classList.add('show');
    try{
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
      .collection("seguimientoProspectos2")
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
  
  
    const modalUltimoEditor = document.getElementById("modalUltimoEditor");
    if (modalUltimoEditor) {const ultimoEditorId = prospecto.nombreUsuarioModificador && prospecto.nombreUsuarioModificador.length > 0 ? 
      prospecto.nombreUsuarioModificador[prospecto.nombreUsuarioModificador.length - 1] : null;
  
  const asesorNameElement = modalUltimoEditor.querySelector('.asesor-name');
  
  if (!ultimoEditorId) {
      // Si no hay último editor, mostrar "Sin editar"
      if (asesorNameElement) {
          asesorNameElement.textContent = "Sin editar";
      }
  } else {
      try {
          // Cargar datos del último editor
          const editorDoc = await db.collection("usuarios").doc(ultimoEditorId).get();
          if (editorDoc.exists) {
              const editorData = editorDoc.data();
              
              // Actualizar el nombre visible
              if (asesorNameElement) {
                  asesorNameElement.textContent = editorData.name || "Usuario";
              }
  
              const profileCard = modalUltimoEditor.querySelector('.asesor-profile-card');
              
              if (profileCard && editorData) {
                  // Avatar
                  const avatarElement = profileCard.querySelector('.profile-avatar');
                  if (avatarElement) {
                      if (editorData.imageProfile) {
                          avatarElement.style.backgroundImage = `url(${editorData.imageProfile})`;
                          avatarElement.textContent = '';
                      } else {
                          const initials = editorData.name
                              ? editorData.name
                                  .split(' ')
                                  .map(n => n[0])
                                  .join('')
                                  .toUpperCase()
                              : "U";
                          avatarElement.textContent = initials;
                          avatarElement.style.backgroundImage = '';
                          avatarElement.style.background = `linear-gradient(45deg, #2d3456, #1e2330)`;
                      }
                  }
  
                  // Información básica
                  const profileName = profileCard.querySelector('.profile-name');
                  if (profileName) {
                      profileName.textContent = editorData.name || "Usuario";
                  }
                  
                  const profilePhone = profileCard.querySelector('.profile-phone');
                  if (profilePhone) {
                      profilePhone.textContent = editorData.phone || 'Sin teléfono';
                  }
                  
                  // Estado online/offline
                  const statusElement = profileCard.querySelector('.profile-status');
                  if (statusElement) {
                      statusElement.className = `profile-status ${editorData.onLine ? 'online' : 'offline'}`;
                  }
  
                  try {
                      // Estadísticas
                      const prospectosCount = await db.collection("prospectos2")
                          .where("nombreUsuarioModificador", "array-contains", ultimoEditorId)
                          .get()
                          .then(snap => snap.size);
  
                      const ventasCount = await db.collection("prospectos2")
                          .where("nombreUsuarioModificador", "array-contains", ultimoEditorId)
                          .where("status", "==", "VENTA_CONFIRMADA")
                          .get()
                          .then(snap => snap.size);
  
                      const prospectosElement = profileCard.querySelector('.prospectos-count');
                      if (prospectosElement) prospectosElement.textContent = prospectosCount;
  
                      const ventasElement = profileCard.querySelector('.ventas-count');
                      if (ventasElement) ventasElement.textContent = ventasCount;
                  } catch (statsError) {
                      console.error("Error al cargar estadísticas:", statsError);
                  }
              }
          } else {
              // Si no se encuentra el documento del editor
              if (asesorNameElement) {
                  asesorNameElement.textContent = "Usuario no encontrado";
              }
          }
      } catch (error) {
          console.error("Error al cargar datos del último editor:", error);
          if (asesorNameElement) {
              asesorNameElement.textContent = "Error al cargar editor";
          }
      }
  }
    }
  
  
    
    // Modificar la parte donde se establece el asesor
  const modalAsesor = document.getElementById("modalAsesor");
  if (modalAsesor) {
      const asesorNameElement = modalAsesor.querySelector('.asesor-name');
      if (asesorNameElement) {
          asesorNameElement.textContent = nombreAsesor;
      }
  
      // Cargar datos del asesor para el tooltip
      if (prospecto.asesor) {
          try {
              const asesorDoc = await db.collection("usuarios").doc(prospecto.asesor).get();
              if (asesorDoc.exists) {
                  const asesorData = asesorDoc.data();
                  const profileCard = modalAsesor.querySelector('.asesor-profile-card');
                  
                  if (profileCard) {
                      // Avatar
                      const avatarElement = profileCard.querySelector('.profile-avatar');
                      if (avatarElement) {
                          if (asesorData.imageProfile) {
                              avatarElement.style.backgroundImage = `url(${asesorData.imageProfile})`;
                              avatarElement.textContent = '';
                          } else {
                              const initials = nombreAsesor
                                  .split(' ')
                                  .map(n => n[0])
                                  .join('')
                                  .toUpperCase();
                              avatarElement.textContent = initials;
                              avatarElement.style.backgroundImage = '';
                              avatarElement.style.background = `linear-gradient(45deg, #2d3456, #1e2330)`;
                          }
                      }
  
                      // Información básica
                      const profileName = profileCard.querySelector('.profile-name');
                      if (profileName) profileName.textContent = nombreAsesor;
                      
                      const profilePhone = profileCard.querySelector('.profile-phone');
                      if (profilePhone) profilePhone.textContent = asesorData.phone || 'Sin teléfono';
                      
                      // Estado online/offline
                      const statusElement = profileCard.querySelector('.profile-status');
                      if (statusElement) {
                          statusElement.className = `profile-status ${asesorData.onLine ? 'online' : 'offline'}`;
                      }
  
                      // Estadísticas
                      const prospectosCount = await db.collection("prospectos2")
                          .where("asesor", "==", prospecto.asesor)
                          .get()
                          .then(snap => snap.size);
  
                      const ventasCount = await db.collection("prospectos2")
                          .where("asesor", "==", prospecto.asesor)
                          .where("status", "==", "VENTA_CONFIRMADA")
                          .get()
                          .then(snap => snap.size);
  
                      const prospectosElement = profileCard.querySelector('.prospectos-count');
                      if (prospectosElement) prospectosElement.textContent = prospectosCount;
  
                      const ventasElement = profileCard.querySelector('.ventas-count');
                      if (ventasElement) ventasElement.textContent = ventasCount;
                  }
              }
          } catch (error) {
              console.error("Error al cargar datos del asesor:", error);
          }
      }
  }
  
  
  
    const btnSeguimiento = document.getElementById("btnSeguimiento");
    btnSeguimiento.textContent = `Seguimiento ${prospecto.porcentaje}%`;
    btnSeguimiento.onclick = async () => {
      const prospectoModal = bootstrap.Modal.getInstance(
        document.getElementById("prospectoModal")
      );
      prospectoModal.hide();
      const seguimientoDoc = await db
        .collection("seguimientoProspectos2")
        .doc(id)
        .get();
      const seguimientoData = seguimientoDoc.exists ? seguimientoDoc.data() : {};
      const pasoToShow = calcularPasoInicial(seguimientoData);
      mostrarPasoSeguimiento(pasoToShow);
    };
  
  
    const btnPaquetes= document.getElementById("btnPaquetes")
    const btnPagos= document.getElementById("btnPagos")
  // En el botón de paquetes:
  btnPaquetes.onclick = () => mostrarModalPaquetes(prospecto.telefono_prospecto);
  
  btnPagos.onclick = () => mostrarModalPagos(prospecto);
  
   // Inicializar los botones de contacto
   inicializarBotonesContacto(prospecto, id);
  
  
  
  
    
    const modal = new bootstrap.Modal(document.getElementById("prospectoModal"), {
      backdrop: "static",
      keyboard: false,
    });
    loading.classList.remove('show');
    modal.show();
  
  
  }catch(error){
    console.error("Error al cargar los datos:", error);
    // Ocultar loading en caso de error
    loading.classList.remove('show');
    // Mostrar mensaje de error si lo deseas
    mostrarAlerta('Error al cargar los datos del prospecto', 'error');
  }
  
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
  


// Función para marcar como visto un prospecto compartido
async function marcarProspectoComoVisto(prospectoCompartidoId) {
    try {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) return;

        const prospectoCompartidoRef = firebase.firestore()
            .collection('prospectoCompartidos')
            .doc(prospectoCompartidoId);

        const doc = await prospectoCompartidoRef.get();
        if (!doc.exists) return;

        const data = doc.data();
        const index = data.uidDestino.indexOf(currentUser.uid);
        
        if (index !== -1 && !data.vistos[index]) {
            // Actualizar el array de vistos
            const newVistos = [...data.vistos];
            newVistos[index] = true;

            await prospectoCompartidoRef.update({
                vistos: newVistos
            });
        }
    } catch (error) {
        console.error('Error al marcar prospecto como visto:', error);
    }
}


  // En la página de prospectos, modificar el listener para usar el ID
document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const prospectoId = urlParams.get('id'); // Este será el ID real del prospecto

    const prospectoCompartidoId = urlParams.get('prospectoCompartidoId');

    if (action === 'openProspecto' && prospectoId) {
        try {


               // Si viene de un prospecto compartido, marcarlo como visto
               if (prospectoCompartidoId) {
                await marcarProspectoComoVisto(prospectoCompartidoId);
            }
            // Obtener los datos del prospecto usando el ID
            const prospectoDoc = await db.collection('prospectos2').doc(prospectoId).get();
            
            if (prospectoDoc.exists) {
                const prospectoData = prospectoDoc.data();
                
                // Obtener el nombre del asesor
                let nombreAsesor = "Sin asignar";
                if (prospectoData.asesor) {
                    const asesorDoc = await db.collection('usuarios').doc(prospectoData.asesor).get();
                    if (asesorDoc.exists) {
                        nombreAsesor = asesorDoc.data().name || "Sin asignar";
                    }
                }

                // Abrir el modal usando la función existente
                await mostrarModalProspecto(prospectoData, prospectoId, nombreAsesor);
            } else {
                console.error('Prospecto no encontrado');
                mostrarAlerta('Prospecto no encontrado', 'error');
            }
        } catch (error) {
            console.error('Error al abrir el prospecto:', error);
            mostrarAlerta('Error al cargar el prospecto', 'error');
        }
    }
});
