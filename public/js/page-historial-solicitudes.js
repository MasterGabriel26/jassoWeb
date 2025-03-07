async function obtenerHistorialAprobados() {
    const revisionesContainer = document.getElementById('revisionesPendientes');
    revisionesContainer.innerHTML = ''; // Limpiar el contenedor

    try {
        // Primero obtenemos todas las comisiones
        const comisionesSnapshot = await db.collection('comisiones').get();
        const comisionesMap = new Map();
        
        // Creamos un mapa de comisiones por idProspecto
        comisionesSnapshot.docs.forEach(doc => {
            const comisionData = doc.data();
            comisionesMap.set(comisionData.idProspecto, {
                fechaAprobacion: comisionData.fechaAprobacion,
                estadoComisionAsesor: comisionData.estadoComisionAsesor,
                estadoComisionLider: comisionData.estadoComisionLider
            });
        });

        const querySnapshot = await db.collection('seguimientoProspectos2').get();
        let hayDocumentosAprobados = false;

        for (const doc of querySnapshot.docs) {
            const seguimientoData = doc.data();
            if (!seguimientoData || !seguimientoData.idProspecto) continue;

            const comisionInfo = comisionesMap.get(seguimientoData.idProspecto);
            if (!comisionInfo) continue; // Si no hay comisión, continuamos con el siguiente

            // Array para almacenar los pasos aprobados
            const pasosAprobados = [];

            // Verificar paso 7
            if (seguimientoData.paso7_adjuntarRecibosAnticipoURL?.length > 0 && seguimientoData.paso7_revision) {
                pasosAprobados.push({
                    numero: 7,
                    nombre: "Recibos de Anticipo",
                    urls: seguimientoData.paso7_adjuntarRecibosAnticipoURL
                });
            }

            // Verificar paso 10
            if (seguimientoData.paso10_firmaContratoEvidendiasURL?.length > 0 && seguimientoData.paso10_revision) {
                pasosAprobados.push({
                    numero: 10,
                    nombre: "Firma de Contrato",
                    urls: seguimientoData.paso10_firmaContratoEvidendiasURL
                });
            }

            // Verificar paso 12
            if (seguimientoData.paso12_atencionCitaEvidenciaRecibosURL?.length > 0 && seguimientoData.paso12_revision) {
                pasosAprobados.push({
                    numero: 12,
                    nombre: "Evidencia de Recibos",
                    urls: seguimientoData.paso12_atencionCitaEvidenciaRecibosURL
                });
            }

            // Si hay pasos aprobados, mostrar la información
            if (pasosAprobados.length > 0) {
                hayDocumentosAprobados = true;
                const prospectoDoc = await db.collection('prospectos2').doc(seguimientoData.idProspecto).get();
                const prospectoData = prospectoDoc.data();
                const nombreAsesor = await obtenerNombreAsesor(prospectoData.asesor);

                for (const paso of pasosAprobados) {
                    const revisionElement = document.createElement('div');
                    revisionElement.className = 'revision-item aprobado';
                    
                    const fecha = new Date(comisionInfo.fechaAprobacion);
                    const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    // Determinar el estado de las comisiones
                    const estadoAsesor = comisionInfo.estadoComisionAsesor;
                    const estadoLider = comisionInfo.estadoComisionLider;

                    revisionElement.innerHTML = `
                        <div class="revision-header">
                            <div class="d-flex justify-content-between align-items-center">
                                <h6>${prospectoData.name || 'Sin nombre'}</h6>
                                <div class="estado-comisiones">
                                    <span class="badge ${estadoAsesor === 'PENDIENTE' ? 'bg-warning' : 'bg-success'} me-2">
                                        <i class="fas fa-user-tie me-1"></i> Estado de comision: ${estadoAsesor}
                                    </span>
                                    
                                </div>
                            </div>
                            <small><i class="fas fa-hashtag me-1"></i>Folio: ${prospectoData.folio || 'Sin folio'}</small>
                        </div>
                        <div class="revision-body">
                            <div class="revision-info">
                                <div class="info-item">
                                    <i class="fas fa-user"></i>
                                    <p>${nombreAsesor || 'Sin asesor'}</p>
                                </div>
                                <div class="info-item">
                                    <span class="paso-badge">
                                        <i class="fas fa-tasks me-2"></i>
                                        Paso ${paso.numero}: ${paso.nombre}
                                    </span>
                                </div>
                                <div class="info-item">
                                    <i class="fas fa-calendar-check"></i>
                                    <p>Aprobado el: ${fechaFormateada}</p>
                                </div>
                            </div>
                              <div class="revision-actions">
        <button class="btn btn-ver-docs" onclick='verDocumentos(${paso.numero}, ${JSON.stringify(paso.urls)})'>
            <i class="fas fa-file-alt"></i> Ver Documentos
        </button>
    </div>
                        </div>
                    `;

                    revisionesContainer.appendChild(revisionElement);
                }
            }
        }

        // Si no hay documentos aprobados, mostrar mensaje
        if (!hayDocumentosAprobados) {
            revisionesContainer.innerHTML = `
                <div class="no-revisiones-container">
                    <div class="text-center p-5">
                        <i class="fas fa-folder-open fa-4x text-muted mb-3"></i>
                        <h4 class="text-muted">No hay documentos aprobados</h4>
                        <p class="text-muted">Aún no se han aprobado documentos</p>
                    </div>
                </div>
            `;
        }

    } catch (error) {
        console.error("Error obteniendo historial:", error);
        revisionesContainer.innerHTML = `
            <div class="alert alert-danger" role="alert">
                Error al cargar el historial: ${error.message}
            </div>
        `;
    }
}

