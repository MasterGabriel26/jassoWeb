async function obtenerComisionesPendientes() {
    const revisionesContainer = document.getElementById('revisionesPendientes');
    revisionesContainer.innerHTML = '';

    try {
        const querySnapshot = await db.collection('comisiones')
            .where('estadoComisionAsesor', '==', 'PENDIENTE')
            .orderBy('fechaAprobacion', 'desc') // Ordenar por fecha de aprobación descendente
            .get();

        let hayComisionesPendientes = false;
        const comisiones = []; // Array para almacenar todas las comisiones

        // Primero, recopilamos toda la información
        for (const doc of querySnapshot.docs) {
            hayComisionesPendientes = true;
            const comisionData = doc.data();

            // Obtener información del asesor y paquete
            const [nombreAsesor, paqueteDoc] = await Promise.all([
                obtenerNombreAsesor(comisionData.uidAsesor),
                db.collection('publicaciones2').doc(comisionData.idPaquete).get()
            ]);

            const paqueteData = paqueteDoc.exists ? paqueteDoc.data() : null;

            // Crear objeto con toda la información necesaria
            comisiones.push({
                id: doc.id,
                data: comisionData,
                nombreAsesor,
                paqueteData,
                fecha: new Date(comisionData.fechaAprobacion)
            });
        }

        // Ordenar las comisiones por fecha
        comisiones.sort((a, b) => b.fecha - a.fecha);

        // Ahora renderizamos las comisiones ordenadas
        comisiones.forEach(comision => {
            const fechaFormateada = comision.fecha.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });

            // Formatear la comisión si existe
            const comisionFormateada = comision.paqueteData && comision.paqueteData.comision_venta ? 
                comision.paqueteData.comision_venta.toLocaleString('es-MX', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }) : '0.00';

            const revisionElement = document.createElement('div');
            revisionElement.className = 'comision-card';
            revisionElement.innerHTML = `
                <div class="comision-header">
                    <div class="comision-status">
                        <span class="status-badge pending">
                            <i class="fas fa-clock-rotate-left"></i>
                            Pendiente de Pago
                        </span>
                    </div>
                    <div class="comision-title">
                        <h3>${comision.data.nombreProspecto || 'Sin nombre'}</h3>
                      
                    </div>
                </div>
                
                <div class="comision-body">
                    <div class="comision-details">
                        <div class="detail-group">
                            <div class="detail-item">
                                <i class="fas fa-user-tie"></i>
                                <div class="detail-content">
                                    <label>Asesor</label>
                                    <span>${comision.nombreAsesor}</span>
                                </div>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-calendar"></i>
                                <div class="detail-content">
                                    <label>Fecha de Aprobación</label>
                                    <span>${fechaFormateada}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="package-info">
                            <div class="package-header">
                                <i class="fas fa-box-open"></i>
                                <h4>Información del Paquete</h4>
                            </div>
                            <div class="package-details">
                                <p class="package-name">${comision.paqueteData ? comision.paqueteData.titulo : 'No disponible'}</p>
                                <div class="package-commission">
                                    <span class="commission-label">Comisión:</span>
                                    <span class="commission-amount">$${comisionFormateada}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="comision-actions">
                        <button class="btn-aprobar-comision" onclick="aprobarComision('${comision.id}')">
                            <i class="fas fa-check-circle"></i>
                            Aprobar Pago
                        </button>
                    </div>
                </div>
            `;

            revisionesContainer.appendChild(revisionElement);
        });

        if (!hayComisionesPendientes) {
            revisionesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3>¡Todo al día!</h3>
                    <p>No hay comisiones pendientes de pago</p>
                </div>
            `;
        }

    } catch (error) {
        console.error("Error obteniendo comisiones:", error);
        revisionesContainer.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Error al cargar las comisiones: ${error.message}
            </div>
        `;
    }
}

// Función para aprobar una comisión
async function aprobarComision(comisionId) {
    try {
        // Mostrar diálogo de confirmación
        const result = await Swal.fire({
            title: '¿Aprobar pago de comisión?',
            text: 'Esta acción marcará la comisión como pagada',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#dc3545',
            confirmButtonText: 'Sí, aprobar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true
        });

        if (!result.isConfirmed) return;

        // Mostrar loading
        Swal.fire({
            title: 'Procesando...',
            text: 'Actualizando estado de la comisión',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Actualizar el documento
        await db.collection('comisiones').doc(comisionId).update({
            estadoComisionAsesor: 'APROBADA',
            fechaPagoAsesor: Date.now()
        });

        // Mostrar mensaje de éxito
        await Swal.fire({
            icon: 'success',
            title: 'Comisión Aprobada',
            text: 'El pago ha sido marcado como aprobado',
            showConfirmButton: false,
            timer: 2000
        });

        // Actualizar la lista de comisiones
        await obtenerComisionesPendientes();

    } catch (error) {
        console.error("Error al aprobar comisión:", error);
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un error al aprobar la comisión: ' + error.message
        });
    }
}

// Llamar a la función cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    obtenerComisionesPendientes();
});
// Llamar a la función cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    obtenerComisionesPendientes();
});


// Variable global para almacenar todas las revisiones
let todasLasRevisiones = [];

