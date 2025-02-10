// Al inicio del archivo
let currentUserId = null;

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUserId = user.uid;
    } else {
        currentUserId = null;
    }
});
// Función para formatear fechas
function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
}


// Cuando se hace clic en el botón de enviar prospecto
document.getElementById('btnEnviarProspecto').addEventListener('click', async function() {
    try {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            console.error('No hay usuario autenticado');
            return;
        }

        const prospectoData = {
            nombre: document.getElementById('modalNombre')?.textContent || 'Sin nombre',
            folio: document.getElementById('modalFolio')?.textContent || 'Sin folio',
            telefono: document.getElementById('modalTelefono')?.textContent || 'Sin teléfono',
        };
        
        createPreviewCard(prospectoData);
        
        // Cargar los datos antes de mostrar el modal
        await initializeChatSelector(currentUser.uid);
        
        // Inicializar y mostrar el modal
        const selectChatModal = document.getElementById('selectChatModal');
        const modal = new bootstrap.Modal(selectChatModal);
        modal.show();

        // Activar el primer tab después de que el modal se muestre
        selectChatModal.addEventListener('shown.bs.modal', function () {
            const firstTab = document.querySelector('#recientes-tab');
            if (firstTab) {
                const tab = new bootstrap.Tab(firstTab);
                tab.show();
                
                // Forzar un reflow
                document.querySelector('#recentesList').style.display = 'none';
                document.querySelector('#recentesList').offsetHeight;
                document.querySelector('#recentesList').style.display = 'block';
            }
        });

    } catch (error) {
        console.error('Error al abrir el modal:', error);
        showErrorMessage('Error al abrir el selector de chats');
    }
});



// Primero, la función para crear el avatar con iniciales
function getInitials(name) {
    return name
        ? name.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
        : "U";
}

function createAvatarHTML(imageUrl, name, isOnline = false) {
    if (imageUrl && imageUrl !== 'undefined' && imageUrl !== 'null') {
        return `
            <div class="chat-item-avatar">
                <img src="${imageUrl}" alt="${name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="initials-avatar" style="display: none;">
                    ${getInitials(name)}
                </div>
                ${isOnline ? '<span class="status-dot online"></span>' : ''}
            </div>
        `;
    } else {
        return `
            <div class="chat-item-avatar">
                <div class="initials-avatar">
                    ${getInitials(name)}
                </div>
                ${isOnline ? '<span class="status-dot online"></span>' : ''}
            </div>
        `;
    }
}

// Modificar la función renderChatList
function renderChatList(items, containerId, type) {
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Contenedor ${containerId} no encontrado`);
        return;
    }

    container.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No hay ${type === 'direct' ? 'chats' : type === 'group' ? 'grupos' : 'contactos'} disponibles</p>
            </div>
        `;
        return;
    }

    const listContainer = document.createElement('div');
    listContainer.className = 'chat-list-container';

    items.forEach(item => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-list-item';
        chatItem.dataset.chatId = item.id;

        let content = '';
        switch(type) {
            case 'direct':
                const otherParticipant = Object.values(item.participants)
                    .find(p => p.uid !== currentUserId);
                content = `
                    ${createAvatarHTML(otherParticipant.photoURL, otherParticipant.name, otherParticipant.online)}
                    <div class="chat-item-info">
                        <div class="chat-item-name">${otherParticipant.name}</div>
                        <div class="chat-item-last-message">
                            ${item.lastMessage ? item.lastMessage.content : 'No hay mensajes'}
                        </div>
                    </div>
                    <div class="chat-item-meta">
                        <span class="chat-item-time">
                            ${item.lastMessage ? formatDate(item.lastMessage.timestamp) : ''}
                        </span>
                    </div>
                `;
                break;
            
            case 'group':
                content = `
                    ${createAvatarHTML(item.imageUrl, item.name)}
                    <div class="chat-item-info">
                        <div class="chat-item-name">${item.name}</div>
                        <div class="chat-item-members">
                            ${Object.keys(item.participants).length} participantes
                        </div>
                    </div>
                `;
                break;
            
            case 'contacts':
                content = `
                    ${createAvatarHTML(item.imageProfile, item.name, item.online)}
                    <div class="chat-item-info">
                        <div class="chat-item-name">${item.name}</div>
                        <div class="chat-item-email">${item.email}</div>
                    </div>
                `;
                break;
        }

        chatItem.innerHTML = content;
        chatItem.addEventListener('click', () => handleChatSelection(item.id, type));
        listContainer.appendChild(chatItem);
    });

    container.appendChild(listContainer);
}

