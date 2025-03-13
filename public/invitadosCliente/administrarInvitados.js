
// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAOvefpvlXLtbTx1T2hYg2Ds56eiKI3eAk",
    authDomain: "jassodb-4b8e4.firebaseapp.com",
    databaseURL: "https://jassodb-4b8e4-default-rtdb.firebaseio.com",
    projectId: "jassodb-4b8e4",
    storageBucket: "jassodb-4b8e4.appspot.com",
    messagingSenderId: "851107842246",
    appId: "1:851107842246:web:aa155261b9acdda47e6fc7",
    measurementId: "G-N18F7GL2NG"
};

let db;

class EventoManager {
    /**
     * Constructor - Inicializa la aplicación
     */
    constructor() {
          // Inicializar Firebase
          firebase.initializeApp(firebaseConfig);
          this.db = firebase.firestore();
            db=this.db
        
        // Estado de la aplicación
        this.state = {
            eventId: null,
            eventData: null,
            invitados: [],
            isLoading: true,
            currentUser: null
        };
        
        // Inicializar la aplicación
        this.inicializar();
    }

    /**
     * Método de inicialización
     */
    inicializar() {
        // Obtener ID del evento
        this.state.eventId = this.obtenerIdEvento();
        
        // Configurar event listeners
        this.configurarEventListeners();
        
        // Cargar datos
        this.cargarDatos();
        
        // Simular usuario actual (en una app real, esto vendría de la autenticación)
        this.state.currentUser = {
            uid: "kTHu3AE3ngUggsfzKPObCBo3NWz1"
        };
    }

    /**
     * Obtener ID del evento desde la URL
     * @returns {string|null} ID del evento o null si no existe
     */
    obtenerIdEvento() {
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('uid');
        
        if (!eventId) {
            this.mostrarError('ID de evento no proporcionado', 'Por favor, proporciona un ID de evento válido.');
            return null;
        }
        
        return eventId;
    }

    /**
     * Configurar event listeners para la interfaz
     */
    configurarEventListeners() {
        // Botones de acción del evento
        document.getElementById('edit-event-btn').addEventListener('click', () => this.editarEvento());
        document.getElementById('share-event-btn').addEventListener('click', () => this.compartirEvento());
        document.getElementById('add-invitado-btn').addEventListener('click', () => this.mostrarModalAgregarInvitado());
    }

    /**
     * Cargar todos los datos necesarios
     */
    async cargarDatos() {
        if (!this.state.eventId) return;

        try {
            // Mostrar loaders
            this.mostrarLoaders();
            
            // Cargar detalles del evento
            await this.cargarDetallesEvento();
            
            // Cargar invitados
            await this.cargarInvitados();
            
            // Ocultar loaders
            this.ocultarLoaders();
        } catch (error) {
            console.error("Error al cargar datos:", error);
            this.mostrarError('Error de carga', 'No se pudieron cargar los datos del evento.');
            this.ocultarLoaders();
        }
    }

    /**
     * Mostrar loaders en la interfaz
     */
    mostrarLoaders() {
        document.getElementById('event-details-loader').style.display = 'flex';
        document.getElementById('invitados-loader').style.display = 'flex';
        document.getElementById('event-details-content').style.display = 'none';
        document.getElementById('invitados-list').style.display = 'none';
    }

    /**
     * Ocultar loaders en la interfaz
     */
    ocultarLoaders() {
        document.getElementById('event-details-loader').style.display = 'none';
        document.getElementById('invitados-loader').style.display = 'none';
        document.getElementById('event-details-content').style.display = 'grid';
        document.getElementById('invitados-list').style.display = 'flex';
    }

    /**
     * Cargar detalles del evento desde Firestore
     */
    async cargarDetallesEvento() {
        try {
            const eventoDoc = await this.db.collection('invitadosGrupos').doc(this.state.eventId).get();
            
            if (!eventoDoc.exists) {
                this.mostrarError('Evento no encontrado', 'El evento solicitado no existe o ha sido eliminado.');
                return;
            }

            this.state.eventData = eventoDoc.data();
            this.renderizarDetallesEvento(this.state.eventData);

        } catch (error) {
            console.error("Error al cargar detalles del evento:", error);
            throw new Error('No se pudieron cargar los detalles del evento');
        }
    }

