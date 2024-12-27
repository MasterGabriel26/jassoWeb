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
    
    const modal = new bootstrap.Modal(document.getElementById("prospectoModal"));
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
        case 2:
        case 4:
        case 9:
        case 10:
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
                        <i class="fas fa-paperclip"></i> Adjuntar evidencia
                    </button>
                `;
            }
            break;
        case 3:
        case 6:
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
                const fechaCita = new Date(seguimientoData[`paso${paso}_agendarCita`] || seguimientoData[`paso${paso}_fechaCitaAtendida`]);
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
                botonesHTML = `
                    <button class="btn btn-success btn-action" disabled>
                        <i class="fas fa-check"></i> Paquetes ofrecidos
                    </button>
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
                            <button class="btn btn-secondary btn-action" onclick="adjuntarArchivo(5)" data-paso="5">
                                <i class="fas fa-paperclip me-2"></i>Adjuntar
                            </button>
                            <button class="btn btn-secondary btn-action" onclick="mostrarPublicaciones()">
                                <i class="fas fa-share me-2"></i>Publicaciones
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
        const modalInstance = new bootstrap.Modal(modal);
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




// Almacena el ID del modal abierto previamente
let modalAnteriorAbierto = null;

// Abrir el modal de "Más información"
function abrirModalMasInformacion() {
    modalAnteriorAbierto = new bootstrap.Modal(document.getElementById("seguimientoModal"));
    modalAnteriorAbierto.hide(); // Oculta el modal actual

    // Mostrar el modal de más información
    const modalMasInformacion = new bootstrap.Modal(document.getElementById("modalMasInformacion"));
    modalMasInformacion.show();

    // Cargar archivos adjuntos del paso actual
    cargarArchivosAdjuntos();
}

// Cerrar el modal de "Más información" y reabrir el anterior
function cerrarModalMasInformacion() {
    const modalMasInformacion = bootstrap.Modal.getInstance(document.getElementById("modalMasInformacion"));
    modalMasInformacion.hide();

    // Reabrir el modal anterior
    if (modalAnteriorAbierto) {
        modalAnteriorAbierto.show();
    }
}

// Función para cargar los archivos adjuntos del paso actual
// Función para cargar los archivos adjuntos del paso actual
async function cargarArchivosAdjuntos() {
    try {
        // Obtener el documento de seguimiento del prospecto actual
        const seguimientoDoc = await db.collection("seguimientoProspectos").doc(prospectoActualId).get();

        if (!seguimientoDoc.exists) {
            document.getElementById("archivosAdjuntos").innerHTML = "<p>No hay archivos adjuntos disponibles.</p>";
            return;
        }

        const seguimientoData = seguimientoDoc.data();

        // Seleccionar la URL de los archivos según el paso actual
        let archivos = [];
        switch (pasoActual) {
            case 7:
                archivos = Array.isArray(seguimientoData.paso7_adjuntarRecibosAnticipoURL) ? seguimientoData.paso7_adjuntarRecibosAnticipoURL : [seguimientoData.paso7_adjuntarRecibosAnticipoURL];
                break;
            case 5:
                archivos = Array.isArray(seguimientoData.paso5_adjuntarCotizacionURL) ? seguimientoData.paso5_adjuntarCotizacionURL : [seguimientoData.paso5_adjuntarCotizacionURL];
                break;
            case 4:
                archivos = Array.isArray(seguimientoData.paso4_adjuntarEvidenciaURL) ? seguimientoData.paso4_adjuntarEvidenciaURL : [seguimientoData.paso4_adjuntarEvidenciaURL];
                break;
            case 2:
                archivos = Array.isArray(seguimientoData.paso2_adjuntarEvidenciaURL) ? seguimientoData.paso2_adjuntarEvidenciaURL : [seguimientoData.paso2_adjuntarEvidenciaURL];
                break;
            // Agregar más casos según los pasos que tengan archivos adjuntos
            default:
                archivos = [];
                break;
        }

        if (archivos.length === 0) {
            document.getElementById("archivosAdjuntos").innerHTML = "<p>No hay archivos adjuntos disponibles para este paso.</p>";
            return;
        }

        // Crear una lista de enlaces para los archivos adjuntos
        const archivoLinks = archivos.map((archivoURL, index) => {
            return `
                <div class="mb-2">
                    <a href="${archivoURL}" target="_blank" class="text-primary">
                        Archivo ${index + 1}
                    </a>
                </div>
            `;
        }).join("");

        document.getElementById("archivosAdjuntos").innerHTML = archivoLinks;
    } catch (error) {
        console.error("Error al cargar archivos adjuntos:", error);
        document.getElementById("archivosAdjuntos").innerHTML = "<p>Error al cargar los archivos adjuntos.</p>";
    }
}



function mostrarPublicaciones(){
    window.open("/public/index.html", '_blank');
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

    inputFile.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            archivoAdjunto = file; // Guardar el archivo en la variable global
            console.log("Archivo seleccionado en adjuntarArchivoPaso:", archivoAdjunto);

            // Actualizar el botón para indicar que se adjuntó correctamente
            const botonAdjuntar = document.querySelector(`button[data-paso="${paso}"]`);
            if (botonAdjuntar) {
                botonAdjuntar.innerHTML = '<i class="fas fa-check me-2"></i>Adjuntado';
                botonAdjuntar.classList.remove('btn-secondary');
                botonAdjuntar.classList.add('btn-success');
                botonAdjuntar.disabled = true; // Desactivar el botón después de adjuntar
            }
        } else {
            archivoAdjunto = null;
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
            paso7_adjuntarRecibosAnticipoURL: archivoURL,
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
        titulo: "Asignacion de usuario y contraseña",
        contenido: "Programa una cita con el prospecto para discutir los detalles en persona.",
        accionesRecomendadas: [
            "Propón varias opciones de fecha y hora",
            "Confirma la ubicación de la cita"
        ],
        botones: [],
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
    tempStep5Data.description = descripcion;

    if (!descripcion) {
        alert('Por favor, ingrese una descripción de los paquetes ofrecidos.');
        return;
    }
    
    const seguimientoDoc = await db.collection("seguimientoProspectos").doc(prospectoActualId).get();
    const seguimientoData = seguimientoDoc.data() || {};
    
    if (!tempStep5Data.file && !seguimientoData.paso5_adjuntarCotizacionURL?.length) {
        alert('Por favor, adjunte al menos un archivo de evidencia.');
        return;
    }
    
    try {
        const updateData = {
            paso5_descripcion: descripcion
        };

        if (tempStep5Data.file) {
            const storageRef = firebase.storage().ref(`prospectos/${prospectoActualId}/paso5/${tempStep5Data.file.name}`);
            await storageRef.put(tempStep5Data.file);
            const downloadURL = await storageRef.getDownloadURL();
            updateData.paso5_adjuntarCotizacionURL = firebase.firestore.FieldValue.arrayUnion(downloadURL);
        }
        
        await db.collection("seguimientoProspectos").doc(prospectoActualId).set(updateData, { merge: true });
        
        // Completar el paso 5
        await completarPaso(5);
        
        alert('Paso 5 completado exitosamente');
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
    // Lógica para marcar el paso como completado
    pasosCompletados.add(paso);
    
    // Actualizar el documento en Firestore
    const updateData = {};
    updateData[`paso${paso}_completado`] = true;
    await db.collection("seguimientoProspectos").doc(prospectoActualId).update(updateData);
    
    // Habilitar el botón de siguiente paso
    document.getElementById('pasoSiguiente').disabled = false;
    
    // Actualizar la visualización del paso actual
    mostrarPasoSeguimiento(paso);
}