// Modificar initializeChatSelector
async function initializeChatSelector(userId) {
    if (!userId) {
        throw new Error('Se requiere ID de usuario');
    }

    // Obtener referencias a los contenedores
    const containers = {
        recientes: document.getElementById('recentesList'),
        grupos: document.getElementById('gruposList'),
        contactos: document.getElementById('contactosList')
    };

    // Verificar que todos los contenedores existen
    for (const [key, container] of Object.entries(containers)) {
        if (!container) {
            console.error(`No se encontró el contenedor: ${key}`);
            return;
        }
    }

    try {
        // Mostrar estado de carga en todos los contenedores
        Object.values(containers).forEach(container => {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                </div>
            `;
        });

        // Cargar datos
        const [recentChats, groups, contacts] = await Promise.all([
            getRecentChats(userId),
            getGroups(userId),
            getContacts(userId)
        ]);

        console.log('Datos cargados:', {
            recentChats,
            groups,
            contacts
        });

        // Renderizar cada sección
        renderChatList(recentChats, 'recentesList', 'direct');
        renderChatList(groups, 'gruposList', 'group');
        renderChatList(contacts, 'contactosList', 'contacts');

        // Configurar búsqueda
        setupSearch(recentChats, groups, contacts);

    } catch (error) {
        console.error('Error al cargar los chats:', error);
        
        // Mostrar error en todos los contenedores
        Object.values(containers).forEach(container => {
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error al cargar los datos</p>
                </div>
            `;
        });
    }
}




// Configurar la búsqueda
function setupSearch(recentChats, groups, contacts) {
    const searchInput = document.querySelector('.search-container input');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        filterAndRenderChats(recentChats, searchTerm, 'recentesList', 'direct');
        filterAndRenderChats(groups, searchTerm, 'gruposList', 'group');
        filterAndRenderChats(contacts, searchTerm, 'contactosList', 'contacts');
    });
}


// Función para crear la tarjeta de vista previa
function createPreviewCard(data) {
    const previewCard = document.querySelector('.prospect-card');
    if (!previewCard) return;

    // Formatear la información del prospecto en una tarjeta
    previewCard.innerHTML = `
        <div class="card-preview-content">
            <div class="preview-header">
                <i class="fas fa-user-circle"></i>
                <span>Prospecto</span>
            </div>
            <div class="preview-body">
                <h6>${data.nombre || 'Sin nombre'}</h6>
                <div class="preview-details">
                    <div class="detail-item">
                        <i class="fas fa-hashtag"></i>
                        <span>Folio: ${data.folio || 'Sin folio'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-phone"></i>
                        <span>Tel: ${data.telefono || 'Sin teléfono'}</span>
                    </div>
                </div>
                <div class="preview-link">
                    <a href="/prospectos/${data.folio}" class="btn btn-sm btn-outline-primary">
                        <i class="fas fa-external-link-alt"></i> Ver detalles
                    </a>
                </div>
            </div>
        </div>
    `;
}