function filtrarComisiones(searchTerm) {
    const term = searchTerm.toLowerCase();
    const comisionElements = document.querySelectorAll('.comision-card');
    const clearButton = document.querySelector('.clear-search');
    const searchStats = document.getElementById('searchStats');
    
    // Mostrar/ocultar botón de limpiar
    if (clearButton) {
        clearButton.style.display = searchTerm ? 'block' : 'none';
    }
    
    let resultadosCount = 0;
    comisionElements.forEach(element => {
        try {
            // Obtener los elementos a buscar usando los selectores correctos
            const nombre = element.querySelector('.comision-title h3')?.textContent || '';
            const asesor = element.querySelector('.detail-item:first-child .detail-content span')?.textContent || '';
            const paquete = element.querySelector('.package-name')?.textContent || '';
            
            // Convertir a minúsculas para la búsqueda
            const nombreLower = nombre.toLowerCase();
            const asesorLower = asesor.toLowerCase();
            const paqueteLower = paquete.toLowerCase();
            
            if (nombreLower.includes(term) || 
                asesorLower.includes(term) || 
                paqueteLower.includes(term)) {
                
                // Mostrar elemento con animación
                element.style.display = '';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
                resultadosCount++;
            } else {
                // Ocultar elemento con animación
                element.style.opacity = '0';
                element.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    element.style.display = 'none';
                }, 300);
            }
        } catch (error) {
            console.error('Error al filtrar elemento:', error);
        }
    });

    // Actualizar estadísticas de búsqueda
    if (searchStats) {
        if (searchTerm) {
            searchStats.innerHTML = `
                <div class="search-stats-content">
                    <i class="fas fa-search"></i>
                    <span>${resultadosCount} resultado${resultadosCount !== 1 ? 's' : ''} encontrado${resultadosCount !== 1 ? 's' : ''}</span>
                </div>
            `;
        } else {
            searchStats.innerHTML = '';
        }
    }

    // Mostrar mensaje si no hay resultados
    const existingMessage = document.querySelector('.no-results-message');
    if (resultadosCount === 0 && searchTerm) {
        if (!existingMessage) {
            const message = document.createElement('div');
            message.className = 'no-results-message';
            message.innerHTML = `
                <div class="no-results-content">
                    <i class="fas fa-search fa-3x"></i>
                    <h5>No se encontraron resultados</h5>
                    <p>Intenta buscar por:</p>
                    <ul class="search-suggestions">
                        <li><i class="fas fa-user"></i> Nombre del prospecto</li>
                        <li><i class="fas fa-user-tie"></i> Nombre del asesor</li>
                        <li><i class="fas fa-box"></i> Nombre del paquete</li>
                    </ul>
                </div>
            `;
            const container = document.getElementById('revisionesPendientes');
            if (container) {
                container.appendChild(message);
            }
        }
    } else if (existingMessage) {
        existingMessage.remove();
    }
}

// Agregar estos estilos CSS
const styles = `
.search-stats-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #6c757d;
    font-size: 0.9rem;
    padding: 0.5rem 0;
}

.search-stats-content i {
    color: #1e2940;
}

.no-results-message {
    text-align: center;
    padding: 2rem;
    background: white;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    margin: 1rem 0;
}

.no-results-content {
    max-width: 400px;
    margin: 0 auto;
}

.no-results-content i {
    color: #1e2940;
    opacity: 0.5;
    margin-bottom: 1rem;
}

.no-results-content h5 {
    color: #2c3e50;
    margin-bottom: 1rem;
}

.search-suggestions {
    list-style: none;
    padding: 0;
    margin: 1rem 0 0;
    text-align: left;
}

.search-suggestions li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #6c757d;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
}

.search-suggestions li i {
    font-size: 0.9rem;
    width: 20px;
    color: #1e2940;
    opacity: 0.7;
}

/* Animaciones */
.comision-card {
    transition: all 0.3s ease;
}

/* Estilos para el input de búsqueda */
.search-box {
    position: relative;
    margin-bottom: 1rem;
}

.search-box input {
    width: 100%;
    padding: 0.8rem 1rem 0.8rem 2.5rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 0.9rem;
    transition: all 0.3s ease;
}

.search-box input:focus {
    border-color: #1e2940;
    box-shadow: 0 0 0 3px rgba(30, 41, 64, 0.1);
    outline: none;
}

.search-box i {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #6c757d;
}

.clear-search {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #6c757d;
    cursor: pointer;
    padding: 0.2rem;
    display: none;
}

.clear-search:hover {
    color: #dc3545;
}
`;

// Agregar los estilos al documento
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);



// Asegúrate de tener solo una instancia de los event listeners
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // Remover listeners anteriores si existen
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        
        // Agregar nuevo listener
        newSearchInput.addEventListener('input', (e) => {
            filtrarComisiones(e.target.value);
        });
    }
});

// Función para limpiar la búsqueda
function limpiarBusqueda() {
    const searchInput = document.getElementById('searchInput');
    const searchStats = document.getElementById('searchStats');
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
        filtrarComisiones('');
        if (searchStats) {
            searchStats.innerHTML = '';
        }
    }}





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