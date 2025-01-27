

class ChatApp {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.storage = firebase.storage();
        this.currentUser = null;
        this.currentChat = null;
        this.messageListener = null;
        this.chatsListener = null;

        // Referencias DOM
        this.chatList = document.querySelector('.chat-list');
        this.messagesContainer = document.querySelector('.messages-container');
        this.messageInput = document.querySelector('.message-input-container input');
        this.sendButton = document.querySelector('.send-btn');
        this.newChatButton = document.querySelector('.new-chat-btn');
        this.searchInput = document.querySelector('.search-container input');
        this.attachmentButton = document.querySelector('.attachment-btn');

         
        // Referencias adicionales
        this.usersModal = new bootstrap.Modal(document.getElementById('usersModal'));
        this.usersList = document.querySelector('.users-list');
        this.userSearchInput = document.getElementById('userSearchInput');
        

        // Referencias adicionales para móvil
        this.mobileToggle = document.querySelector('.mobile-toggle-chat');
        this.chatSidebar = document.querySelector('.chat-sidebar');
        this.chatOverlay = document.querySelector('.chat-overlay');

        this.setupMobileUI();

        this.initializeApp();
    }

    async initializeApp() {
        // Verificar autenticación
        this.auth.onAuthStateChanged(user => {
            if (user) {
                this.currentUser = user;
                this.setupEventListeners();
                this.loadChats();
            } else {
                window.location.href = 'login.html';
            }
        });
    }



    setupEventListeners() {
        // Enviar mensaje
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Modificar el evento del botón nuevo chat
        this.newChatButton.addEventListener('click', () => this.showUsersModal());

        // Agregar evento para búsqueda de usuarios
        this.userSearchInput.addEventListener('input', (e) => this.filterUsers(e.target.value));

        // Búsqueda
        this.searchInput.addEventListener('input', (e) => this.searchChats(e.target.value));

        // Adjuntar archivo
        this.attachmentButton.addEventListener('click', () => this.handleAttachment());
    }

    async showUsersModal() {
        try {
            await this.loadUsers();
            this.usersModal.show();
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
        }
    }

    async loadUsers() {
        try {
            const usersSnapshot = await this.db
                .collection('usuarios')
                .where('uid', '!=', this.currentUser.uid) // Excluir usuario actual
                .get();

            this.usersList.innerHTML = ''; // Limpiar lista actual

            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                this.renderUserItem(userData);
            });
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            throw error;
        }
    }

    createInitialsAvatar(name) {
        const initials = name
            ? name.split(' ').map(n => n[0]).join('').toUpperCase()
            : 'U';
        
        return `<div class="initials-avatar">${initials}</div>`;
    }
    
    renderUserItem(userData) {
        const template = `
            <div class="user-item" data-user-id="${userData.uid}">
                <div class="avatar-container">
                    ${userData.imageProfile 
                        ? `<img src="${userData.imageProfile}" 
                               alt="${userData.name || 'Usuario'}">`
                        : this.createInitialsAvatar(userData.name)
                    }
                </div>
                <div class="user-info">
                    <h3>${userData.name || 'Usuario sin nombre'}</h3>
                    <p>${userData.email}</p>
                </div>
                <span class="user-role role-${userData.userType || 'user'}">
                    ${this.formatRole(userData.userType || 'user')}
                </span>
            </div>
        `;
    
        this.usersList.insertAdjacentHTML('beforeend', template);
    
        const userItem = this.usersList.lastElementChild;
        userItem.addEventListener('click', () => this.handleUserSelection(userData));
    }


    formatRole(role) {
        const roles = {
            admin: 'Administrador',
            user: 'Usuario',
            asesor: 'Asesor',
            cliente: 'Cliente',
            lider:'Lider',
            proveedor:'Proveedor'
        };
        return roles[role] || 'Usuario';
    }

    
        async handleUserSelection(userData) {
            try {
                console.log("Usuario seleccionado:", userData);
    
                // Preparar los datos del usuario
                const otherUserData = {
                    uid: userData.uid,
                    name: userData.name || 'Usuario',
                    email: userData.email || '',
                    photoURL: userData.imageProfile || null,
                    userType: userData.userType || 'user',
                    online: userData.onLine || false
                };
    
                // Crear o recuperar el chat
                const chatRef = await this.createChat(otherUserData);
                
                if (chatRef && chatRef.id) {
                    console.log("Chat creado/recuperado:", chatRef.id);
                    this.usersModal.hide();
                    await this.openChat(chatRef.id, otherUserData);
                } else {
                    throw new Error('No se pudo crear el chat');
                }


                if (window.innerWidth <= 768) {
                    this.hideSidebar();
                }
          
            } catch (error) {
                console.error('Error al crear/abrir chat:', error);
                Swal.fire('Error', 'No se pudo crear el chat', 'error');
            }
        }
    
        async createChat(otherUser) {
            try {
                const participantsId = [this.currentUser.uid, otherUser.uid].sort().join('_');
                
                // Buscar chat existente
                const existingChatQuery = await this.db
                    .collection('chats')
                    .where('participantsId', '==', participantsId)
                    .get();
        
                if (!existingChatQuery.empty) {
                    return existingChatQuery.docs[0].ref;
                }
        
                // Obtener datos del usuario actual
                const currentUserDoc = await this.db.collection('usuarios').doc(this.currentUser.uid).get();
                const currentUserData = currentUserDoc.data();
        
                // Crear nuevo chat
                const chatData = {
                    type: 'direct',
                    participantsId: participantsId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastMessage: null,
                    participants: {
                        [this.currentUser.uid]: {
                            uid: this.currentUser.uid,
                            name: currentUserData.name || this.currentUser.email,
                            email: this.currentUser.email,
                            photoURL: currentUserData.imageProfile || null,
                            role: currentUserData.userType || 'member',
                            online: true,
                            lastRead: firebase.firestore.FieldValue.serverTimestamp()
                        },
                        [otherUser.uid]: {
                            uid: otherUser.uid,
                            name: otherUser.name,
                            email: otherUser.email,
                            photoURL: otherUser.photoURL || otherUser.imageProfile || null,
                            role: otherUser.userType || 'member',
                            online: otherUser.online || false,
                            lastRead: null
                        }
                    }
                };
        
                return await this.db.collection('chats').add(chatData);
            } catch (error) {
                console.error('Error en createChat:', error);
                throw error;
            }
        }
    
        async openChat(chatId, userData = null) {
            try {
                console.log("Abriendo chat:", chatId, userData);
                this.currentChat = chatId;
    
                // Si no tenemos los datos del usuario, los obtenemos del chat
                if (!userData) {
                    const chatDoc = await this.db.collection('chats').doc(chatId).get();
                    if (!chatDoc.exists) {
                        throw new Error('Chat no encontrado');
                    }
                    const chatData = chatDoc.data();
                    const otherUserId = Object.keys(chatData.participants)
                        .find(uid => uid !== this.currentUser.uid);
                    userData = chatData.participants[otherUserId];
                }
    
                // Asegurarnos de que tenemos todos los datos necesarios
                const userDataComplete = {
                    name: userData.name || 'Usuario',
                    photoURL: userData.photoURL || userData.imageProfile || null,
                    email: userData.email || '',
                    online: userData.online || false,
                    role: userData.role || 'member'
                };
    
                // Actualizar UI
                this.updateChatHeader(userDataComplete);
    
                // Actualizar chat activo en la lista
                document.querySelectorAll('.chat-item').forEach(item => {
                    item.classList.remove('active');
                });
                  // Añadir clase para móvil
        document.querySelector('.chat-container').classList.add('chat-active');
                const chatItem = document.querySelector(`[data-chat-id="${chatId}"]`);
                if (chatItem) chatItem.classList.add('active');
    
                // Cargar mensajes
                await this.loadMessages(chatId);
    
                // Habilitar controles
                this.enableChatControls();
    
            } catch (error) {
                console.error('Error en openChat:', error);
                throw error;
            }
        }
    
        // Método para habilitar los controles del chat
        enableChatControls() {
            if (this.messageInput) this.messageInput.disabled = false;
            if (this.sendButton) this.sendButton.disabled = false;
            if (this.attachmentButton) this.attachmentButton.disabled = false;
        }
    
        // Método para deshabilitar los controles del chat
        disableChatControls() {
            if (this.messageInput) this.messageInput.disabled = true;
            if (this.sendButton) this.sendButton.disabled = true;
            if (this.attachmentButton) this.attachmentButton.disabled = true;
        }
    
        renderChatItem(chatId, chatData) {
            try {
                const otherParticipantId = Object.keys(chatData.participants)
                    .find(uid => uid !== this.currentUser.uid);
                const otherParticipant = chatData.participants[otherParticipantId];
        
                if (!otherParticipant) {
                    console.error('No se encontró al otro participante');
                    return;
                }
        
                const lastMessageTime = chatData.lastMessage?.timestamp 
                    ? this.formatTime(chatData.lastMessage.timestamp)
                    : '';
        
                // Simplificar el manejo del avatar
                const avatarHTML = otherParticipant.photoURL
                    ? `<img src="${otherParticipant.photoURL}" alt="${otherParticipant.name}" onerror="this.onerror=null; this.src='../img/default-avatar.png';">`
                    : this.createInitialsAvatar(otherParticipant.name);
        
                const template = `
                    <div class="chat-item ${this.currentChat === chatId ? 'active' : ''}" data-chat-id="${chatId}">
                        <div class="avatar-container">
                            ${avatarHTML}
                            <span class="status-dot ${otherParticipant.online ? 'online' : ''}"></span>
                        </div>
                        <div class="chat-info">
                            <h2>${otherParticipant.name}</h2>
                            <p class="last-message">
                                ${this.formatLastMessage(chatData.lastMessage)}
                            </p>
                        </div>
                        <div class="chat-meta">
                            ${lastMessageTime ? `<span class="time" style="color:gray;">${lastMessageTime}</span>` : ''}
                            ${this.getUnreadCount(chatData) > 0 
                                ? `<span class="unread-count">${this.getUnreadCount(chatData)}</span>` 
                                : ''}
                        </div>
                    </div>
                `;
        
                this.chatList.insertAdjacentHTML('beforeend', template);
                const chatItem = this.chatList.lastElementChild;
                chatItem.addEventListener('click', () => this.openChat(chatId));
        
            } catch (error) {
                console.error('Error rendering chat item:', error);
            }
        }
        
        setupMobileUI() {
            // Asegurarse de que los elementos existen
            this.mobileToggle = document.querySelector('.mobile-toggle-chat');
            this.chatSidebar = document.querySelector('.chat-sidebar');
            this.chatOverlay = document.querySelector('.chat-overlay');
        
            if (this.mobileToggle) {
                this.mobileToggle.addEventListener('click', () => {
                    this.toggleSidebar();
                });
            }
        
            if (this.chatOverlay) {
                this.chatOverlay.addEventListener('click', () => {
                    this.hideSidebar();
                });
            }
        
            // Manejar clicks en los chats para móvil
            this.chatList.addEventListener('click', (e) => {
                const chatItem = e.target.closest('.chat-item');
                if (chatItem && window.innerWidth <= 768) {
                    this.hideSidebar();
                }
            });

            if (window.innerWidth <= 768) {
                document.querySelector('.chat-container').classList.remove('chat-active');
            }
        
            // Manejar cambios de tamaño de ventana
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768) {
                    document.querySelector('.chat-container').classList.remove('chat-active');
                }
            });


             // Manejar interacción entre sidebars
    const mainSidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.js-sidebar-toggle');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                // Ocultar chat sidebar si está visible
                this.hideChatSidebar();
            }
        });
        }
    }

        backToList() {
            document.querySelector('.chat-container').classList.remove('chat-active');
        }
        
        toggleSidebar() {
            if (this.chatSidebar && this.chatOverlay) {
                const container = document.querySelector('.chat-container');
                if (container.classList.contains('chat-active')) {
                    // Si hay un chat activo, quitamos la clase para mostrar la lista
                    container.classList.remove('chat-active');
                } else {
                    // Si estamos en la lista, volvemos al chat
                    container.classList.add('chat-active');
                }
            }
        }
        
        showSidebar() {
            this.chatSidebar.classList.add('show');
            this.chatOverlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
        
        hideChatSidebar() {
    if (this.chatSidebar) {
        this.chatSidebar.style.display = 'none';
        setTimeout(() => {
            this.chatSidebar.style.display = '';
        }, 300); // Tiempo de la transición del sidebar principal
    }
}
        
        updateChatHeader(userData) {
            const headerTemplate = `
                <div class="d-flex align-items-center w-100">
                    <button class="back-to-list-btn d-md-none">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <div class="user-info flex-grow-1 d-flex align-items-center">
                        <div class="avatar-container">
                            ${userData.photoURL 
                                ? `<img src="${userData.photoURL}" alt="${userData.name}" 
                                     onerror="this.onerror=null; this.src='../img/default-avatar.png';">` 
                                : this.createInitialsAvatar(userData.name)}
                        </div>
                        <div class="ms-2">
                            <h2 class="mb-0">${userData.name}</h2>
                            <span class="status">${userData.online ? 'En línea' : 'Desconectado'}</span>
                        </div>
                    </div>
                    <div class="chat-actions">
                        <button class="action-btn d-none d-md-inline-block">
                            <i class="fas fa-phone"></i>
                        </button>
                        <button class="action-btn d-none d-md-inline-block">
                            <i class="fas fa-video"></i>
                        </button>
                        <button class="action-btn">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </div>
            `;
        
            const header = document.querySelector('.chat-main-header');
            if (header) {
                header.innerHTML = headerTemplate;
                
                // Añadir evento al botón de volver
                const backButton = header.querySelector('.back-to-list-btn');
                if (backButton) {
                    backButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.backToList();
                    });
                }
            }
        }

    // Modificar el loadMessages para mostrar el estado inicial
    async loadMessages(chatId) {
        if (this.messageListener) this.messageListener();
    
        // Limpiar mensajes anteriores
        this.messagesContainer.innerHTML = '';
    
        // Mostrar mensaje de bienvenida si no hay mensajes
        this.messageListener = this.db
            .collection(`chats/${chatId}/messages`)
            .orderBy('timestamp', 'desc')
            .limit(50)
            .onSnapshot(snapshot => {
                if (snapshot.empty) {
                    this.showWelcomeMessage();
                } else {
                    const messages = [];
                    snapshot.forEach(doc => {
                        messages.unshift({ id: doc.id, ...doc.data() });
                    });
                    this.renderMessages(messages);
                }
            });
    }
    
    showWelcomeMessage() {
        const template = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <i class="fas fa-comments"></i>
                </div>
                <h3>¡Comienza la conversación!</h3>
                <p>Envía un mensaje para iniciar el chat</p>
            </div>
        `;
        this.messagesContainer.innerHTML = template;
    }

    filterUsers(query) {
        const userItems = this.usersList.querySelectorAll('.user-item');
        const searchTerm = query.toLowerCase();

        userItems.forEach(item => {
            const name = item.querySelector('h3').textContent.toLowerCase();
            const email = item.querySelector('p').textContent.toLowerCase();
            const visible = name.includes(searchTerm) || email.includes(searchTerm);
            item.style.display = visible ? 'flex' : 'none';
        });
    }

    async loadChats() {
        if (this.chatsListener) this.chatsListener();
    
        try {
            this.chatsListener = this.db
                .collection('chats')
                .where(`participants.${this.currentUser.uid}.uid`, '==', this.currentUser.uid)
                .orderBy('updatedAt', 'desc')
                .onSnapshot(async snapshot => {
                    this.chatList.innerHTML = ''; // Limpiar lista actual
                    
                    if (snapshot.empty) {
                        // Mostrar mensaje cuando no hay chats
                        this.chatList.innerHTML = `
                            <div class="no-chats-message">
                                <i class="fas fa-comments"></i>
                                <p>No tienes conversaciones aún</p>
                                <small>Haz clic en el botón + para comenzar un chat</small>
                            </div>
                        `;
                        return;
                    }
    
                    // Procesar cada chat
                    snapshot.forEach(doc => {
                        this.renderChatItem(doc.id, doc.data());
                    });
                }, error => {
                    console.error("Error loading chats:", error);
                    this.chatList.innerHTML = `
                        <div class="error-message">
                            <i class="fas fa-exclamation-circle"></i>
                            <p>Error al cargar los chats</p>
                        </div>
                    `;
                });
        } catch (error) {
            console.error("Error setting up chat listener:", error);
        }
    }
    
  
    
    // Método auxiliar para formatear el último mensaje
    formatLastMessage(lastMessage) {
        if (!lastMessage) return 'No hay mensajes';
        
        switch (lastMessage.type) {
            case 'text':
                return this.truncateText(lastMessage.content, 30);
            case 'image':
                return '📷 Imagen';
            case 'file':
                return '📎 Archivo';
            default:
                return 'Mensaje';
        }
    }
    
    // Método para truncar texto largo
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
  

 

    renderMessages(messages) {
        this.messagesContainer.innerHTML = '';
        messages.forEach(message => {
            const isSent = message.senderId === this.currentUser.uid;
            const template = `
                <div class="message ${isSent ? 'sent' : 'received'}">
                    ${!isSent ? `
                        <div class="message-avatar">
                            ${message.senderPhoto 
                                ? `<img src="${message.senderPhoto}" alt="${message.senderName}" 
                                     onerror="this.onerror=null; this.src='../img/default-avatar.png';">` 
                                : this.createInitialsAvatar(message.senderName)}
                        </div>
                    ` : ''}
                    <div class="message-wrapper">
                        ${!isSent ? `<span class="sender">${message.senderName}</span>` : ''}
                        <div class="message-content">
                            <p>${this.formatMessage(message)}</p>
                        </div>
                        <span class="message-time">
                            ${this.formatTime(message.timestamp)}
                        </span>
                    </div>
                </div>
            `;
            this.messagesContainer.insertAdjacentHTML('beforeend', template);
        });
        this.scrollToBottom();
    }

    async sendMessage() {
        if (!this.currentChat || !this.messageInput.value.trim()) return;
    
        try {
            // Obtener los datos del usuario actual desde Firestore
            const currentUserDoc = await this.db
                .collection('usuarios')
                .doc(this.currentUser.uid)
                .get();
            
            const currentUserData = currentUserDoc.data();
    
            // Obtener el chat actual para conocer al otro participante
            const chatDoc = await this.db.collection('chats').doc(this.currentChat).get();
            const chatData = chatDoc.data();
            const otherUserId = Object.keys(chatData.participants)
                .find(uid => uid !== this.currentUser.uid);
    
            const messageData = {
                content: this.messageInput.value.trim(),
                senderId: this.currentUser.uid,
                senderName: currentUserData.name || 'Usuario',
                senderPhoto: currentUserData.imageProfile || null,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                type: 'text'
            };
    
            // Agregar mensaje
            await this.db
                .collection(`chats/${this.currentChat}/messages`)
                .add(messageData);
    
            // Actualizar último mensaje del chat y estado de lectura
            await this.db.collection('chats').doc(this.currentChat).update({
                lastMessage: messageData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                // Marcar como leído para el remitente y no leído para el destinatario
                [`participants.${this.currentUser.uid}.lastRead`]: firebase.firestore.FieldValue.serverTimestamp(),
                [`participants.${otherUserId}.lastRead`]: null
            });
    
            this.messageInput.value = '';
            
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            Swal.fire('Error', 'No se pudo enviar el mensaje', 'error');
        }
    }
    
    getUnreadCount(chatData) {
        // Si el último mensaje es mío, no hay mensajes sin leer
        if (chatData.lastMessage?.senderId === this.currentUser.uid) {
            return 0;
        }
    
        const lastRead = chatData.participants[this.currentUser.uid]?.lastRead;
        if (!lastRead || !chatData.lastMessage) return 0;
    
        // Convertir timestamps a milisegundos para comparación
        const lastReadTime = lastRead.toMillis();
        const lastMessageTime = chatData.lastMessage.timestamp.toMillis();
    
        return lastMessageTime > lastReadTime ? 1 : 0;
    }

    async handleAttachment() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.pdf,.doc,.docx';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
    
            try {
                // Obtener datos del usuario actual
                const currentUserDoc = await this.db
                    .collection('usuarios')
                    .doc(this.currentUser.uid)
                    .get();
                
                const currentUserData = currentUserDoc.data();
    
                const storageRef = this.storage.ref(`chats/${this.currentChat}/${Date.now()}_${file.name}`);
                await storageRef.put(file);
                const url = await storageRef.getDownloadURL();
    
                const messageData = {
                    content: url,
                    type: file.type.startsWith('image/') ? 'image' : 'file',
                    fileName: file.name,
                    fileSize: file.size,
                    senderId: this.currentUser.uid,
                    senderName: currentUserData.name || 'Usuario',
                    senderPhoto: currentUserData.imageProfile || null,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                };
    
                // Agregar mensaje
                await this.db
                    .collection(`chats/${this.currentChat}/messages`)
                    .add(messageData);
    
                // Actualizar último mensaje del chat
                await this.db.collection('chats').doc(this.currentChat).update({
                    lastMessage: messageData,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
    
            } catch (error) {
                console.error('Error al subir archivo:', error);
                Swal.fire('Error', 'No se pudo subir el archivo', 'error');
            }
        };
    
        input.click();
    }

    // Utilidades
    formatTime(timestamp) {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    formatMessage(message) {
        switch (message.type) {
            case 'text':
                return message.content;
            case 'image':
                return `<img src="${message.content}" alt="Imagen" style="max-width: 200px;">`;
            case 'file':
                return `<a href="${message.content}" target="_blank">${message.fileName}</a>`;
            default:
                return message.content;
        }
    }

 

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    async markChatAsRead(chatId) {
        await this.db.collection('chats').doc(chatId).update({
            [`participants.${this.currentUser.uid}.lastRead`]: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    searchChats(query) {
        const items = this.chatList.querySelectorAll('.chat-item');
        items.forEach(item => {
            const name = item.querySelector('h2').textContent.toLowerCase();
            const visible = name.includes(query.toLowerCase());
            item.style.display = visible ? 'flex' : 'none';
        });
    }

    async showNewChatDialog() {
        const { value: email } = await Swal.fire({
            title: 'Nuevo Chat',
            input: 'email',
            inputLabel: 'Email del usuario',
            inputPlaceholder: 'Ingrese el email del usuario',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return 'Necesitas escribir un email!';
                }
            }
        });

        if (email) {
            try {
                const userQuery = await this.db
                    .collection('users')
                    .where('email', '==', email)
                    .get();

                if (userQuery.empty) {
                    Swal.fire('Error', 'Usuario no encontrado', 'error');
                    return;
                }

                const otherUser = userQuery.docs[0].data();
                await this.createChat(otherUser.uid);
            } catch (error) {
                console.error('Error al crear chat:', error);
                Swal.fire('Error', 'Error al crear el chat', 'error');
            }
        }
    }

  
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});