// Función para crear el HTML de cada item
function createChatItemHTML(item, type) {
    switch(type) {
        case 'direct':
            const otherParticipant = Object.values(item.participants)
                .find(p => p.uid !== firebase.auth().currentUser.uid);
            
            return `
                <div class="chat-item" data-chat-id="${item.id}">
                    <div class="chat-avatar">
                        <img src="${otherParticipant.photoURL || 'js/prospectos/default-avatar.png'}" alt="${otherParticipant.name}">
                        <span class="status-indicator ${otherParticipant.online ? 'online' : ''}"></span>
                    </div>
                    <div class="chat-info">
                        <h6>${otherParticipant.name}</h6>
                        <small>${item.lastMessage ? item.lastMessage.content : 'No hay mensajes'}</small>
                    </div>
                    <div class="chat-meta">
                        <small>${formatDate(item.lastMessage?.timestamp)}</small>
                    </div>
                </div>
            `;
            
        case 'group':
            return `
                <div class="chat-item" data-chat-id="${item.id}">
                    <div class="chat-avatar">
                        <img src="${item.imageUrl || 'js/prospectos/default-group.png'}" alt="${item.name}">
                    </div>
                    <div class="chat-info">
                        <h6>${item.name}</h6>
                        <small>${Object.keys(item.participants).length} participantes</small>
                    </div>
                </div>
            `;
            
        case 'contacts':
            return `
                <div class="chat-item" data-chat-id="${item.id}">
                    <div class="chat-avatar">
                        <img src="${item.photoURL || 'js/prospectos/default-avatar.png'}" alt="${item.name}">
                    </div>
                    <div class="chat-info">
                        <h6>${item.name}</h6>
                        <small>${item.email}</small>
                    </div>
                </div>
            `;
    }
}

// Mostrar mensaje de error
function showErrorMessage(message) {
    // Implementa tu lógica para mostrar errores
    console.error(message);
    // Por ejemplo, podrías usar un toast o un alert
    alert(message);
}





// Función para obtener chats recientes (directos)
// Función para obtener chats recientes (directos)
async function getRecentChats(userId) {
    try {
        console.log('Obteniendo chats recientes para userId:', userId);
        
        const chatsSnapshot = await firebase.firestore()
            .collection('chats')
            .where('participantsArray', 'array-contains', { uid: userId, deleted: false })
            .orderBy('updatedAt', 'desc')
            .get();

        console.log('Cantidad de chats encontrados:', chatsSnapshot.size);

        const recentChats = [];

        for (const doc of chatsSnapshot.docs) {
            const chatData = doc.data();
            console.log('Chat data:', chatData);
            
            const userParticipant = chatData.participants[userId];
            console.log('User participant:', userParticipant);

            if (!userParticipant.deleted) {
                if (chatData.type === 'direct') {
                    // Verificar si hay mensajes
                    const messagesQuery = await firebase.firestore()
                        .collection(`chats/${doc.id}/messages`)
                        .limit(1)
                        .get();

                    if (!messagesQuery.empty || chatData.lastMessage) {
                        recentChats.push({
                            id: doc.id,
                            ...chatData
                        });
                    }
                }
            }
        }

        console.log('Chats recientes filtrados:', recentChats);
        return recentChats;
    } catch (error) {
        console.error('Error al obtener chats recientes:', error);
        return [];
    }
}

// Función para obtener grupos
async function getGroups(userId) {
    try {
        console.log('Obteniendo grupos para userId:', userId);
        
        const groupsSnapshot = await firebase.firestore()
            .collection('chats')
            .where('participantsArray', 'array-contains', { uid: userId, deleted: false })
            .orderBy('updatedAt', 'desc')
            .get();

        console.log('Cantidad de grupos encontrados:', groupsSnapshot.size);

        const groups = groupsSnapshot.docs
            .filter(doc => {
                const chatData = doc.data();
                console.log('Grupo data:', chatData);
                
                const userParticipant = chatData.participants[userId];
                return !userParticipant.deleted && chatData.type === 'group';
            })
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        console.log('Grupos filtrados:', groups);
        return groups;
    } catch (error) {
        console.error('Error al obtener grupos:', error);
        return [];
    }
}

