async function obtenerHistorialComisiones() {
    const revisionesContainer = document.getElementById('revisionesPendientes');
    revisionesContainer.innerHTML = '';

    try {
        const querySnapshot = await db.collection('comisiones')
            .where('estadoComisionAsesor', '==', 'APROBADA')
            .orderBy('fechaPagoAsesor', 'desc')
            .get();

        let hayComisionesAprobadas = false;
        const comisiones = [];

        // Recopilar información
        for (const doc of querySnapshot.docs) {
            hayComisionesAprobadas = true;
            const comisionData = doc.data();

            const [nombreAsesor, paqueteDoc] = await Promise.all([
                obtenerNombreAsesor(comisionData.uidAsesor),
                db.collection('publicaciones2').doc(comisionData.idPaquete).get()
            ]);

            const paqueteData = paqueteDoc.exists ? paqueteDoc.data() : null;

            comisiones.push({
                id: doc.id,
                data: comisionData,
                nombreAsesor,
                paqueteData,
                fechaPago: new Date(comisionData.fechaPagoAsesor)
            });
        }

        if (hayComisionesAprobadas) {
            // Renderizar comisiones
            comisiones.forEach(comision => {
                const fechaFormateada = comision.fechaPago.toLocaleDateString('es-ES', {
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
                revisionElement.className = 'comision-card aprobada';
                revisionElement.innerHTML = `
                    <div class="comision-header">
                        <div class="comision-status">
                            <span class="status-badge approved">
                                <i class="fas fa-check-circle"></i>
                                Pago Aprobado
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
                                    <i class="fas fa-calendar-check"></i>
                                    <div class="detail-content">
                                        <label>Fecha de Pago</label>
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
                                        <span class="commission-label">Comisión Pagada:</span>
                                        <span class="commission-amount approved">$${comisionFormateada}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                revisionesContainer.appendChild(revisionElement);
            });
        } else {
            // Mostrar mensaje cuando no hay comisiones aprobadas
            revisionesContainer.innerHTML = `
                <div class="empty-state no-approved">
                    <div class="empty-state-content">
                        <div class="empty-state-icon">
                            <i class="fas fa-file-invoice-dollar"></i>
                        </div>
                        <h3>Sin Historial de Pagos</h3>
                        <p>Aún no se han aprobado pagos de comisiones</p>
                        <div class="empty-state-action">
                            <a href="page-comisiones-admin.html" class="btn-return">
                                <i class="fas fa-arrow-left"></i>
                                Ver Comisiones Pendientes
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }

    } catch (error) {
        console.error("Error obteniendo historial de comisiones:", error);
        revisionesContainer.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Error al cargar el historial: ${error.message}
            </div>
        `;
    }
}

// Estilos adicionales para el historial
const additionalStyles = `
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
// Agregar los estilos adicionales
const additionalStyleSheet = document.createElement("style");
additionalStyleSheet.innerText = additionalStyles;
document.head.appendChild(additionalStyleSheet);

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    obtenerHistorialComisiones();
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