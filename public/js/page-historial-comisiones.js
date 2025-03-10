async function obtenerHistorialComisionesAsesor(uidAsesor) {
    const revisionesContainer = document.getElementById('revisionesPendientes');
    revisionesContainer.innerHTML = '';

    try {
        // Obtener todas las comisiones del asesor
        const [comisionesPendientes, comisionesAprobadas] = await Promise.all([
            db.collection('comisiones')
                .where('uidAsesor', '==', uidAsesor)
                .where('estadoComisionAsesor', '==', 'PENDIENTE')
                .orderBy('fechaAprobacion', 'desc')
                .get(),
            db.collection('comisiones')
                .where('uidAsesor', '==', uidAsesor)
                .where('estadoComisionAsesor', '==', 'APROBADA')
                .orderBy('fechaPagoAsesor', 'desc')
                .get()
        ]);

        const comisiones = [];

        // Procesar comisiones pendientes
        for (const doc of comisionesPendientes.docs) {
            const comisionData = doc.data();
            const paqueteDoc = await db.collection('publicaciones2').doc(comisionData.idPaquete).get();
            const paqueteData = paqueteDoc.exists ? paqueteDoc.data() : null;

            comisiones.push({
                id: doc.id,
                data: comisionData,
                paqueteData,
                estado: 'PENDIENTE',
                fecha: new Date(comisionData.fechaAprobacion)
            });
        }

        // Procesar comisiones aprobadas
        for (const doc of comisionesAprobadas.docs) {
            const comisionData = doc.data();
            const paqueteDoc = await db.collection('publicaciones2').doc(comisionData.idPaquete).get();
            const paqueteData = paqueteDoc.exists ? paqueteDoc.data() : null;

            comisiones.push({
                id: doc.id,
                data: comisionData,
                paqueteData,
                estado: 'APROBADA',
                fecha: new Date(comisionData.fechaPagoAsesor)
            });
        }

        if (comisiones.length > 0) {
            // Agregar sección de resumen
            const totalPendiente = comisionesPendientes.docs.length;
            const totalAprobadas = comisionesAprobadas.docs.length;
            
            const resumenElement = document.createElement('div');
            resumenElement.className = 'comisiones-resumen';
            resumenElement.innerHTML = `
                <div class="resumen-card">
                    <div class="resumen-item">
                        <i class="fas fa-clock"></i>
                        <div class="resumen-content">
                            <h4>Comisiones Pendientes</h4>
                            <span class="resumen-numero">${totalPendiente}</span>
                        </div>
                    </div>
                    <div class="resumen-item">
                        <i class="fas fa-check-circle"></i>
                        <div class="resumen-content">
                            <h4>Comisiones Aprobadas</h4>
                            <span class="resumen-numero">${totalAprobadas}</span>
                        </div>
                    </div>
                </div>
            `;
            revisionesContainer.appendChild(resumenElement);

            // Renderizar comisiones
            comisiones.forEach(comision => {
                const fechaFormateada = comision.fecha.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const comisionFormateada = comision.paqueteData && comision.paqueteData.comision_venta ? 
                    comision.paqueteData.comision_venta.toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }) : '0.00';

                const revisionElement = document.createElement('div');
                revisionElement.className = `comision-card ${comision.estado.toLowerCase()}`;
                revisionElement.innerHTML = `
                    <div class="comision-header">
                        <div class="comision-status">
                            <span class="status-badge ${comision.estado.toLowerCase()}">
                                <i class="fas ${comision.estado === 'PENDIENTE' ? 'fa-clock' : 'fa-check-circle'}"></i>
                                ${comision.estado === 'PENDIENTE' ? 'Pendiente de Pago' : 'Pago Aprobado'}
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
                                    <i class="fas fa-calendar"></i>
                                    <div class="detail-content">
                                        <label>${comision.estado === 'PENDIENTE' ? 'Fecha de Solicitud' : 'Fecha de Pago'}</label>
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
                                        <span class="commission-amount ${comision.estado.toLowerCase()}">$${comisionFormateada}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                revisionesContainer.appendChild(revisionElement);
            });
        } else {
            // Mostrar mensaje cuando no hay comisiones
            revisionesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-content">
                        <div class="empty-state-icon">
                            <i class="fas fa-file-invoice-dollar"></i>
                        </div>
                        <h3>Sin Comisiones</h3>
                        <p>Aún no tienes comisiones registradas</p>
                    </div>
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

// Estilos adicionales
const additionalStyles = `
.comisiones-resumen {
    margin-bottom: 2rem;
}

.resumen-card {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    padding: 1rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}

.resumen-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 8px;
    background: #f8f9fa;
}

.resumen-item i {
    font-size: 1.5rem;
    color: #1e2940;
}

.resumen-content h4 {
    margin: 0;
    font-size: 0.9rem;
    color: #6c757d;
}

.resumen-numero {
    font-size: 1.5rem;
    font-weight: 600;
    color: #2c3e50;
}

.comision-card.pendiente {
    border-left: 4px solid #ffc107;
}

.comision-card.aprobada {
    border-left: 4px solid #28a745;
}

.status-badge.pendiente {
    background: rgba(255, 193, 7, 0.1);
    color: #ffc107;
}

.status-badge.aprobada {
    background: rgba(40, 167, 69, 0.1);
    color: #28a745;
}

.commission-amount.pendiente {
    color: #ffc107;
}

.commission-amount.aprobada {
    color: #28a745;
}

.comision-card.aprobada {
    border-left: 4px solid #28a745;
}

.status-badge.approved {
    background: rgba(40, 167, 69, 0.1);
    color: #28a745;
}

.commission-amount.approved {
    color: #28a745;
}

.empty-state.no-approved {
    text-align: center;
    padding: 4rem 1rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}

.empty-state-content {
    max-width: 400px;
    margin: 0 auto;
}

.empty-state-icon {
    font-size: 4rem;
    color: #6c757d;
    margin-bottom: 1.5rem;
}

.empty-state h3 {
    color: #2c3e50;
    margin-bottom: 0.5rem;
    font-size: 1.5rem;
}

.empty-state p {
    color: #6c757d;
    margin-bottom: 2rem;
}

.empty-state-action .btn-return {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.8rem 1.5rem;
    background: #1e2940;
    color: white;
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.3s ease;
}

.empty-state-action .btn-return:hover {
    background: #2a3f5f;
    transform: translateY(-2px);
}
`;

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
            const paquete = element.querySelector('.package-name')?.textContent || '';
            
            // Convertir a minúsculas para la búsqueda
            const nombreLower = nombre.toLowerCase();
            const paqueteLower = paquete.toLowerCase();
            
            if (nombreLower.includes(term) ||  
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

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    // Obtener el UID del asesor (deberás implementar esto según tu sistema de autenticación)
    const uidAsesor = localStorage.getItem('uid'); // Reemplazar con el UID real del asesor
    obtenerHistorialComisionesAsesor(uidAsesor);
});

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