// Función para obtener contactos
async function getContacts(userId) {
    try {
        console.log('Obteniendo contactos para userId:', userId);
        
        const usersSnapshot = await firebase.firestore()
            .collection('usuarios')
            .get();

        console.log('Cantidad de usuarios encontrados:', usersSnapshot.size);

        const contacts = usersSnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            .filter(user => user.id !== userId);

        console.log('Contactos filtrados:', contacts);
        return contacts;
    } catch (error) {
        console.error('Error al obtener contactos:', error);
        return [];
    }
}

// Función auxiliar para mostrar mensaje de error
function showErrorMessage(container, message) {
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
}

// Función auxiliar para mostrar mensaje de vacío
function showEmptyMessage(container, message = 'No hay chats disponibles') {
    container.innerHTML = `
        <div class="empty-message">
            <i class="fas fa-comments"></i>
            <p>${message}</p>
        </div>
    `;
}




// Configurar la búsqueda
function setupSearch(recentChats, groups, contacts) {
    const searchInput = document.querySelector('.share-prospect-modal .search-container input');
    if (!searchInput) {
        console.error('No se encontró el input de búsqueda');
        return;
    }

    // Almacenar los datos originales
    const originalData = {
        recentChats,
        groups,
        contacts
    };

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        console.log('Buscando:', searchTerm);

        // Filtrar chats recientes
        const filteredRecentChats = recentChats.filter(chat => {
            const otherParticipant = Object.values(chat.participants)
                .find(p => p.uid !== currentUserId);
            return otherParticipant && otherParticipant.name && 
                   otherParticipant.name.toLowerCase().includes(searchTerm);
        });
        renderChatList(filteredRecentChats, 'recentesList', 'direct');

        // Filtrar grupos
        const filteredGroups = groups.filter(group => 
            group.name && group.name.toLowerCase().includes(searchTerm)
        );
        renderChatList(filteredGroups, 'gruposList', 'group');

        // Filtrar contactos
        const filteredContacts = contacts.filter(contact => 
            (contact.name && contact.name.toLowerCase().includes(searchTerm)) ||
            (contact.email && contact.email.toLowerCase().includes(searchTerm))
        );
        renderChatList(filteredContacts, 'contactosList', 'contacts');
    });

    // Agregar evento para limpiar la búsqueda
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            renderChatList(originalData.recentChats, 'recentesList', 'direct');
            renderChatList(originalData.groups, 'gruposList', 'group');
            renderChatList(originalData.contacts, 'contactosList', 'contacts');
        }
    });

    // Opcional: Agregar botón de limpiar búsqueda
    const searchContainer = searchInput.parentElement;
    const clearButton = document.createElement('button');
    clearButton.className = 'clear-search';
    clearButton.innerHTML = '<i class="fas fa-times"></i>';
    clearButton.style.display = 'none';
    searchContainer.appendChild(clearButton);

    searchInput.addEventListener('input', () => {
        clearButton.style.display = searchInput.value ? 'block' : 'none';
    });

    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        clearButton.style.display = 'none';
        renderChatList(originalData.recentChats, 'recentesList', 'direct');
        renderChatList(originalData.groups, 'gruposList', 'group');
        renderChatList(originalData.contacts, 'contactosList', 'contacts');
    });
}


