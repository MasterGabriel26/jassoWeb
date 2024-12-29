let isLoading = false;
let attachmentSuccess = false;
let archivoAdjunto=null;
let pasoActual = 0; // Cambia este valor dependiendo del paso en el que estés


// Define formatearFecha in the global scope
let pasosCompletados = new Set();
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
        const prospectoModal = bootstrap.Modal.getInstance(document.getElementById("prospectoModal"));
        prospectoModal.hide();
        const seguimientoDoc = await db.collection("seguimientoProspectos").doc(id).get();
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
        backdrop: 'static',
        keyboard: false
    });
    modal.show();
    
}

function calcularPasoInicial(seguimientoData) {
    // Check each step in order
    if (!seguimientoData.paso1_CrearProspecto) return 1;
    if (!seguimientoData.paso2_llamarInformacion && !seguimientoData.paso2_adjuntarEvidenciaURL?.length) return 2;
    if (!seguimientoData.paso3_agendarCita) return 3;
    if (!seguimientoData.paso4_llamarConfirmarCita && !seguimientoData.paso4_adjuntarEvidenciaURL?.length) return 4;
    if (!seguimientoData.paso5_adjuntarCotizacionURL?.length && !seguimientoData.paso5_idsPublicaciones?.length && !seguimientoData.paso5_descripcion) return 5;
    if (!seguimientoData.paso6_fechaCitaAtendida) return 6;
    if (!seguimientoData.paso7_adjuntarRecibosAnticipoURL && !seguimientoData.paso7_revision) return 7;
    if (!seguimientoData.paso8_agendarCitaParaFirmar) return 8;
    if (!seguimientoData.paso9_confirmacionCita) return 9;
    if (!seguimientoData.paso10_firmaContratoEvidendiasURL?.length && !seguimientoData.paso10_revision) return 10;
    if (!seguimientoData.paso11_agendarCitaParaEntregaPorcentaje) return 11;
    if (!seguimientoData.paso12_atencionCitaEvidenciaRecibosURL?.length && !seguimientoData.paso12_revision) return 12;
    if (!seguimientoData.paso13_asignacionUsuario) return 13;
    
    // If all steps are completed, return the last step
    return 13;
}

let tempStep5Data = {
    file: null,
    description: '',
};