// Llamar a la función cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    obtenerHistorialAprobados();
});



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

// Y modifica la función verDocumentos así:
function verDocumentos(numeroPaso, urls) {
    console.log('Función verDocumentos llamada con:', { numeroPaso, urls });

    const documentosContainer = document.getElementById('documentosContainer');
    if (!documentosContainer) {
        console.error('No se encontró el contenedor de documentos');
        return;
    }

    documentosContainer.innerHTML = '';
    document.getElementById('documentosModalLabel').textContent = `Documentos del Paso ${numeroPaso}`;

    if (!Array.isArray(urls)) {
        // Si urls no es un array pero es una cadena, intentamos parsearlo
        try {
            urls = JSON.parse(urls);
        } catch (e) {
            console.error('Error al parsear URLs:', e);
            return;
        }
    }

    if (urls.length > 0) {
        urls.forEach((url, index) => {
            console.log('Procesando URL:', url);
            
            const extension = url.split('.').pop().toLowerCase().split('?')[0];
            const fileName = url.split('/').pop().split('?')[0];
            const esImagen = ['jpg', 'jpeg', 'png', 'gif'].includes(extension);
            const esPDF = extension === 'pdf';
            
            const col = document.createElement('div');
            col.className = 'col-lg-4 col-md-6 mb-4';

            let contenido = '';
            if (esImagen) {
                contenido = `
                    <div class="documento-card">
                        <div class="preview-container">
                            <img src="${url}" class="preview-image" alt="${fileName}" 
                                 onerror="this.onerror=null; this.src='ruta/a/imagen/por/defecto.jpg';">
                        </div>
                        <div class="documento-info">
                            <p class="file-name">${fileName}</p>
                        </div>
                        <div class="documento-actions">
                            <button class="btn btn-action btn-view mb-2" onclick="window.open('${url}', '_blank')">
                                <i class="fas fa-expand me-2"></i>Ver imagen
                            </button>
                            <a href="${url}" download="${fileName}" class="btn btn-action btn-download">
                                <i class="fas fa-download me-2"></i>Descargar
                            </a>
                        </div>
                    </div>
                `;
            } else if (esPDF) {
                contenido = `
                    <div class="documento-card">
                        <div class="preview-container pdf-container">
                            <i class="fas fa-file-pdf pdf-icon"></i>
                        </div>
                        <div class="documento-info">
                            <p class="file-name">${fileName}</p>
                        </div>
                        <div class="documento-actions">
                            <button class="btn btn-action btn-view mb-2" onclick="window.open('${url}', '_blank')">
                                <i class="fas fa-file-pdf me-2"></i>Ver PDF
                            </button>
                            <a href="${url}" download="${fileName}" class="btn btn-action btn-download">
                                <i class="fas fa-download me-2"></i>Descargar
                            </a>
                        </div>
                    </div>
                `;
            } else {
                contenido = `
                    <div class="documento-card">
                        <div class="preview-container">
                            <i class="fas fa-file fa-3x text-muted"></i>
                        </div>
                        <div class="documento-info">
                            <p class="file-name">${fileName}</p>
                        </div>
                        <div class="documento-actions">
                            <button class="btn btn-action btn-view mb-2" onclick="window.open('${url}', '_blank')">
                                <i class="fas fa-external-link-alt me-2"></i>Ver archivo
                            </button>
                            <a href="${url}" download="${fileName}" class="btn btn-action btn-download">
                                <i class="fas fa-download me-2"></i>Descargar
                            </a>
                        </div>
                    </div>
                `;
            }

            col.innerHTML = contenido;
            documentosContainer.appendChild(col);
        });
    } else {
        documentosContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay documentos disponibles</p>
            </div>
        `;
    }

    // Mostrar el modal
    const modalElement = document.getElementById('documentosModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
}


async function aprobarRevision(idSeguimiento, numeroPaso) {
try {
  // Primero mostrar el diálogo de confirmación
  const result = await Swal.fire({
      title: '¿Estás seguro?',
      html: `¿Deseas aprobar la revisión del ${numeroPaso === 7 ? 
          'anticipo? <br><small class="text-muted">Esto también generará el registro de comisiones</small>' : 
          'documento?'}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
  });

  // Si el usuario cancela, salir de la función
  if (!result.isConfirmed) {
      return;
  }

  // Mostrar loading
  Swal.fire({
      title: 'Procesando...',
      html: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => {
          Swal.showLoading();
      }
  });

  // Obtener el documento de seguimiento
  const seguimientoDoc = await db.collection('seguimientoProspectos2').doc(idSeguimiento).get();
  const seguimientoData = seguimientoDoc.data();
  
  // Obtener el documento del prospecto
  const prospectoDoc = await db.collection('prospectos2').doc(seguimientoData.idProspecto).get();
  const prospectoData = prospectoDoc.data();

  // Actualizar el estado de revisión según el paso
  const campoRevision = `paso${numeroPaso}_revision`;
  await db.collection('seguimientoProspectos2').doc(idSeguimiento).update({
      [campoRevision]: true
  });

  // Si es el paso 7, crear documento en comisiones
  if (numeroPaso === 7) {
      // Verificar que existe idPaqueteVendido
      if (!prospectoData.idPaqueteVendido) {
          throw new Error('No se encontró el ID del paquete vendido');
      }

      // Crear una referencia para el nuevo documento
      const comisionRef = db.collection('comisiones').doc();

      // Crear documento en la colección comisiones
      const comisionData = {
          id: comisionRef.id,
          estadoComisionAsesor: "PENDIENTE",
          estadoComisionLider: "PENDIENTE",
          fechaAprobacion: Date.now(),
          fechaPagoAsesor: 0,
          fechaPagoLider: 0,
          idPaquete: prospectoData.idPaqueteVendido,
          idProspecto: seguimientoData.idProspecto,
          nombreProspecto: prospectoData.name.toLowerCase(),
          uidAsesor: prospectoData.asesor,
          uidLider: prospectoData.uidLider_modifyProspecto || ""
      };

      // Guardar el documento con el ID incluido
      await comisionRef.set(comisionData);
      console.log("Documento de comisión creado exitosamente con ID:", comisionRef.id);
  }

  // Mostrar mensaje de éxito
  await Swal.fire({
      icon: 'success',
      title: '¡Aprobado!',
      text: numeroPaso === 7 ? 
          'La revisión ha sido aprobada y se ha creado el registro de comisiones' : 
          'La revisión ha sido aprobada exitosamente',
      showConfirmButton: false,
      timer: 2000
  });

  // Actualizar la lista de revisiones
  await obtenerRevisionesPendientes();

} catch (error) {
  console.error("Error en aprobarRevision:", error);
  
  // Mostrar mensaje de error
  await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Hubo un error al procesar la aprobación: ' + error.message,
      confirmButtonText: 'OK'
  });
}
}