// Función para crear el documento en prospectoCompartidos
async function createProspectoCompartido(chatId, prospectoData, currentUser) {
    try {
        const prospectoCompartidoRef = firebase.firestore().collection('prospectoCompartidos').doc();
        
        // Obtener los participantes del chat
        const chatDoc = await firebase.firestore().collection('chats').doc(chatId).get();
        
        if (!chatDoc.exists) {
            throw new Error('El chat no existe');
        }

        const chatData = chatDoc.data();
        
        if (!chatData || !chatData.participants) {
            throw new Error('El chat no tiene la estructura correcta');
        }

        let uidDestino = [];

        // Manejar diferentes estructuras de participantes
        if (chatData.type === 'direct') {
            // Para chats directos
            uidDestino = [Object.keys(chatData.participants)
                .find(uid => uid !== currentUser.uid)];
        } else if (chatData.type === 'group') {
            // Para grupos, excluir al remitente
            uidDestino = Object.keys(chatData.participants)
                .filter(uid => uid !== currentUser.uid)
                .filter(uid => !chatData.participants[uid].deleted); // Excluir participantes que se han salido
        } else {
            throw new Error('Tipo de chat no válido');
        }

        if (uidDestino.length === 0) {
            throw new Error('No hay destinatarios válidos');
        }

        // Crear array de vistos con false para cada destinatario
        const vistos = new Array(uidDestino.length).fill(false);

        // Crear el documento
        const prospectoCompartidoData = {
            id: prospectoCompartidoRef.id,
            uidDestino: uidDestino,
            vistos: vistos,
            uidOrigen: currentUser.uid,
            mensaje: `${currentUser.displayName || 'Usuario'} compartió un prospecto`,
            idProspectos: [prospectoData.id],
            activo: true,
            fecha: firebase.firestore.FieldValue.serverTimestamp(),
            chatId: chatId, // Agregar referencia al chat
            chatType: chatData.type // Agregar tipo de chat
        };

        await prospectoCompartidoRef.set(prospectoCompartidoData);
        return prospectoCompartidoRef.id;
    } catch (error) {
        console.error('Error al crear prospectoCompartido:', error);
        throw new Error(`Error al compartir el prospecto: ${error.message}`);
    }
}