async function mostrarPasoSeguimiento(paso) {
    if (typeof pasosCompletados === 'undefined') {
        pasosCompletados = new Set();
    }
    if (!paso) {
        const seguimientoDoc = await db.collection("seguimientoProspectos").doc(prospectoActualId).get();
        const seguimientoData = seguimientoDoc.exists ? seguimientoDoc.data() : {};
        paso = calcularPasoInicial(seguimientoData);
    }
    pasoActual = paso;
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
    if (seguimientoData.paso5_adjuntarCotizacionURL?.length > 0 || seguimientoData.paso5_idsPublicaciones?.length > 0 || seguimientoData.paso5_descripcion) pasosCompletados.add(5);
    if (seguimientoData.paso6_fechaCitaAtendida > 0) pasosCompletados.add(6);
    if (seguimientoData.paso7_adjuntarRecibosAnticipoURL?.length > 0 || seguimientoData.paso7_revision) pasosCompletados.add(7);
    if (seguimientoData.paso8_agendarCitaParaFirmar > 0) pasosCompletados.add(8);
    if (seguimientoData.paso9_confirmacionCita) pasosCompletados.add(9);
    if (seguimientoData.paso10_firmaContratoEvidendiasURL?.length > 0 || seguimientoData.paso10_revision) pasosCompletados.add(10);
    if (seguimientoData.paso11_agendarCitaParaEntregaPorcentaje > 0) pasosCompletados.add(11);
    if (seguimientoData.paso12_atencionCitaEvidenciaRecibosURL?.length > 0 || seguimientoData.paso12_revision) pasosCompletados.add(12);
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
        case 3:
            if (pasosCompletados.has(paso)) {
                const fechaCita = new Date(seguimientoData[`paso11_agendarCitaParaEntregaPorcentaje`] || seguimientoData[`paso11_agendarCitaParaEntregaPorcentaje`]);
                botonesHTML = `
                    <button class="btn btn-success btn-action" disabled>
                        <i class="fas fa-calendar-check"></i> Cita agendada
                    </button>
                    <p class="mt-2">Fecha de la cita: ${fechaCita.toLocaleString()}</p>
                `;
            } else {
                botonesHTML = `
                    <button class="btn btn-secondary btn-action" onclick="agendarCita(${paso})">
                        <i class="fas fa-calendar"></i> Agendar cita
                    </button>
                `;
            }
            break;
        case 9:         
           if (pasosCompletados.has(paso)) {
            const mensajeWhatsApp = seguimientoData.paso9_confirmacionCita || '';
            botonesHTML = `
                <div class="text-center">
                    <button class="btn btn-success btn-action mb-3" disabled>
                        <i class="fas fa-check"></i> Confirmación enviada
                    </button>
                    <div class="mt-3">
                        <label class="block text-sm font-medium mb-2">Mensaje enviado:</label>
                        <div class="p-3 bg-gray-100 rounded-lg">
                            ${mensajeWhatsApp}
                        </div>
                    </div>
                </div>
            `;
        } else {
            botonesHTML = `
                <div class="space-y-4">
                    <div class="space-y-4">
                    <div class="form-group">
                       <textarea 
                            id="mensajeWhatsApp" 
                            class="form-control w-full p-5 border rounded" 
                            rows="3"
                            placeholder="Escribe el mensaje que enviaste al prospecto..."
                        ></textarea>
                    </div>
                    <div class="flex flex-col gap-2" style="justify-content:center;" >
                        <button class="btn btn-primary" style="margin-top:10px;" onclick="guardarConfirmacionCita()">
                            <i class="fas fa-save me-2"></i>Guardar confirmación
                        </button>
                    </div>
                </div>
            `;
        }
        break;

        case 12:
            if (pasosCompletados.has(paso)) {
                botonesHTML = `
                    <button class="btn btn-success btn-action" disabled>
                        <i class="fas fa-check"></i> Evidencia adjuntada
                    </button>
                `;
            } else {
                botonesHTML = `
                    <button class="btn btn-secondary btn-action" onclick="adjuntarArchivo(${paso})" data-paso="${paso}">
                        <i class="fas fa-paperclip"></i> Adjuntar recibo
                    </button>
                `;
            }
            break;
    
        case 8:
            if (pasosCompletados.has(paso)) {
                const fechaCita = new Date(seguimientoData[`paso8_agendarCitaParaFirmar`] || seguimientoData[`paso${paso}_fechaCitaAtendida`]);
                botonesHTML = `
                    <button class="btn btn-success btn-action" disabled>
                        <i class="fas fa-calendar-check"></i> Cita agendada
                    </button>
                    <p class="mt-2">Fecha de la cita: ${fechaCita.toLocaleString()}</p>
                `;
            } else {
                botonesHTML = `
                    <button class="btn btn-secondary btn-action" onclick="agendarCita(${paso})">
                        <i class="fas fa-calendar"></i> Agendar cita
                    </button>
                `;
            }
            break;
        case 11:
            if (pasosCompletados.has(paso)) {
                const fechaCita = new Date(seguimientoData[`paso11_agendarCitaParaEntregaPorcentaje`] || seguimientoData[`paso11_agendarCitaParaEntregaPorcentaje`]);
                botonesHTML = `
                    <button class="btn btn-success btn-action" disabled>
                        <i class="fas fa-calendar-check"></i> Cita agendada
                    </button>
                    <p class="mt-2">Fecha de la cita: ${fechaCita.toLocaleString()}</p>
                `;
            } else {
                botonesHTML = `
                    <button class="btn btn-secondary btn-action" onclick="agendarCita(${paso})">
                        <i class="fas fa-calendar"></i> Agendar cita
                    </button>
                `;
            }
            break;
        case 5:
            if (pasosCompletados.has(paso)) {
                const descripcion = seguimientoData.paso5_descripcion || '';
            botonesHTML = `
                <div class="text-center">
                   
                    <button class="btn btn-success btn-action" disabled>
                        <i class="fas fa-check"></i> Paquetes ofrecidos
                    </button>
                    <div class="mt-3">
                        <label class="block text-sm font-medium mb-2">Descripcion:</label>
                        <div class="p-3 bg-gray-100 rounded-lg">
                            ${descripcion}
                        </div>
                    </div>
                </div>
                
                `;
            } else {
                botonesHTML = `
                    <div class="space-y-4">
                        <div class="form-group">
                            <label for="descripcion" class="block text-sm font-medium mb-2">Descripción de paquetes ofrecidos</label>
                            <textarea 
                                id="descripcion" 
                                class="form-control w-full p-2 border rounded" 
                                rows="3"
                                placeholder="Ingrese la descripción de los paquetes ofrecidos..."
                            >${seguimientoData.paso5_descripcion || ''}</textarea>
                        </div>
                        <div class="flex flex-col gap-2">
                            <button class="btn btn-secondary btn-action" onclick="adjuntarArchivoPaso(5)" data-paso="5">
                                <i class="fas fa-paperclip me-2"></i>Adjuntar archivos
                            </button>
                            <button class="btn btn-secondary btn-action" onclick="mostrarPublicaciones()" data-paso="55">
                                <i class="fas fa-share me-2"></i>Seleccionar paquetes
                            </button>
                            <button class="btn btn-primary mt-4" onclick="verificarPaso5()">
                                Guardar y Completar
                            </button>
                        </div>
                    </div>
                `;
            }
            break;
        case 7:
            if (pasosCompletados.has(paso)) {
                botonesHTML = `
                    <button class="btn btn-success btn-action" disabled>
                        <i class="fas fa-check"></i> Anticipo registrado
                    </button>
                `;
            } else {
                // Mantener el código existente para el paso 7
                botonesHTML = `
                    <div class="space-y-4">
                        <div class="form-group">
                            <label for="fecha" class="block text-sm font-medium mb-2">Fecha</label>
                            <input type="date" id="fecha" class="form-control w-full p-2 border rounded" />
                        </div>
                        <div class="form-group">
                            <label for="numPersonas" class="block text-sm font-medium mb-2">No. Personas</label>
                            <input type="number" id="numPersonas" class="form-control w-full p-2 border rounded" value="" />
                        </div>
                        <div class="form-group">
                            <label for="lugar" class="block text-sm font-medium mb-2">Lugar</label>
                            <select id="lugar" class="form-control w-full p-2 border rounded">
                                <option value="">Seleccione un lugar</option>
                                ${await obtenerLugaresOptions()}
                            </select>
                        </div>
                        <div class="flex gap-4 mt-4">
                            <button class="btn btn-primary flex-1" onclick="guardarDatosAnticipo()">
                                Guardar
                            </button>
                            <button class="btn btn-secondary flex-1" onclick="adjuntarArchivoPaso(7)" data-paso="7">
                                <i class="fas fa-paperclip me-2"></i>Adjuntar Recibo
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
                        <div class="text-center">
                            
                            <div class="credentials-container">
                                <div class="credential-item mb-3">
                                    <label class="text-muted d-block mb-2">Email</label>
                                    <div class="credential-value">${email}</div>
                                </div>
                                <div class="credential-item mb-4">
                                    <label class="text-muted d-block mb-2">Password</label>
                                    <div class="credential-value">${password}</div>
                                </div>
                            </div>
                            <button class="btn btn-dark w-100 py-2" onclick="copiarCredenciales('${email}', '${password}')">
                                Copiar
                            </button>
                        </div>
                    `;
                } else {
                    botonesHTML = `
                        <button class="btn btn-primary btn-action" onclick="generarCredenciales()">
                            <i class="fas fa-user-plus me-2"></i>Generar Credenciales
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
                botonesHTML = data.botones.map(boton => `
                    <button class="btn ${boton.clase} btn-action" onclick="${boton.accion}" ${boton.accion.startsWith('adjuntarArchivo') ? `data-paso="${paso}"` : ''}>
                        <i class="${boton.icono} me-2"></i>${boton.texto}
                    </button>
                `).join('');
            }
    }

    botonesContainer.innerHTML = botonesHTML;
    
    // Actualizar navegación
    document.getElementById('numeroPaso').textContent = `Paso ${paso} de 13`;
    document.getElementById('pasoAnterior').disabled = paso === 1;
    document.getElementById('pasoSiguiente').disabled = paso === 13 || !pasosCompletados.has(paso);
    
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
        const modalInstance = new bootstrap.Modal(modal, {
            backdrop: 'static',
            keyboard: false
        });
        modalInstance.show();
    }
}

// Función auxiliar para obtener las opciones de lugares
async function obtenerLugaresOptions() {
    const lugaresSnapshot = await db.collection("lugares").get();
    return lugaresSnapshot.docs.map(doc => {
        const data = doc.data();
        return `<option value="${data.nombreLugar}">${data.nombreLugar}</option>`;
    }).join('');
}



async function generarCredenciales() {
    try {
        console.log("Iniciando generación de credenciales");

        const prospectoDoc = await db.collection("prospectos").doc(prospectoActualId).get();
        const prospectoData = prospectoDoc.data();
        
        if (!prospectoData || !prospectoData.name) {
            throw new Error('El prospecto no tiene nombre registrado o no se encontró');
        }

        console.log("Datos del prospecto obtenidos:", prospectoData);

        // Generar email y contraseña
        const fechaActual = new Date();
        const nombreLimpio = prospectoData.name.toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[áäà]/g, 'a')
            .replace(/[éëè]/g, 'e')
            .replace(/[íïì]/g, 'i')
            .replace(/[óöò]/g, 'o')
            .replace(/[úüù]/g, 'u')
            .replace(/ñ/g, 'n')
            .replace(/[^a-z0-9]/g, '');

        const dia = fechaActual.getDate().toString().padStart(2, '0');
        const mes = (fechaActual.getMonth() + 1).toString().padStart(2, '0');
        const año = fechaActual.getFullYear().toString().slice(-4);
        
        const email = `${nombreLimpio}${dia}${mes}${año}@jasso.com`;
        const password = Math.floor(100000 + Math.random() * 900000).toString();

        console.log("Email generado:", email);
        console.log("Contraseña generada:", password);

        // Crear una instancia secundaria de Firebase
        let secondaryApp;
        try {
            secondaryApp = firebase.initializeApp(
                {
                    ...firebase.app().options,
                    apiKey: firebase.app().options.apiKey,
                    authDomain: firebase.app().options.authDomain,
                    projectId: firebase.app().options.projectId
                },
                'secondary'
            );
        } catch (e) {
            // Si la app ya existe, obtenerla
            secondaryApp = firebase.app('secondary');
        }

        // Crear usuario usando la instancia secundaria
        let userCredential;
        try {
            userCredential = await secondaryApp.auth().createUserWithEmailAndPassword(email, password);
            console.log("Usuario creado en Firebase Authentication");
        } catch (authError) {
            console.error("Error al crear usuario en Firebase Authentication:", authError);
            // Asegurarse de eliminar la app secundaria en caso de error
            await secondaryApp.delete();
            throw authError;
        }

        // Guardar información en Firestore (seguimientoProspectos)
        try {
            await db.collection("seguimientoProspectos").doc(prospectoActualId).update({
                paso13_asignacionUsuario: true,
                paso13_correo: email,
                paso13_pass: password
            });
            console.log("Información guardada en seguimientoProspectos");
        } catch (seguimientoError) {
            console.error("Error al guardar en seguimientoProspectos:", seguimientoError);
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
            userType: "cliente"
        };

        try {
            await db.collection('usuarios').doc(userCredential.user.uid).set(userData);
            console.log("Usuario creado exitosamente en la colección 'usuarios'");
        } catch (usuariosError) {
            console.error("Error al crear usuario en la colección 'usuarios':", usuariosError);
            // Revertir la creación del usuario
            await userCredential.user.delete();
            await db.collection("seguimientoProspectos").doc(prospectoActualId).update({
                paso13_asignacionUsuario: false,
                paso13_correo: firebase.firestore.FieldValue.delete(),
                paso13_pass: firebase.firestore.FieldValue.delete()
            });
            await secondaryApp.delete();
            throw usuariosError;
        }

        // Actualizar porcentaje
        try {
            await db.collection("prospectos").doc(prospectoActualId).update({
                porcentaje: 100
            });
            console.log("Porcentaje actualizado en la colección 'prospectos'");
        } catch (porcentajeError) {
            console.error("Error al actualizar el porcentaje:", porcentajeError);
        }

        // Eliminar la instancia secundaria después de completar todo
        await secondaryApp.delete();

        console.log("Proceso de generación de credenciales completado con éxito");
        alert("El usuario y credenciales han sido generados exitosamente.");
        mostrarPasoSeguimiento(13)
    } catch (error) {
        console.error("Error en el proceso de generación de credenciales:", error);
        alert("Ocurrió un error al generar las credenciales.");
    }
}







async function copiarCredenciales(email, password) {
    try {
        const texto = `Email: ${email}\nContraseña: ${password}`;
        await navigator.clipboard.writeText(texto);
        alert('Credenciales copiadas al portapapeles');
    } catch (err) {
        console.error('Error al copiar al portapapeles:', err);
        alert('Error al copiar las credenciales');
    }
}


async function guardarConfirmacionCita() {
    const mensajeWhatsApp = document.getElementById('mensajeWhatsApp').value.trim();
    
    if (!mensajeWhatsApp) {
        alert('Por favor, ingrese el mensaje que envió por WhatsApp.');
        return;
    }
    
    try {
        await db.collection("seguimientoProspectos").doc(prospectoActualId).update({
            
            paso9_confirmacionCita: mensajeWhatsApp
        });
        
        const porcentaje = calcularPorcentaje(9);
        await db.collection("prospectos").doc(prospectoActualId).update({
            porcentaje: porcentaje
        });
        
        alert('Confirmación guardada exitosamente');
        mostrarPasoSeguimiento(9);
    } catch (error) {
        console.error("Error al guardar la confirmación:", error);
        alert("Error al guardar la confirmación");
    }
}



let modalAnteriorAbierto;

function abrirModalMasInformacion() {
    modalAnteriorAbierto = bootstrap.Modal.getInstance(document.getElementById("seguimientoModal"));
    modalAnteriorAbierto.hide();

    const modalMasInformacion = new bootstrap.Modal(document.getElementById("modalMasInformacion"), {
        backdrop: 'static',
        keyboard: false
    });
    modalMasInformacion.show();

    cargarArchivosAdjuntos();
}

function cerrarModalMasInformacion() {
    const modalMasInformacion = bootstrap.Modal.getInstance(document.getElementById("modalMasInformacion"));
    modalMasInformacion.hide();

    if (modalAnteriorAbierto) {
        modalAnteriorAbierto.show();
    }
}

async function cargarArchivosAdjuntos() {
    try {
        const seguimientoDoc = await db.collection("seguimientoProspectos").doc(prospectoActualId).get();

        if (!seguimientoDoc.exists) {
            document.getElementById("archivosAdjuntos").innerHTML = "<p>No hay archivos adjuntos disponibles.</p>";
            return;
        }

        const seguimientoData = seguimientoDoc.data();
        let archivos = [];

        switch (pasoActual) {
            case 12:
                archivos = Array.isArray(seguimientoData.paso12_atencionCitaEvidenciaRecibosURL) ? 
                    seguimientoData.paso12_atencionCitaEvidenciaRecibosURL : 
                    [seguimientoData.paso12_atencionCitaEvidenciaRecibosURL];
                break;
            case 10:
                archivos = Array.isArray(seguimientoData.paso10_firmaContratoEvidendiasURL) ? 
                    seguimientoData.paso10_firmaContratoEvidendiasURL : 
                    [seguimientoData.paso10_firmaContratoEvidendiasURL];
                break;
            case 7:
                archivos = Array.isArray(seguimientoData.paso7_adjuntarRecibosAnticipoURL) ? 
                    seguimientoData.paso7_adjuntarRecibosAnticipoURL : 
                    [seguimientoData.paso7_adjuntarRecibosAnticipoURL];
                break;
            case 5:
                archivos = Array.isArray(seguimientoData.paso5_adjuntarCotizacionURL) ? 
                    seguimientoData.paso5_adjuntarCotizacionURL : 
                    [seguimientoData.paso5_adjuntarCotizacionURL];
                break;
            case 4:
                archivos = Array.isArray(seguimientoData.paso4_adjuntarEvidenciaURL) ? 
                    seguimientoData.paso4_adjuntarEvidenciaURL : 
                    [seguimientoData.paso4_adjuntarEvidenciaURL];
                break;
            case 2:
                archivos = Array.isArray(seguimientoData.paso2_adjuntarEvidenciaURL) ? 
                    seguimientoData.paso2_adjuntarEvidenciaURL : 
                    [seguimientoData.paso2_adjuntarEvidenciaURL];
                break;
            default:
                archivos = [];
                break;
        }

        // Filtrar valores null o undefined
        archivos = archivos.filter(url => url);

        if (archivos.length === 0) {
            document.getElementById("archivosAdjuntos").innerHTML = "<p>No hay archivos adjuntos disponibles para este paso.</p>";
            return;
        }

        console.log("URLs de archivos:", archivos); // Para debugging

        const thumbnailsHTML = await Promise.all(archivos.map(async (archivoURL, index) => {
            try {
                // Obtener la URL de descarga
                const storageRef = firebase.storage().refFromURL(archivoURL);
                const url = await storageRef.getDownloadURL();
                const extension = url.split('.').pop().toLowerCase();

                return `
                    <div class="thumbnail-wrapper">
                        <a href="${url}" target="_blank" class="thumbnail-link">
                            <div class="thumbnail-image-container">
                                <img src="${url}" 
                                     alt="Archivo ${index + 1}"
                                     class="thumbnail-image"
                                     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTQgMkgyNnYySDI0djIwSDZ2LTIwSDR2LTJIMnYtMmgyNHYyaC0ydjIwSDZ2LTIwSDR2LTJIMTR6Ii8+PC9zdmc+';">
                            </div>
                            <div class="thumbnail-info">
                                <span class="thumbnail-name">Archivo ${index + 1}</span>
                                <span class="thumbnail-type">${extension.toUpperCase()}</span>
                            </div>
                        </a>
                    </div>
                `;
            } catch (error) {
                console.error(`Error al procesar archivo ${index + 1}:`, error);
                return '';
            }
        }));

        document.getElementById("archivosAdjuntos").innerHTML = `
            <div class="thumbnails-container">
                ${thumbnailsHTML.join('')}
            </div>
        `;

    } catch (error) {
        console.error("Error al cargar archivos adjuntos:", error);
        document.getElementById("archivosAdjuntos").innerHTML = "<p>Error al cargar los archivos adjuntos.</p>";
    }
}

// Estilos CSS
const styles = `
.thumbnails-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 15px;
    padding: 15px;
}

.thumbnail-wrapper {
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.2s;
    background: white;
}

.thumbnail-wrapper:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.thumbnail-link {
    display: block;
    text-decoration: none;
    color: inherit;
}

.thumbnail-image-container {
    width: 100%;
    height: 120px;
    overflow: hidden;
    background: #f8f9fa;
    display: flex;
    align-items: center;
    justify-content: center;
}

.thumbnail-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.thumbnail-info {
    padding: 8px;
    background: #f8f9fa;
    border-top: 1px solid #eee;
}

.thumbnail-name {
    display: block;
    font-size: 12px;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.thumbnail-type {
    display: block;
    font-size: 10px;
    color: #666;
    margin-top: 2px;
}
`;

// Agregar los estilos
if (!document.getElementById('thumbnails-styles')) {
    const styleSheet = document.createElement("style");
    styleSheet.id = 'thumbnails-styles';
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}

async function mostrarPublicaciones() {
    // Crear el modal de publicaciones
    const modalHTML = `
        <div class="modal fade" id="publicacionesModal" tabindex="-1" aria-labelledby="publicacionesModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-scrollable modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-dark text-white">
                        <div class="d-flex align-items-center w-100">
                            <button type="button" class="btn-close btn-close-white me-2" data-bs-dismiss="modal" aria-label="Close"></button>
                            <h5 class="modal-title flex-grow-1" id="publicacionesModalLabel">Buscar publicación</h5>
                            <div class="position-relative">
                                <input type="text" id="searchPublicaciones" class="form-control" placeholder="Buscar...">
                                <i class="fas fa-search position-absolute end-0 top-50 translate-middle-y me-2"></i>
                            </div>
                        </div>
                    </div>
                    <div class="modal-body">
                        <div id="publicacionesList" class="list-group">
                            <!-- Las publicaciones se cargarán aquí -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="guardarPublicacionesSeleccionadas()">Guardar Selección</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Eliminar modal anterior si existe
    const modalAnterior = document.getElementById('publicacionesModal');
    if (modalAnterior) {
        modalAnterior.remove();
    }

    // Agregar el nuevo modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('publicacionesModal'));
    modal.show();

    // Cargar las publicaciones
    await cargarPublicaciones();

    // Configurar el buscador
    const searchInput = document.getElementById('searchPublicaciones');
    searchInput.addEventListener('input', debounce(async (e) => {
        const searchTerm = e.target.value.toLowerCase();
        await cargarPublicaciones(searchTerm);
    }, 300));
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

async function cargarPublicaciones(searchTerm = '') {
    const publicacionesList = document.getElementById('publicacionesList');
    publicacionesList.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';

    try {
        // Obtener las publicaciones ya seleccionadas
        const seguimientoDoc = await db.collection("seguimientoProspectos").doc(prospectoActualId).get();
        const seguimientoData = seguimientoDoc.exists ? seguimientoDoc.data() : {};
        const idsSeleccionados = seguimientoData.paso5_idsPublicaciones || [];
        publicacionesSeleccionadas = new Set(idsSeleccionados);

        // Obtener las publicaciones de Firestore
        let query = db.collection("publicaciones");
        
        if (searchTerm) {
            query = query.where('titulo', '>=', searchTerm)
                        .where('titulo', '<=', searchTerm + '\uf8ff');
        }

        const snapshot = await query.get();
        
        if (snapshot.empty) {
            publicacionesList.innerHTML = '<div class="text-center">No se encontraron publicaciones</div>';
            return;
        }

        let publicacionesHTML = '';
        snapshot.forEach(doc => {
            const publicacion = doc.data();
            const isSelected = publicacionesSeleccionadas.has(doc.id);
            publicacionesHTML += `
                <div class="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3" role="button">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="${doc.id}" 
                            id="check_${doc.id}" ${isSelected ? 'checked' : ''}
                            onchange="togglePublicacion('${doc.id}')">
                    </div>
                    <img src="${publicacion.multimediaUrl[0] || '/placeholder.svg'}" class="rounded" width="64" height="64" alt="${publicacion.titulo}">
                    <div class="flex-grow-1">
                        <h6 class="mb-0">${publicacion.categoria}</h6>
                        <p class="mb-0 text-muted">${publicacion.lugar || 'Sin descripción'}</p>
                    </div>
                </div>
            `;
        });

        publicacionesList.innerHTML = publicacionesHTML;
    } catch (error) {
        console.error("Error al cargar publicaciones:", error);
        publicacionesList.innerHTML = '<div class="text-center text-danger">Error al cargar las publicaciones</div>';
    }
}

function togglePublicacion(publicacionId) {
    if (publicacionesSeleccionadas.has(publicacionId)) {
        publicacionesSeleccionadas.delete(publicacionId);
    } else {
        publicacionesSeleccionadas.add(publicacionId);
    }
}

let publicacionesGuardadas = [];

async function guardarPublicacionesSeleccionadas() {
    try {
        // Almacenar los IDs en la variable global
        publicacionesGuardadas = Array.from(publicacionesSeleccionadas);
        console.log("Publicaciones guardadas en memoria:", publicacionesGuardadas);
        
        // Cerrar el modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('publicacionesModal'));
        modal.hide();
        
        // Opcional: mostrar confirmación
        console.log('Publicaciones almacenadas exitosamente en memoria');

        const botonAdjuntar = document.querySelector(`button[data-paso="55"]`);
            if (botonAdjuntar) {
                botonAdjuntar.innerHTML = `<i class="fas fa-check me-2"></i>${publicacionesGuardadas.length} paquete(s) seleccionado(s)`;
                botonAdjuntar.classList.remove('btn-secondary');
                botonAdjuntar.classList.add('btn-success');
            }


    } catch (error) {
        console.error("Error al procesar las publicaciones:", error);
        alert("Error al procesar las publicaciones seleccionadas");
    }
}





// Función para adjuntar archivo
// Update the adjuntarArchivo function to automatically mark steps as complete
async function adjuntarArchivo(paso) {
    const input = document.createElement('input');
    input.type = 'file';
    const button = document.querySelector(`button[data-paso="${paso}"]`);
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (paso === 5) {
                tempStep5Data.file = file;
                mostrarPasoSeguimiento(paso);
            } else if(paso==10){
                button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Adjuntando...';
                    button.disabled = true;
                    
                    const storageRef = firebase.storage().ref(`prospectos/${prospectoActualId}/paso${paso}/${file.name}`);
                    await storageRef.put(file);
                    const downloadURL = await storageRef.getDownloadURL();
                    

                await db.collection("seguimientoProspectos").doc(prospectoActualId).update({
                    paso10_firmaContratoEvidendiasURL:firebase.firestore.FieldValue.arrayUnion(downloadURL),
                    paso10_revision:true
                });
                const porcentaje = calcularPorcentaje(paso);
                await db.collection("prospectos").doc(prospectoActualId).update({
                    porcentaje: porcentaje
                });

                alert("Archivo adjuntado exitosamente");
                mostrarPasoSeguimiento(paso);
            } else if(paso==12){
                button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Adjuntando...';
                    button.disabled = true;
                    
                    const storageRef = firebase.storage().ref(`prospectos/${prospectoActualId}/paso${paso}/${file.name}`);
                    await storageRef.put(file);
                    const downloadURL = await storageRef.getDownloadURL();
                    

                await db.collection("seguimientoProspectos").doc(prospectoActualId).update({
                 paso12_atencionCitaEvidenciaRecibosURL :firebase.firestore.FieldValue.arrayUnion(downloadURL),
                 paso12_revision:true
                });
                const porcentaje = calcularPorcentaje(paso);
                await db.collection("prospectos").doc(prospectoActualId).update({
                    porcentaje: porcentaje
                });

                alert("Archivo adjuntado exitosamente");
                mostrarPasoSeguimiento(paso);
            } else {
                try {
                    button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Adjuntando...';
                    button.disabled = true;
                    
                    const storageRef = firebase.storage().ref(`prospectos/${prospectoActualId}/paso${paso}/${file.name}`);
                    await storageRef.put(file);
                    const downloadURL = await storageRef.getDownloadURL();
                    


                    const updateData = {
                        [`paso${paso}_adjuntarEvidenciaURL`]: firebase.firestore.FieldValue.arrayUnion(downloadURL)
                    };
                    
                    await db.collection("seguimientoProspectos").doc(prospectoActualId).set(updateData, { merge: true });

                    // Actualizar el porcentaje en la colección prospectos según el paso
                    const porcentaje = calcularPorcentaje(paso);
                    await db.collection("prospectos").doc(prospectoActualId).update({
                        porcentaje: porcentaje
                    });
                    
                    alert("Archivo adjuntado exitosamente");
                    mostrarPasoSeguimiento(paso);
                } catch (error) {
                    console.error("Error al adjuntar archivo:", error);
                    alert("Error al adjuntar archivo: " + error.message);
                    button.innerHTML = '<i class="fas fa-paperclip me-2"></i>Adjuntar';
                    button.disabled = false;
                }
            }
        }
    };
    input.click();
}