async function rechazarRevision(idSeguimiento, numeroPaso) {
    try {
        // Mostrar diálogo de confirmación
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: '¿Deseas rechazar esta revisión? Se eliminarán los documentos adjuntos.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, rechazar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true
        });

        // Si el usuario cancela, salir de la función
        if (!result.isConfirmed) {
            return;
        }

        // Mostrar loading
        Swal.fire({
            title: 'Procesando...',
            html: 'Por favor espera un momento',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Determinar qué campo actualizar según el paso
        let campoALimpiar;
        switch (numeroPaso) {
            case 7:
                campoALimpiar = 'paso7_adjuntarRecibosAnticipoURL';
                break;
            case 10:
                campoALimpiar = 'paso10_firmaContratoEvidendiasURL';
                break;
            case 12:
                campoALimpiar = 'paso12_atencionCitaEvidenciaRecibosURL';
                break;
            default:
                throw new Error('Paso no válido');
        }

        // Actualizar el documento limpiando el campo correspondiente
        await db.collection('seguimientoProspectos2').doc(idSeguimiento).update({
            [campoALimpiar]: []
        });

        // Mostrar mensaje de éxito
        await Swal.fire({
            icon: 'success',
            title: 'Revisión Rechazada',
            text: 'Los documentos han sido eliminados y deberán ser cargados nuevamente',
            showConfirmButton: false,
            timer: 2000
        });

        // Actualizar la lista de revisiones
        await obtenerRevisionesPendientes();

    } catch (error) {
        console.error("Error en rechazarRevision:", error);
        
        // Mostrar mensaje de error
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un error al procesar el rechazo: ' + error.message,
            confirmButtonText: 'OK'
        });
    }
}