    /**
     * Renderizar detalles del evento en la interfaz
     * @param {Object} eventoData - Datos del evento
     */
    renderizarDetallesEvento(eventoData) {
        // Actualizar título y fecha
        document.getElementById('event-name').textContent = 
            this.valorSeguro(eventoData.nombre, 'Evento sin nombre');
        
        document.getElementById('event-date').textContent = 
            this.formatearFecha(eventoData.fechaEvento);
        
        // Actualizar detalles del evento
        const detallesContenido = document.getElementById('event-details-content');
        detallesContenido.innerHTML = `
            <div class="event-detail-item">
                <div class="detail-label">
                    <i class="fas fa-map-marked-alt"></i>
                    <span>Lugar</span>
                </div>
                <div class="detail-value">${this.valorSeguro(eventoData.lugar)}</div>
            </div>
            
            <div class="event-detail-item">
                <div class="detail-label">
                    <i class="fas fa-building"></i>
                    <span>Proveedor</span>
                </div>
                <div class="detail-value">${this.valorSeguro(eventoData.proveedor)}</div>
            </div>
            
            <div class="event-detail-item">
                <div class="detail-label">
                    <i class="fas fa-chair"></i>
                    <span>Mesas</span>
                </div>
                <div class="detail-value">${this.valorSeguro(eventoData.cantidadMesas, '0')}</div>
            </div>
            
            <div class="event-detail-item">
                <div class="detail-label">
                    <i class="fas fa-users"></i>
                    <span>Personas</span>
                </div>
                <div class="detail-value">${this.valorSeguro(eventoData.cantidadPersonas, '0')}</div>
            </div>
            
            <div class="event-detail-item">
                <div class="detail-label">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Creado</span>
                </div>
                <div class="detail-value">${this.formatearFecha(eventoData.fechaRegistro)}</div>
            </div>
            
            <div class="event-detail-item">
                <div class="detail-label">
                    <i class="fas fa-tag"></i>
                    <span>Tipo</span>
                </div>
                <div class="detail-value">${this.valorSeguro(eventoData.tipoEvento, 'No especificado')}</div>
            </div>
        `;
    }

    /**
     * Cargar invitados desde Firestore
     */
    async cargarInvitados() {
        try {
            const invitadosSnapshot = await this.db.collection('invitados')
                .where('idGrupoInvitados', '==', this.state.eventId)
                .get();

            const invitadosList = document.getElementById('invitados-list');
            invitadosList.innerHTML = ''; 

            if (invitadosSnapshot.empty) {
                this.renderizarListaVacia(invitadosList);
                return;
            }

            // Almacenar invitados en el estado
            this.state.invitados = [];
            
            invitadosSnapshot.forEach(doc => {
                const invitado = {
                    id: doc.id,
                    ...doc.data()
                };
                
                this.state.invitados.push(invitado);
                
                const itemInvitado = this.crearElementoInvitado(invitado);
                invitadosList.appendChild(itemInvitado);
            });

        } catch (error) {
            console.error("Error al cargar invitados:", error);
            throw new Error('No se pudieron cargar los invitados');
        }
    }