function calcularPorcentaje(paso) {
    return Math.round(paso * 7.69); // Redondear el porcentaje
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

                if(paso==6){
                    const updateData = {};
                updateData[`paso6_fechaCitaAtendida`] = fecha;
                await db.collection("seguimientoProspectos").doc(prospectoActualId).update(updateData);
                
                }  if(paso==8){
                    const updateData = {};
                updateData[`paso8_agendarCitaParaFirmar`] = fecha;
                await db.collection("seguimientoProspectos").doc(prospectoActualId).update(updateData);
                
                } if(paso==11){
                    const updateData = {};
                updateData[`paso11_agendarCitaParaEntregaPorcentaje`] = fecha;
                await db.collection("seguimientoProspectos").doc(prospectoActualId).update(updateData);
                
                }else{
                    const updateData = {};
                updateData[`paso${paso}_agendarCita`] = fecha;
                await db.collection("seguimientoProspectos").doc(prospectoActualId).update(updateData);
                
                }
              
                // Actualizar el porcentaje en la colección prospectos según el paso
                const porcentaje = calcularPorcentaje(paso);
                await db.collection("prospectos").doc(prospectoActualId).update({
                    porcentaje: porcentaje
                });
                
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

function calcularPorcentaje(paso) {
    return Math.round(paso * 7.69); // Redondear el porcentaje
}



function adjuntarArchivoPaso(paso) {
    const inputFile = document.createElement('input');
    inputFile.type = 'file';
    inputFile.accept = '.pdf,.jpg,.jpeg,.png';
    inputFile.multiple = true;

    inputFile.onchange = (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            archivoAdjunto = Array.from(files);
            console.log("Archivos seleccionados en adjuntarArchivoPaso:", archivoAdjunto);

            // Actualizar el botón para indicar que se adjuntaron correctamente
            const botonAdjuntar = document.querySelector(`button[data-paso="${paso}"]`);
            if (botonAdjuntar) {
                botonAdjuntar.innerHTML = `<i class="fas fa-check me-2"></i>${archivoAdjunto.length} archivo(s) adjuntado(s)`;
                botonAdjuntar.classList.remove('btn-secondary');
                botonAdjuntar.classList.add('btn-success');
            }
        } else {
            archivoAdjunto = [];
            alert('No se seleccionó ningún archivo.');
        }
    };

    inputFile.click(); // Abrir el selector de archivos
}