// Variable global para almacenar todas las revisiones
let todasLasRevisiones = [];

function filtrarRevisiones(searchTerm) {
    const term = searchTerm.toLowerCase();
    const revisionElements = document.querySelectorAll('.revision-item');
    const clearButton = document.querySelector('.clear-search');
    const searchStats = document.getElementById('searchStats');
    
    // Mostrar/ocultar botón de limpiar
    clearButton.style.display = searchTerm ? 'block' : 'none';
    
    let resultadosCount = 0;
    revisionElements.forEach(element => {
        const nombre = element.querySelector('h6').textContent.toLowerCase();
        const folio = element.querySelector('small').textContent.toLowerCase();
        const asesor = element.querySelector('.info-item p').textContent.toLowerCase();
        
        if (nombre.includes(term) || folio.includes(term) || asesor.includes(term)) {
            element.classList.remove('filtered');
            element.style.display = '';
            resultadosCount++;
        } else {
            element.classList.add('filtered');
            setTimeout(() => {
                element.style.display = 'none';
            }, 300);
        }
    });

    // Actualizar estadísticas de búsqueda
    if (searchTerm) {
        searchStats.textContent = `${resultadosCount} resultado${resultadosCount !== 1 ? 's' : ''} encontrado${resultadosCount !== 1 ? 's' : ''}`;
    } else {
        searchStats.textContent = '';
    }

    // Mostrar mensaje si no hay resultados
    const existingMessage = document.querySelector('.no-results-message');
    if (resultadosCount === 0 && searchTerm) {
        if (!existingMessage) {
            const message = document.createElement('div');
            message.className = 'no-results-message';
            message.innerHTML = `
                <i class="fas fa-search fa-3x"></i>
                <h5>No se encontraron resultados</h5>
                <p>Intenta con otros términos de búsqueda</p>
            `;
            document.getElementById('revisionesPendientes').appendChild(message);
        }
    } else if (existingMessage) {
        existingMessage.remove();
    }
}

function limpiarBusqueda() {
    const searchInput = document.getElementById('searchInput');
    const searchStats = document.getElementById('searchStats');
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
        filtrarRevisiones('');
        searchStats.textContent = '';
    }
}

// Agregar esto en tu función de inicialización
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filtrarRevisiones(e.target.value);
        });
    }
});