    /**
     * Crear elemento DOM para un invitado
     * @param {Object} invitado - Datos del invitado
     * @returns {HTMLElement} Elemento DOM para el invitado
     */
    crearElementoInvitado(invitado) {
        const invitadoItem = document.createElement('li');
        invitadoItem.className = 'invitado-item';
        invitadoItem.dataset.id = invitado.id;
        
        const iniciales = this.generarIniciales(invitado.nombre);
        const nombreInvitado = this.valorSeguro(invitado.nombre, 'Invitado sin nombre');
        const telefonoInvitado = this.valorSeguro(invitado.telefono, 'Sin teléfono');
        const estadoConfirmacion = this.obtenerEstadoConfirmacion(invitado);
        const personas = this.valorSeguro(invitado.personas, '1');
        const mesa = this.valorSeguro(invitado.mesa, '-');
        const observacion = this.valorSeguro(invitado.observacion, '');

        invitadoItem.innerHTML = `
            <div class="invitado-info">
                <div class="invitado-avatar">${iniciales}</div>
                <div class="invitado-details">
                    <div class="invitado-name">${nombreInvitado}</div>
                    <div class="invitado-contact">
                        <i class="fas fa-phone-alt"></i>
                        <span>${telefonoInvitado}</span>
                    </div>
                    <div class="invitado-meta">
                        <div class="invitado-meta-item">
                            <i class="fas fa-users"></i>
                            <span>${personas} personas</span>
                        </div>
                        ${mesa !== '-' ? `
                        <div class="invitado-meta-item">
                            <i class="fas fa-chair"></i>
                            <span>Mesa ${mesa}</span>
                        </div>` : ''}
                        ${observacion ? `
                        <div class="invitado-meta-item">
                            <i class="fas fa-comment-alt"></i>
                            <span>${observacion}</span>
                        </div>` : ''}
                    </div>
                </div>
            </div>
            <div class="invitado-status">
                <span class="status-badge ${estadoConfirmacion.clase}">
                    <i class="fas ${estadoConfirmacion.icono}"></i>
                    ${estadoConfirmacion.texto}
                </span>
            </div>
            <div class="invitado-actions">
                <button class="action-btn edit" title="Editar invitado" onclick="eventoManager.editarInvitado('${invitado.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" title="Eliminar invitado" onclick="eventoManager.eliminarInvitado('${invitado.id}')">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;

        return invitadoItem;
    }

    /**
     * Editar un invitado
     * @param {string} invitadoId - ID del invitado a editar
     */
    editarInvitado(invitadoId) {
        const invitado = this.state.invitados.find(inv => inv.id === invitadoId);
        
        if (!invitado) {
            this.mostrarError('Invitado no encontrado', 'No se pudo encontrar el invitado seleccionado.');
            return;
        }
        
        Swal.fire({
            title: 'Editar Invitado',
            html: `
                <form id="invitado-form" class="swal2-form">
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label" for="nombre">Nombre</label>
                            <input type="text" id="nombre" class="form-control" value="${invitado.nombre || ''}" placeholder="Nombre completo">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="telefono">Teléfono</label>
                            <input type="tel" id="telefono" class="form-control" value="${invitado.telefono || ''}" placeholder="Número de teléfono">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="personas">Personas</label>
                            <input type="number" id="personas" class="form-control" value="${invitado.personas || '1'}" min="1">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="mesa">Mesa</label>
                            <input type="text" id="mesa" class="form-control" value="${invitado.mesa || ''}" placeholder="Número de mesa">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="status">Estado</label>
                            <select id="status" class="form-control">
                                <option value="CONFIRMADO" ${invitado.status === 'CONFIRMADO' ? 'selected' : ''}>Confirmado</option>
                                <option value="PENDIENTE" ${invitado.status !== 'CONFIRMADO' ? 'selected' : ''}>Pendiente</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="llamadas">Llamadas</label>
                            <input type="text" id="llamadas" class="form-control" value="${invitado.llamadas || ''}" placeholder="Registro de llamadas">
                        </div>
                        <div class="form-group form-full-width">
                            <label class="form-label" for="observacion">Observación</label>
                            <textarea id="observacion" class="form-control" rows="2" placeholder="Observaciones">${invitado.observacion || ''}</textarea>
                        </div>
                        <div class="form-check form-full-width">
                            <input type="checkbox" id="child" class="form-check-input" ${invitado.child ? 'checked' : ''}>
                            <label class="form-check-label" for="child">¿Trae niños?</label>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="numChilds">Número de niños</label>
                            <input type="text" id="numChilds" class="form-control" value="${invitado.numChilds || ''}" placeholder="Cantidad de niños">
                        </div>
                    </div>
                </form>
            `,
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',
            width: '600px',
            preConfirm: () => {
                return {
                    nombre: document.getElementById('nombre').value,
                    telefono: document.getElementById('telefono').value,
                    status: document.getElementById('status').value,
                    personas: document.getElementById('personas').value,
                    mesa: document.getElementById('mesa').value,
                    observacion: document.getElementById('observacion').value,
                    child: document.getElementById('child').checked,
                    numChilds: document.getElementById('numChilds').value,
                    llamadas: document.getElementById('llamadas').value
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.actualizarInvitado(invitadoId, result.value);
            }
        });
    }

    /**
     * Actualizar un invitado en Firestore
     * @param {string} invitadoId - ID del invitado
     * @param {Object} datosInvitado - Nuevos datos del invitado
     */
    async actualizarInvitado(invitadoId, datosInvitado) {
        try {
            const invitadoActualizado = {
                ...datosInvitado,
                confirmado: datosInvitado.status === 'CONFIRMADO',
                fechaActualizacion: Date.now()
            };

            await this.db.collection('invitados').doc(invitadoId).update(invitadoActualizado);
            
            Swal.fire({
                title: 'Invitado Actualizado',
                text: `${datosInvitado.nombre} ha sido actualizado exitosamente`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });

            // Actualizar la lista de invitados
            await this.cargarInvitados();

        } catch (error) {
            console.error("Error al actualizar invitado:", error);
            this.mostrarError('Error', 'No se pudo actualizar el invitado.');
        }
    }

    /**
     * Eliminar un invitado
     * @param {string} invitadoId - ID del invitado a eliminar
     */
    eliminarInvitado(invitadoId) {
        const invitado = this.state.invitados.find(inv => inv.id === invitadoId);
        
        if (!invitado) {
            this.mostrarError('Invitado no encontrado', 'No se pudo encontrar el invitado seleccionado.');
            return;
        }
        
        Swal.fire({
            title: '¿Eliminar invitado?',
            text: `¿Estás seguro de eliminar a ${invitado.nombre}? Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444'
        }).then((result) => {
            if (result.isConfirmed) {
                this.confirmarEliminarInvitado(invitadoId);
            }
        });
    }

    /**
     * Confirmar y ejecutar eliminación de invitado
     * @param {string} invitadoId - ID del invitado a eliminar
     */
    async confirmarEliminarInvitado(invitadoId) {
        try {
            await this.db.collection('invitados').doc(invitadoId).delete();
            
            Swal.fire({
                title: 'Invitado Eliminado',
                text: 'El invitado ha sido eliminado exitosamente',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });

            // Actualizar la lista de invitados
            await this.cargarInvitados();

        } catch (error) {
            console.error("Error al eliminar invitado:", error);
            this.mostrarError('Error', 'No se pudo eliminar el invitado.');
        }
    }

    /**
     * Mostrar modal para agregar invitado
     */
    mostrarModalAgregarInvitado() {
        Swal.fire({
            title: 'Añadir Invitado',
            html: `
                <form id="invitado-form" class="swal2-form">
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label" for="nombre">Nombre</label>
                            <input type="text" id="nombre" class="form-control" placeholder="Nombre completo">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="telefono">Teléfono</label>
                            <input type="tel" id="telefono" class="form-control" placeholder="Número de teléfono">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="personas">Personas</label>
                            <input type="number" id="personas" class="form-control" value="1" min="1">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="mesa">Mesa</label>
                            <input type="text" id="mesa" class="form-control" placeholder="Número de mesa">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="status">Estado</label>
                            <select id="status" class="form-control">
                                <option value="CONFIRMADO">Confirmado</option>
                                <option value="PENDIENTE" selected>Pendiente</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="llamadas">Llamadas</label>
                            <input type="text" id="llamadas" class="form-control" placeholder="Registro de llamadas">
                        </div>
                        <div class="form-group form-full-width">
                            <label class="form-label" for="observacion">Observación</label>
                            <textarea id="observacion" class="form-control" rows="2" placeholder="Observaciones"></textarea>
                        </div>
                        <div class="form-check form-full-width">
                            <input type="checkbox" id="child" class="form-check-input">
                            <label class="form-check-label" for="child">¿Trae niños?</label>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="numChilds">Número de niños</label>
                            <input type="text" id="numChilds" class="form-control" placeholder="Cantidad de niños">
                        </div>
                    </div>
                </form>
            `,
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',
            width: '600px',
            preConfirm: () => {
                const nombre = document.getElementById('nombre').value;
                const telefono = document.getElementById('telefono').value;
                
                if (!nombre || !telefono) {
                    Swal.showValidationMessage('Por favor, complete al menos nombre y teléfono');
                    return false;
                }
                
                return {
                    nombre,
                    telefono,
                    status: document.getElementById('status').value,
                    personas: document.getElementById('personas').value,
                    mesa: document.getElementById('mesa').value,
                    observacion: document.getElementById('observacion').value,
                    child: document.getElementById('child').checked,
                    numChilds: document.getElementById('numChilds').value,
                    llamadas: document.getElementById('llamadas').value
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.guardarInvitado(result.value);
            }
        });
    }

    /**
     * Guardar un nuevo invitado en Firestore
     * @param {Object} datosInvitado - Datos del nuevo invitado
     */
    async guardarInvitado(datosInvitado) {
        try {
            const nuevoInvitado = {
                ...datosInvitado,
                idGrupoInvitados: this.state.eventId,
                fechaRegistro: Date.now(),
                confirmado: datosInvitado.status === 'CONFIRMADO',
                uidCliente: this.state.currentUser.uid,
                listadoAcompanantes: {}
            };

            await this.db.collection('invitados').add(nuevoInvitado);
            
            Swal.fire({
                title: 'Invitado Añadido',
                text: `${datosInvitado.nombre} ha sido agregado exitosamente`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });

            // Recargar invitados
            await this.cargarInvitados();

        } catch (error) {
            console.error("Error al guardar invitado:", error);
            this.mostrarError('Error', 'No se pudo guardar el invitado.');
        }
    }

    /**
     * Editar evento actual
     */
    editarEvento() {
        if (this.state.eventId) {
            window.location.href = `editar-evento.html?uid=${this.state.eventId}`;
        }
    }

    /**
     * Compartir evento actual
     */
    compartirEvento() {
        const url = window.location.href;
        
        // Verificar si la API de compartir está disponible
        if (navigator.share) {
            navigator.share({
                title: document.getElementById('event-name').textContent,
                text: 'Te invito a mi evento',
                url: url
            })
            .catch(error => {
                console.error('Error al compartir:', error);
                this.copiarAlPortapapeles(url);
            });
        } else {
            this.copiarAlPortapapeles(url);
        }
    }

    /**
     * Copiar URL al portapapeles
     * @param {string} text - Texto a copiar
     */
    copiarAlPortapapeles(text) {
        navigator.clipboard.writeText(text).then(() => {
            Swal.fire({
                title: 'Enlace Copiado',
                text: 'El enlace del evento ha sido copiado al portapapeles',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        }).catch(err => {
            console.error('Error al copiar:', err);
            this.mostrarError('Error', 'No se pudo copiar el enlace.');
        });
    }

    /**
     * Renderizar estado vacío para la lista de invitados
     * @param {HTMLElement} elemento - Elemento DOM donde renderizar
     */
    renderizarListaVacia(elemento) {
        elemento.innerHTML = `
            <li class="no-invitados">
                <i class="fas fa-user-friends"></i>
                <p>No hay invitados registrados para este evento</p>
                <button class="btn btn-primary" onclick="document.getElementById('add-invitado-btn').click()" style="background-color: var(--primary-color); color: white;">
                    <i class="fas fa-user-plus"></i> Añadir Invitado
                </button>
            </li>
        `;
    }

    /**
     * Métodos utilitarios
     */
    
    /**
     * Obtener valor seguro (con valor por defecto si es null/undefined)
     * @param {*} valor - Valor a verificar
     * @param {string} valorPorDefecto - Valor por defecto
     * @returns {*} Valor seguro
     */
    valorSeguro(valor, valorPorDefecto = 'No disponible') {
        return valor !== null && valor !== undefined ? valor : valorPorDefecto;
    }

    /**
     * Formatear fecha desde timestamp
     * @param {number|Date} timestamp - Timestamp o fecha
     * @returns {string} Fecha formateada
     */
    formatearFecha(timestamp) {
        if (!timestamp) return 'Fecha no disponible';
        
        try {
            let fecha;
            
            if (timestamp instanceof Date) {
                fecha = timestamp;
            } else if (typeof timestamp === 'object' && timestamp.seconds) {
                // Timestamp de Firestore
                fecha = new Date(timestamp.seconds * 1000);
            } else {
                fecha = new Date(timestamp);
            }
            
            if (isNaN(fecha.getTime())) {
                return 'Fecha inválida';
            }
            
            return fecha.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error("Error al formatear fecha:", error);
            return 'Fecha no disponible';
        }
    }

    /**
     * Generar iniciales a partir de un nombre
     * @param {string} nombre - Nombre completo
     * @returns {string} Iniciales
     */
    generarIniciales(nombre) {
        if (!nombre) return '?';
        
        return nombre
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    /**
     * Obtener estado de confirmación de un invitado
     * @param {Object} invitado - Datos del invitado
     * @returns {Object} Objeto con texto, clase e icono
     */
    obtenerEstadoConfirmacion(invitado) {
        if (invitado.status === 'CONFIRMADO' || invitado.confirmado === true) {
            return { 
                texto: 'Confirmado', 
                clase: 'status-confirmado',
                icono: 'fa-check-circle'
            };
        }
        return { 
            texto: 'Pendiente', 
            clase: 'status-pendiente',
            icono: 'fa-clock'
        };
    }

    /**
     * Mostrar mensaje de error
     * @param {string} titulo - Título del error
     * @param {string} mensaje - Mensaje de error
     */
    mostrarError(titulo, mensaje) {
        Swal.fire({
            title: titulo,
            text: mensaje,
            icon: 'error'
        });
    }
}

// Inicializar la aplicación cuando el DOM esté listo
let eventoManager;
document.addEventListener('DOMContentLoaded', () => {
    eventoManager = new EventoManager();
    // Hacer accesible desde el ámbito global para los event handlers
    window.eventoManager = eventoManager;
});



document.addEventListener('DOMContentLoaded', () => {
    // Obtener parámetros de URL
    const params = new URLSearchParams(window.location.search);
    
    // Obtener el ID del evento
    const eventoId = params.get('uid');
    const token = params.get('tp9ju');

    // Verificar si existe el ID del evento
    if (!eventoId) {
        mostrarModalAcceso();
        return;
    }

    // Verificar el token en Firebase
    verificarTokenEnFirebase(eventoId, token);
});

async function verificarTokenEnFirebase(eventoId, token) {
    try {
        // Consultar el documento del evento
        const eventoDoc = await db.collection("invitadosGrupos").doc(eventoId).get();

        if (!eventoDoc.exists) {
            mostrarModalAcceso();
            return;
        }

        const eventoData = eventoDoc.data();

        // Si el token es "asxawesafax", no mostrar modal
        if (token === "asxawesafax") {
            // Asegurar que el botón de edición esté visible
            const editEventBtn = document.getElementById('edit-event-btn');
            if (editEventBtn) {
                editEventBtn.style.display = 'inline-block';
            }
            return;
        }

        // Si no hay token o no coincide con la contraseña, mostrar modal
        if (!token || token !== eventoData.password) {
            // Ocultar botón de edición
            const editEventBtn = document.getElementById('edit-event-btn');
            if (editEventBtn) {
                editEventBtn.style.display = 'none';
            }
            mostrarModalAcceso();
        }
    } catch (error) {
        console.error("Error al verificar token:", error);
        mostrarModalAcceso();
    }
}

async function validarAcceso() {
    const params = new URLSearchParams(window.location.search);
    const eventoId = params.get('uid');
    const passwordInput = document.getElementById('password');

    if (!eventoId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se encontró el ID del evento.',
            confirmButtonColor: '#2c4167'
        });
        return;
    }

    try {
        // Consultar el documento del evento en Firebase
        const eventoDoc = await db.collection("invitadosGrupos").doc(eventoId).get();

        if (!eventoDoc.exists) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Evento no encontrado.',
                confirmButtonColor: '#2c4167'
            });
            return;
        }

        const eventoData = eventoDoc.data();

        // Verificar si la contraseña coincide
        if (eventoData.password === passwordInput.value) {
            // Quitar blur
            document.querySelector('.page-container').classList.remove('blur');
            
            // Ocultar modal
            document.getElementById('modalAcceso').style.display = 'none';

            // Mostrar botón de edición
            const editEventBtn = document.getElementById('edit-event-btn');
            if (editEventBtn) {
                editEventBtn.style.display = 'inline-block';
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Contraseña Incorrecta',
                text: 'Por favor, verifique la contraseña proporcionada por su asesor.',
                confirmButtonColor: '#2c4167'
            });
        }
    } catch (error) {
        console.error("Error al validar acceso:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un problema al validar el acceso.',
            confirmButtonColor: '#2c4167'
        });
    }
}