// Función para enviar el mensaje al chat
async function sendProspectoToChat(chatId, prospectoData) {
    try {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) throw new Error('No hay usuario autenticado');

        // Verificar que el chat existe
        const chatRef = firebase.firestore().collection('chats').doc(chatId);
        const chatDoc = await chatRef.get();
        
        if (!chatDoc.exists) {
            throw new Error('El chat no existe');
        }

        // Primero crear el documento en prospectoCompartidos
        const prospectoCompartidoId = await createProspectoCompartido(chatId, prospectoData, currentUser);

        // Crear el mensaje con la referencia al prospectoCompartido
        const message = createProspectoMessage(prospectoData, currentUser, prospectoCompartidoId);

        // Enviar el mensaje
        await chatRef.collection('messages').add(message);

        // Actualizar el último mensaje del chat
        await chatRef.update({
            lastMessage: {
                content: `${currentUser.name || 'Usuario'} compartió un prospecto`,
                senderId: currentUser.uid,
                senderName: currentUser.name || 'Usuario',
                senderPhoto: currentUser.imageProfile||null,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                type:'prospecto_share'
            },
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return true;
    } catch (error) {
        console.error('Error al enviar el prospecto:', error);
        throw error;
    }
}


// Función para encontrar o crear un chat directo
async function findOrCreateDirectChat(contactUserId) {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        throw new Error('No hay usuario autenticado');
    }

    try {
        const chatsRef = firebase.firestore().collection('chats');
        // Buscar chats directos donde ambos usuarios son participantes
        const directChatsSnapshot = await chatsRef
            .where('type', '==', 'direct')
            .where(`participants.${currentUser.uid}.uid`, '==', currentUser.uid)
            .where(`participants.${contactUserId}.uid`, '==', contactUserId)
            .limit(1)
            .get();

        if (!directChatsSnapshot.empty) {
            // Ya existe un chat entre estos usuarios
            const chatDoc = directChatsSnapshot.docs[0];
            return chatDoc.id;
        } else {
            // Crear un nuevo chat directo
            const chatData = {
                type: 'direct',
                participants: {
                    [currentUser.uid]: {
                        uid: currentUser.uid,
                        name: currentUser.name || 'Usuario',
                        photoURL: currentUser.imageProfile || null,
                        deleted: false
                    },
                    [contactUserId]: {
                        uid: contactUserId,
                        name: '', // lo llenaremos después
                        photoURL: '', // lo llenaremos después
                        deleted: false
                    }
                },
                participantsArray: [
                    {
                        uid: currentUser.uid,
                        deleted: false
                    },
                    {
                        uid: contactUserId,
                        deleted: false
                    }
                ],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Obtener información del contacto
            const contactDoc = await firebase.firestore().collection('usuarios').doc(contactUserId).get();
            if (contactDoc.exists) {
                const contactData = contactDoc.data();
                chatData.participants[contactUserId].name = contactData.name || 'Usuario';
                chatData.participants[contactUserId].photoURL = contactData.imageProfile || null;
            } else {
                chatData.participants[contactUserId].name = 'Usuario';
                chatData.participants[contactUserId].imageProfile = null;
            }

            const newChatRef = await chatsRef.add(chatData);
            return newChatRef.id;
        }
    } catch (error) {
        console.error('Error al encontrar o crear chat directo:', error);
        throw new Error('No se pudo iniciar el chat con el contacto seleccionado');
    }
}



// Función para manejar la selección de un chat o contacto
async function handleChatSelection(itemId, type) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('selectChatModal'));
    
    // Obtener los datos del prospecto
    const prospectoData = {
        id: prospectoActualId, // Asegúrate de que esta variable esté definida
        nombre: document.getElementById('modalNombre').textContent,
        folio: document.getElementById('modalFolio').textContent,
        telefono: document.getElementById('modalTelefono').textContent
    };

    // Confirmar el envío
    const result = await Swal.fire({
        title: '¿Compartir prospecto?',
        html: `
            <div class="text-left">
                <p>¿Deseas compartir la información de este prospecto?</p>
                <small class="text-muted">
                    Nombre: ${prospectoData.nombre}<br>
                    Folio: ${prospectoData.folio}<br>
                    Teléfono: ${prospectoData.telefono}
                </small>
            </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Compartir',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        // Mostrar el alert de carga sin await
        Swal.fire({
            title: 'Enviando...',
            text: 'Por favor espera',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            let chatId = itemId;

            if (type === 'contacts') {
                // Necesitamos encontrar o crear un chat directo con este contacto
                chatId = await findOrCreateDirectChat(itemId);
            }

            await sendProspectoToChat(chatId, prospectoData);
            // Cerrar el alert de carga
            Swal.close();
            modal.hide();

            await Swal.fire({
                icon: 'success',
                title: '¡Compartido!',
                text: 'El prospecto ha sido compartido exitosamente',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            // Cerrar el alert de carga en caso de error
            Swal.close();
            console.error('Error al compartir el prospecto:', error);
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'No se pudo compartir el prospecto'
            });
        }
    }
}

// Función para crear el mensaje de prospecto compartido
function createProspectoMessage(prospectoData, currentUser, prospectoCompartidoId) {
    const params = new URLSearchParams({
        action: 'openProspecto',
        id: prospectoData.id,
        folio: prospectoData.folio
    }).toString();

    const baseUrl = window.location.origin;
    const prospectoUrl = `${baseUrl}/page-prospectos.html?${params}`;

    return {
        content: JSON.stringify({
            type: 'prospecto_share',
            preview: {
                title: prospectoData.nombre,
                folio: prospectoData.folio,
                telefono: prospectoData.telefono
            },
            url: prospectoUrl,
            prospectoId: prospectoData.id,
            prospectoCompartidoId: prospectoCompartidoId // Agregamos referencia al documento de prospectoCompartido
        }),
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Usuario',
        senderPhoto: currentUser.photoURL,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        type: 'prospecto_share'
    };
}











// Agregar al final del archivo
document.addEventListener('DOMContentLoaded', function() {
    const selectChatModal = document.getElementById('selectChatModal');
    if (selectChatModal) {
        selectChatModal.addEventListener('shown.bs.tab', function (event) {
            // Forzar un reflow del contenido del tab
            const targetId = event.target.getAttribute('data-bs-target');
            const targetPane = document.querySelector(targetId);
            if (targetPane) {
                targetPane.offsetHeight;
            }
        });
    }
});