async function guardarDatosAnticipo() {
    try {
        const fecha = document.getElementById('fecha').value;
        const numPersonas = document.getElementById('numPersonas').value;
        const lugar = document.getElementById('lugar').value;

        console.log("archivoAdjunto en guardarDatosAnticipo:", archivoAdjunto);

        if (!fecha || !numPersonas || !lugar) {
            alert('Por favor, complete todos los campos');
            return;
        }

        if (!archivoAdjunto) {
            alert('Por favor, adjunte el recibo del anticipo antes de guardar.');
            return;
        }

        // Subir el archivo a Firebase Storage
        const storageRef = firebase.storage().ref();
        const archivoRef = storageRef.child(`recibosAnticipo/${prospectoActualId}/${archivoAdjunto.name}`);
        const snapshot = await archivoRef.put(archivoAdjunto);

        // Obtener la URL de descarga del archivo subido
        const archivoURL = await snapshot.ref.getDownloadURL();

        // Convertir la fecha a milisegundos
        const fechaEvento = new Date(fecha).getTime();

        // Actualizar datos en Firestore
        const seguimientoDoc = await db.collection("seguimientoProspectos").doc(prospectoActualId).get();
        const seguimientoData = seguimientoDoc.data();

        await db.collection("seguimientoProspectos").doc(prospectoActualId).update({
            paso7_adjuntarRecibosAnticipoURL: firebase.firestore.FieldValue.arrayUnion(archivoURL),
            paso7_revision: true
        });

        await db.collection("prospectos").doc(prospectoActualId).update({
            fecha_evento: fechaEvento,
            invitados: numPersonas,
            pregunta_por: lugar,
            pregunta_porMin: lugar.toLowerCase()
        });

        // Actualizar porcentaje de pasos completados
        const completedSteps = Object.values(seguimientoData).filter(value => 
            value === true || (Array.isArray(value) && value.length > 0)
        ).length;
        const porcentaje = Math.round((completedSteps / 13) * 100);

        await db.collection("prospectos").doc(prospectoActualId).update({
            porcentaje: porcentaje.toString()
        });

        alert('Anticipo guardado exitosamente');
        mostrarPasoSeguimiento(7);
    } catch (error) {
        console.error("Error al guardar anticipo:", error);
        alert("Error al guardar los datos del anticipo");
    }
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
            { texto: "Adjuntar evidencia", icono: "fas fa-paperclip", clase: "btn-secondary", accion: "adjuntarArchivo(4)" }
        ],
        campoCompletado: "paso4_llamarConfirmarCita"
    },  {
        titulo: "Subir evidencia de paquetes ofrecidos",
        contenido: "Documenta de forma precisa qué servicios fueron discutidos durante la cita, incluyendo detalles sobre paquetes, precios, y cualquier promoción o descuento ofrecido.",
        accionesRecomendadas: [
            "Mantén un registro escrito y digital de la oferta presentada al prospecto.",
            "Incluye cotizaciones, descripciones de servicio y cualquier compromiso verbal durante la reunión."
        ],
        botones: [],
        campoCompletado: "paso5_completado"
    },   {
        titulo: "Que fecha se atendio",
        contenido: "Conduce la cita presencial de manera profesional asegurando que se aborden todas las preguntas y se proporcionen todas las explicaciones necesarias.",
        accionesRecomendadas: [
            "Prepara material visual o demostraciones si es aplicable para ayudar a ilustrar los beneficios de tus servicios. Toma notas detalladas sobre las reacciones y comentarios del prospecto para ajustar futuras interacciones y ofertas.",
           
        ],
        botones: [
            { texto: "Agendar cita", icono: "fas fa-calendar", clase: "btn-secondary", accion: "agendarCita(6)" }
        ],
        campoCompletado: "paso6_fechaCitaAtendida"
    }, {
        titulo: "Subir Evidencia del Anticipo",
        contenido: "Asegura la recepción del pago de anticipo como confirmación del interés y compromiso del prospecto hacia los servicios contratados.",
        accionesRecomendadas: [
            "Proporciona y explica claramente los términos de pago, incluyendo cualquier condición de reembolso o cancelación.",
            "Asegúrate de emitir un recibo oficial y almacenar una copia en los registros financieros."
        ],
        botones: [],
        campoCompletado: "paso7_adjuntarRecibosAnticipoURL"
    },{
        titulo: "Agendar Cita para firmar contrato",
        contenido: "Organiza una cita para la firma del contrato, asegurando que todas las partes comprendan y esten de acuerdo con los terminos y condiciones antes de proceder.",
        accionesRecomendadas: [
            "Revisa el contrato en detalle con el prospecto durante la cita, permitiendo tiempo suficiente para preguntas.",
            "Confrima que todas las partes tengan copia del contrato firmado."
        ],
        botones: [
            { texto: "Agendar cita", icono: "fas fa-calendar", clase: "btn-secondary", accion: "agendarCita(8)" }
        ],
        campoCompletado: "paso8_agendarCitaParaFirmar"
    },{
        titulo: "Confirmar cita con el prospecto hotas antes",
        contenido: "Confirma nuevamente la cita para la firma del contrato para asegurarte de que no haya cambios de ultima hora y que el prospecto este preparado y presente.",
        accionesRecomendadas: [
            "Envia un recordatorio final y verifica lahora y el lugar",
            "Prepara todos los documentos necesarios y cualquier otra cosa que necesite ser firmada o discutida."
        ],
        botones: [
            { texto: "Adjuntar evidencia", icono: "fas fa-paperclip", clase: "btn-secondary", accion: "adjuntarArchivo(9)" }
        ],
        campoCompletado: "paso9_confirmacionCita"
    },{
        titulo: "Subir evidencia del contrato",
        contenido: "Ejecuta la firma del contrato de manera formal y profesional, asegurando que se entiendan todos los aspectos legales y practicos.",
        accionesRecomendadas: [
            "Ofrece una ultima oportunidad para resolver dudas. Documenta la firma con una fotografia o escaneo del contrato firmado",
          
        ],
        botones: [
            { texto: "Adjuntar evidencia", icono: "fas fa-paperclip", clase: "btn-secondary", accion: "adjuntarArchivo(10)" }
        ],
        campoCompletado: "paso10_firmaContratoEvidendiasURL"
    },{
        titulo: "Agendar Cita para recibir el pago",
        contenido: "Planifica la recepcion del siguiente pago del 30% segun el contrato. Esta es una etapa critica para mantener el flujo de caja y financiar los servicios acordados.",
        accionesRecomendadas: [
            "Coordina la cita de acuerdo con la disponibilidad del prospecto y asegurate de que comprenda los metodos de pago aceptados. ",
            "Confirma la ubicación de la cita"
        ],
        botones: [
            { texto: "Agendar cita", icono: "fas fa-calendar", clase: "btn-secondary", accion: "agendarCita(11)" }
        ],
        campoCompletado: "paso11_agendarCitaParaEntregaPorcentaje"
    },{
        titulo: "Adjuntar recibo",
        contenido: "Asegura que la cita para el pago se lleve a cabo segun lo planeado y que el pago se reciba completamente y sin contratiempos.",
        accionesRecomendadas: [
            "Verifica que el pago recibido y proporciona documentacion adecuada como recibos. Asegurate de actualizar el estado del pago en el sistema para reflejar la transaccion.",
           
        ],
        botones: [
            { texto: "Adjuntar evidencia", icono: "fas fa-paperclip", clase: "btn-secondary", accion: "adjuntarArchivo(12)" }
        ],
        campoCompletado: "paso12_atencionCitaEvidenciaRecibosURL"
    },{
        titulo: "Asignación de usuario y contraseña",
        contenido: "Genera las credenciales de acceso para el cliente.",
        accionesRecomendadas: [
            "Genera un usuario basado en el nombre del prospecto",
            "Asegúrate de que el cliente reciba sus credenciales de acceso"
        ],
        botones: [
            { texto: "Generar Credenciales", icono: "fas fa-user-plus", clase: "btn-primary", accion: "generarCredenciales()" }
        ],
        campoCompletado: "paso13_asignacionUsuario"
    }



];