// Modificación adicional para manejar la visibilidad del botón de edición al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const editEventBtn = document.getElementById('edit-event-btn');
    if (editEventBtn) {
        // Ocultar por defecto
        editEventBtn.style.display = 'none';
    }
});

function mostrarModalAcceso() {
    // Crear modal de acceso si no existe
    let modalAcceso = document.getElementById('modalAcceso');
    if (!modalAcceso) {
        modalAcceso = document.createElement('div');
        modalAcceso.id = 'modalAcceso';
        modalAcceso.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            font-family: 'Poppins', sans-serif;
        `;
        modalAcceso.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                width: 400px;
                text-align: center;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                position: relative;
            ">
                <div style="
                    background-color: #2c4167;
                    color: white;
                    padding: 15px;
                    border-radius: 10px 10px 0 0;
                    margin: -30px -30px 20px;
                ">
                    <h2 style="margin: 0;">Acceso Restringido</h2>
                </div>
                
                <p style="
                    color: #333;
                    margin-bottom: 20px;
                    line-height: 1.6;
                ">
                    Por favor, ingrese la contraseña proporcionada por su asesor para acceder a esta página.
                </p>
                
                <div style="position: relative;">
                    <input 
                        type="password" 
                        id="password" 
                        placeholder="Contraseña" 
                        style="
                            width: 100%;
                            padding: 10px;
                            padding-right: 40px;
                            margin-bottom: 20px;
                            border: 1px solid #ddd;
                            border-radius: 5px;
                            font-family: 'Poppins', sans-serif;
                        "
                    >
                    <button 
                        id="togglePassword"
                        style="
                            position: absolute;
                            right: 10px;
                            top: 50%;
                            transform: translateY(-50%);
                            background: none;
                            border: none;
                            cursor: pointer;
                            color: #888;
                        "
                        type="button"
                    >
                        <i id="passwordToggleIcon" class="fas fa-eye-slash"></i>
                    </button>
                </div>
                
                <button 
                    onclick="validarAcceso()" 
                    style="
                        width: 100%;
                        padding: 12px;
                        background-color: #2c4167;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-family: 'Poppins', sans-serif;
                        transition: background-color 0.3s ease;
                    "
                    onmouseover="this.style.backgroundColor='#3a5580'"
                    onmouseout="this.style.backgroundColor='#2c4167'"
                >
                    Ingresar
                </button>
            </div>
        `;
        document.body.appendChild(modalAcceso);

        // Agregar evento para mostrar/ocultar contraseña
        const passwordInput = document.getElementById('password');
        const togglePasswordButton = document.getElementById('togglePassword');
        const togglePasswordIcon = document.getElementById('passwordToggleIcon');

        togglePasswordButton.addEventListener('click', function() {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                togglePasswordIcon.classList.remove('fa-eye-slash');
                togglePasswordIcon.classList.add('fa-eye');
            } else {
                passwordInput.type = 'password';
                togglePasswordIcon.classList.remove('fa-eye');
                togglePasswordIcon.classList.add('fa-eye-slash');
            }
        });
    }

    // Aplicar blur a todo el contenido
    document.querySelector('.page-container').classList.add('blur');
    
    // Mostrar modal
    modalAcceso.style.display = 'flex';
}