async function cargarDatosAnticipo() {
    try {
        // Obtener el documento del prospecto
        const prospectoDoc = await db.collection("prospectos").doc(prospectoActualId).get();

        if (!prospectoDoc.exists) {
            console.error("No se encontró el prospecto con el ID proporcionado.");
            alert("No se encontraron datos para este prospecto.");
            return;
        }

        const prospectoData = prospectoDoc.data();

        // Asignar valores a los campos
        if (prospectoData.fecha_evento) {
            const fecha = new Date(prospectoData.fecha_evento).toISOString().split("T")[0]; // Convertir milisegundos a formato YYYY-MM-DD
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
    const descripcion = document.getElementById('descripcion').value.trim();
    
    if (!descripcion) {
        alert('Por favor, ingrese una descripción de los paquetes ofrecidos.');
        return;
    }
    
    if (archivoAdjunto.length === 0) {
        alert('Por favor, adjunte al menos un archivo de evidencia.');
        return;
    }

    if (publicacionesGuardadas.size === 0) {
        alert('Por favor, seleccione al menos un paquete.');
        return;
    }
    
    try {
        const updateData = {
            paso5_descripcion: descripcion,
            paso5_idsPublicaciones: Array.from(publicacionesGuardadas)
        };

        const downloadURLs = [];
        for (const file of archivoAdjunto) {
            const storageRef = firebase.storage().ref(`prospectos/${prospectoActualId}/paso5/${file.name}`);
            await storageRef.put(file);
            const downloadURL = await storageRef.getDownloadURL();
            downloadURLs.push(downloadURL);
        }
        updateData.paso5_adjuntarCotizacionURL = firebase.firestore.FieldValue.arrayUnion(...downloadURLs);
        
        await db.collection("seguimientoProspectos").doc(prospectoActualId).set(updateData, { merge: true });
        
        // Complete step 5
        await completarPaso(5);
        
        const porcentaje = calcularPorcentaje(5);
        await db.collection("prospectos").doc(prospectoActualId).update({
            porcentaje: porcentaje
        });

        alert('Paso 5 completado exitosamente');

        mostrarPasoSeguimiento(5);
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Error al guardar los cambios");
    }
}



// Event Listeners para navegación
document.getElementById('pasoAnterior').addEventListener('click', () => {
    if (pasoActual > 1) {
        pasoActual--;
        mostrarPasoSeguimiento(pasoActual);
    }
});

document.getElementById('pasoSiguiente').addEventListener('click', () => {
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
  const loaderContainer = document.getElementById('loader');

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

  async function cargarProspectos(query) {
      isLoading = true;
      loaderContainer.classList.remove('hidden');
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

async function completarPaso(paso) {
    // Logic to mark the step as completed
    pasosCompletados.add(paso);
    

    // Enable the next step button
    document.getElementById('pasoSiguiente').disabled = false;
    

    // Update the current step visualization
    mostrarPasoSeguimiento(paso);
}


// Add this function to handle backdrop cleanup
function limpiarBackdrop() {
    const backdrops = document.getElementsByClassName('modal-backdrop');
    while(backdrops.length > 0) {
        backdrops[0].parentNode.removeChild(backdrops[0]);
    }
    document.body.classList.remove('modal-open');
}

// Modify the event listeners for modal closing
document.getElementById('prospectoModal').addEventListener('hidden.bs.modal', limpiarBackdrop);
document.getElementById('seguimientoModal').addEventListener('hidden.bs.modal', limpiarBackdrop);
document.getElementById('modalMasInformacion').addEventListener('hidden.bs.modal', limpiarBackdrop);

console.log("Modal backdrop and outside click issues have been addressed.");
