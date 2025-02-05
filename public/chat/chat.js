

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

        this.typingTimeout = null;

        this.selectedGroupUsers = new Set();

          // Set para mantener los usuarios seleccionados en la edición
    this.selectedEditUsers = new Set();
       
        this.usersCache = new Map(); // Asegurarnos de que esto está aquí

        this.setupGroupCreation();

        this.setupTypingIndicator();
    
        this.setupMobileUI();

        this.initializeApp();

        this.newGroupParticipantsModalEl = document.getElementById('newGroupParticipantsModal');
        this.addParticipantsModalEl = document.getElementById('addParticipantsModal');
        
        if (this.newGroupParticipantsModalEl) {
            this.newGroupParticipantsModal = new bootstrap.Modal(this.newGroupParticipantsModalEl);
        }
        if (this.addParticipantsModalEl) {
            this.addParticipantsModal = new bootstrap.Modal(this.addParticipantsModalEl);
        }

    }

    async initializeApp() {
        // Verificar autenticación
        this.auth.onAuthStateChanged(user => {
            if (user) {
                this.currentUser = user;
                this.setupEventListeners();
                this.loadChats();
                this.setupMobileUI();
                
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


    // Añadir este método para obtener datos de usuario
    async getUserData(userId) {
        // Primero intentar obtener del cache
        if (this.usersCache.has(userId)) {
            return this.usersCache.get(userId);
        }

        try {
            const userDoc = await this.db.collection('usuarios').doc(userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                // Guardar en cache
                this.usersCache.set(userId, userData);
                return userData;
            }
            return null;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    // Método para obtener el nombre del usuario
    getUserName(userId) {
        const userData = this.usersCache.get(userId);
        return userData ? userData.name : 'Usuario';
    }


    async showUsersModal() {
        try {
            // Resetear estado del grupo
            this.selectedGroupUsers.clear();
            document.getElementById('groupForm').reset();
            document.getElementById('groupImagePreview').src = '../img/default-group.png';
            document.getElementById('selectedUsers').innerHTML = '';
    
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

    setupTypingIndicator() {
        this.messageInput.addEventListener('input', () => {
            if (this.currentChat) {
                this.updateTypingStatus(true);
                
                clearTimeout(this.typingTimeout);
                this.typingTimeout = setTimeout(() => {
                    this.updateTypingStatus(false);
                }, 2000);
            }
        });
    }

    async updateTypingStatus(isTyping) {
        if (!this.currentChat) return;
        
        try {
            await this.db.collection('chats').doc(this.currentChat).update({
                [`participants.${this.currentUser.uid}.typing`]: isTyping
            });
        } catch (error) {
            console.error('Error updating typing status:', error);
        }
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
            // Validación inicial
            if (!userData || !userData.uid) {
                throw new Error('Datos de usuario inválidos');
            }
    
            console.log("Usuario seleccionado:", userData);
            
            const otherUserData = {
                uid: userData.uid,
                name: userData.name || 'Usuario',
                email: userData.email || '',
                photoURL: userData.imageProfile || null,
                userType: userData.userType || 'user',
                online: userData.onLine || false
            };
    
            // Mostrar indicador de carga
            const loadingToast = Swal.fire({
                title: 'Creando chat...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
    
            const chatRef = await this.createChat(otherUserData);
            
            await loadingToast.close();
    
            if (chatRef && chatRef.id) {
                this.usersModal.hide();
                await this.openChat(chatRef.id, otherUserData);
                
                if (window.innerWidth <= 768) {
                    this.hideSidebar();
                }
            } else {
                throw new Error('No se pudo crear el chat');
            }
    
        } catch (error) {
            console.error('Error al crear/abrir chat:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo crear el chat: ' + error.message
            });
        }
    }
    

    setupGroupCreation() {
        const groupForm = document.getElementById('groupForm');
        const groupImageInput = document.getElementById('groupImageInput');
        const changeGroupImage = document.getElementById('changeGroupImage');
        const addParticipantsBtn = document.getElementById('addParticipantsBtn');
        if (addParticipantsBtn) {
            addParticipantsBtn.addEventListener('click', () => {
                if (this.newGroupParticipantsModal) {
                    this.showNewGroupParticipantsModal();
                }
            });
        }


  
        
        // Evento para abrir modal de participantes
        addParticipantsBtn.addEventListener('click', () => {
            this.showNewGroupParticipantsModal();
        });

        // Evento para confirmar participantes seleccionados
        document.getElementById('confirmNewGroupParticipants').addEventListener('click', () => {
            this.confirmParticipantSelection();
        });

        // Evento para buscar participantes
        document.getElementById('newGroupSearchInput').addEventListener('input', (e) => {
            this.filterParticipants(e.target.value);
        });
        
        const imagePreviewWrapper = document.querySelector('.image-preview-wrapper');
      
        const groupImagePreview = document.getElementById('groupImagePreview');

        // Evento para abrir el selector de archivo al hacer clic en la imagen
        imagePreviewWrapper.addEventListener('click', () => {
            groupImageInput.click();
        });
        groupImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById('groupImagePreview').src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        

        // Evento para crear el grupo
        groupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createGroup();
        });
    }

   async createGroup() {
        try {
            if (this.selectedGroupUsers.size < 2) {
                throw new Error('Selecciona al menos 2 participantes');
            }

            const groupName = document.getElementById('groupName').value.trim();
            if (!groupName) {
                throw new Error('El nombre del grupo es requerido');
            }

            const loadingToast = Swal.fire({
                title: 'Creando grupo...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Subir imagen del grupo si existe
            let groupImageUrl = null;
            const groupImageInput = document.getElementById('groupImageInput');
            if (groupImageInput.files[0]) {
                const imageRef = this.storage.ref(`groups/${Date.now()}_${groupImageInput.files[0].name}`);
                await imageRef.put(groupImageInput.files[0]);
                groupImageUrl = await imageRef.getDownloadURL();
            }

            // Obtener datos del usuario actual
            const currentUserData = await this.getUserData(this.currentUser.uid);

            // Crear objeto con los participantes
            const participants = {};
            
            // Añadir usuario actual
            participants[this.currentUser.uid] = {
                uid: this.currentUser.uid,
                name: currentUserData?.name || this.currentUser.email,
                email: this.currentUser.email,
                photoURL: currentUserData?.imageProfile || null,
                role: 'admin',
                joined: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Añadir participantes seleccionados
            for (const userId of this.selectedGroupUsers) {
                const userData = await this.getUserData(userId);
                if (userData) {
                    participants[userId] = {
                        uid: userId,
                        name: userData.name || userData.email,
                        email: userData.email,
                        photoURL: userData.imageProfile || null,
                        role: 'member',
                        joined: firebase.firestore.FieldValue.serverTimestamp()
                    };
                }
            }

            // Crear el grupo en Firestore
            const groupData = {
                type: 'group',
                name: groupName,
                imageUrl: groupImageUrl,
                createdBy: this.currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                participants: participants,
                lastMessage: null
            };

            const groupRef = await this.db.collection('chats').add(groupData);

            await loadingToast.close();
            this.usersModal.hide();
            await this.openChat(groupRef.id, {
                name: groupName,
                photoURL: groupImageUrl,
                type: 'group'
            });

            Swal.fire('¡Éxito!', 'Grupo creado correctamente', 'success');

        } catch (error) {
            console.error('Error al crear grupo:', error);
            Swal.fire('Error', error.message, 'error');
        }
    }

    async showNewGroupParticipantsModal() {
        try {
            const modalContent = `
                <div class="modal fade" id="newGroupParticipantsModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Añadir Participantes</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="user-search mb-3">
                                    <input type="text" class="form-control" id="newGroupSearchInput" 
                                           placeholder="Buscar usuarios...">
                                </div>
                                <div class="participants-list" id="newGroupParticipantsList">
                                    <!-- Lista de usuarios -->
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn btn-primary" id="confirmNewGroupParticipants">
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
    
            // Eliminar modal anterior si existe
            const existingModal = document.getElementById('newGroupParticipantsModal');
            if (existingModal) existingModal.remove();
    
            document.body.insertAdjacentHTML('beforeend', modalContent);
            
            const participantsList = document.getElementById('newGroupParticipantsList');
            participantsList.innerHTML = '<div class="text-center p-3"><div class="spinner-border text-primary" role="status"></div></div>';
    
            const usersSnapshot = await this.db
                .collection('usuarios')
                .where('uid', '!=', this.currentUser.uid)
                .get();
    
            if (usersSnapshot.empty) {
                participantsList.innerHTML = '<div class="text-center p-3">No hay usuarios disponibles</div>';
            } else {
                participantsList.innerHTML = '';
                usersSnapshot.forEach(doc => {
                    const userData = doc.data();
                    if (userData && userData.uid) {
                        const participantHTML = this.renderParticipantItem(userData);
                        participantsList.insertAdjacentHTML('beforeend', participantHTML);
                    }
                });
            }
    
            // Configurar eventos
            document.getElementById('newGroupSearchInput').addEventListener('input', (e) => {
                this.filterParticipants(e.target.value);
            });
    
            document.querySelectorAll('#newGroupParticipantsList .participant-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.toggleParticipant(item);
                    this.updateSelectedUsersUI();
                });
            });
    
            document.getElementById('confirmNewGroupParticipants').addEventListener('click', () => {
                if (this.selectedGroupUsers.size === 0) {
                    Swal.fire('Aviso', 'Selecciona al menos un participante', 'warning');
                    return;
                }
                const modal = bootstrap.Modal.getInstance(document.getElementById('newGroupParticipantsModal'));
                modal.hide();
                this.updateSelectedUsersUI();
            });
    
            const modal = new bootstrap.Modal(document.getElementById('newGroupParticipantsModal'));
            modal.show();
    
        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
        }
    }
    


async showEditParticipantsModal(chatId) {
    try {
        const chatDoc = await this.db.collection('chats').doc(chatId).get();
        const chatData = chatDoc.data();
        const currentParticipants = Object.keys(chatData.participants || {});

        const modalContent = `
            <div class="modal fade" id="editParticipantsModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Añadir Participantes</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="user-search mb-3">
                                <input type="text" class="form-control" id="editParticipantSearchInput" 
                                       placeholder="Buscar usuarios...">
                            </div>
                            
                            <div class="participants-list" id="editParticipantsList">
                                <!-- Lista de usuarios -->
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="confirmEditParticipants">
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Eliminar modal anterior si existe
        const existingModal = document.getElementById('editParticipantsModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalContent);
        
        const participantsList = document.getElementById('editParticipantsList');
        participantsList.innerHTML = '<div class="text-center p-3"><div class="spinner-border text-primary" role="status"></div></div>';

        const usersSnapshot = await this.db
            .collection('usuarios')
            .where('uid', 'not-in', [...currentParticipants])
            .get();

        if (usersSnapshot.empty) {
            participantsList.innerHTML = '<div class="text-center p-3">No hay usuarios disponibles para añadir</div>';
        } else {
            participantsList.innerHTML = '';
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                if (userData && userData.uid) {
                    const participantHTML = this.renderEditParticipantItem(userData);
                    participantsList.insertAdjacentHTML('beforeend', participantHTML);
                }
            });
        }

        // Configurar eventos
        document.getElementById('editParticipantSearchInput').addEventListener('input', (e) => {
            this.filterEditParticipants(e.target.value);
        });

        document.querySelectorAll('#editParticipantsList .participant-item').forEach(item => {
            item.addEventListener('click', () => {
                this.toggleEditParticipant(item);
            });
        });

        document.getElementById('confirmEditParticipants').addEventListener('click', () => {
            if (this.confirmEditParticipantSelection()) {
                // Solo actualizar la vista previa y cerrar el modal
                this.updateEditSelectedUsersUI();
                const modal = bootstrap.Modal.getInstance(document.getElementById('editParticipantsModal'));
                modal.hide();
            }
        });

        const modal = new bootstrap.Modal(document.getElementById('editParticipantsModal'));
        modal.show();

    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
    }
}

renderEditParticipantItem(userData) {
    const isSelected = this.selectedEditUsers.has(userData.uid);
    return `
        <div class="participant-item ${isSelected ? 'selected' : ''}" data-user-id="${userData.uid}" data-user-name="${userData.name}">
            <div class="d-flex align-items-center p-2">
                <div class="avatar-container me-2">
                    ${userData.imageProfile 
                        ? `<img src="${userData.imageProfile}" alt="${userData.name}">`
                        : this.createInitialsAvatar(userData.name)}
                </div>
                <div class="user-info flex-grow-1">
                    <h3 class="mb-0">${userData.name || 'Usuario'}</h3>
                    
                </div>
                <div class="selection-indicator">
                    <i class="fas ${isSelected ? 'fa-check-circle text-primary' : 'fa-circle'}"></i>
                </div>
            </div>
        </div>
    `;
}

toggleEditParticipant(participantElement) {
    const userId = participantElement.dataset.userId;
    
    if (this.selectedEditUsers.has(userId)) {
        this.selectedEditUsers.delete(userId);
        participantElement.classList.remove('selected');
        participantElement.querySelector('.fas').className = 'fas fa-circle';
    } else {
        this.selectedEditUsers.add(userId);
        participantElement.classList.add('selected');
        participantElement.querySelector('.fas').className = 'fas fa-check-circle text-primary';
    }
    
    this.updateEditSelectedUsersUI();
}

updateEditSelectedUsersUI() {
    const container = document.getElementById('editSelectedUsersPreview');
    if (!container) return;

    container.innerHTML = '';
    this.selectedEditUsers.forEach(userId => {
        const participantElement = document.querySelector(`.participant-item[data-user-id="${userId}"]`);
        const userName = participantElement?.dataset.userName || 'Usuario';
        
        const chip = document.createElement('div');
        chip.className = 'selected-user-chip';
        chip.innerHTML = `
            <span>${userName}</span>
            <span class="remove-user" data-user-id="${userId}">×</span>
        `;
        container.appendChild(chip);
    });

    container.querySelectorAll('.remove-user').forEach(removeBtn => {
        removeBtn.addEventListener('click', (e) => {
            const userId = e.target.dataset.userId;
            this.selectedEditUsers.delete(userId);
            const participantElement = document.querySelector(`.participant-item[data-user-id="${userId}"]`);
            if (participantElement) {
                participantElement.classList.remove('selected');
                participantElement.querySelector('.fas').className = 'fas fa-circle';
            }
            this.updateEditSelectedUsersUI();
        });
    });
}

filterEditParticipants(query) {
    const searchTerm = query.toLowerCase();
    document.querySelectorAll('#editParticipantsList .participant-item').forEach(item => {
        const name = item.querySelector('h3').textContent.toLowerCase();
        const email = item.querySelector('p').textContent.toLowerCase();
        item.style.display = 
            name.includes(searchTerm) || email.includes(searchTerm) 
                ? 'block' 
                : 'none';
    });
}

confirmEditParticipantSelection() {
    if (this.selectedEditUsers.size === 0) {
        Swal.fire('Error', 'Selecciona al menos un participante', 'warning');
        return false;
    }
    return true;
}
    

    renderParticipantItem(userData) {
        const isSelected = this.selectedGroupUsers.has(userData.uid);
        return `
            <div class="participant-item ${isSelected ? 'selected' : ''}" data-user-id="${userData.uid}" data-user-name="${userData.name}">
                <div class="d-flex align-items-center p-2">
                    <div class="avatar-container me-2">
                        ${userData.imageProfile 
                            ? `<img src="${userData.imageProfile}" alt="${userData.name}">`
                            : this.createInitialsAvatar(userData.name)}
                    </div>
                    <div class="user-info flex-grow-1">
                        <h3 class="mb-0">${userData.name || 'Usuario'}</h3>
                        <p class="mb-0 text-muted small">${userData.email}</p>
                    </div>
                    <div class="selection-indicator">
                        <i class="fas ${isSelected ? 'fa-check-circle text-primary' : 'fa-circle'}"></i>
                    </div>
                </div>
            </div>
        `;
    }

    toggleParticipant(participantElement) {
        const userId = participantElement.dataset.userId;
        const userName = participantElement.dataset.userName;
        
        if (this.selectedGroupUsers.has(userId)) {
            this.selectedGroupUsers.delete(userId);
            participantElement.classList.remove('selected');
            participantElement.querySelector('.fas').className = 'fas fa-circle';
        } else {
            this.selectedGroupUsers.add(userId);
            participantElement.classList.add('selected');
            participantElement.querySelector('.fas').className = 'fas fa-check-circle text-primary';
        }
    }

    confirmParticipantSelection() {
        if (this.selectedGroupUsers.size < 2) {
            Swal.fire('Error', 'Selecciona al menos 2 participantes', 'warning');
            return;
        }

        this.updateSelectedUsersUI();
     
    }

    updateSelectedUsersUI() {
        const container = document.getElementById('selectedUsers');
        container.innerHTML = '';

        this.selectedGroupUsers.forEach(userId => {
            const participantElement = document.querySelector(`.participant-item[data-user-id="${userId}"]`);
            const userName = participantElement?.dataset.userName || 'Usuario';
            
            const chip = document.createElement('div');
            chip.className = 'selected-user-chip';
            chip.innerHTML = `
                <span>${userName}</span>
                <span class="remove-user" data-user-id="${userId}">×</span>
            `;
            container.appendChild(chip);
        });

        // Añadir eventos para remover usuarios
        container.querySelectorAll('.remove-user').forEach(removeBtn => {
            removeBtn.addEventListener('click', (e) => {
                const userId = e.target.dataset.userId;
                this.selectedGroupUsers.delete(userId);
                this.updateSelectedUsersUI();
            });
        });
    }

    filterParticipants(query) {
        const searchTerm = query.toLowerCase();
        document.querySelectorAll('.participant-item').forEach(item => {
            const name = item.querySelector('h3').textContent.toLowerCase();
            const email = item.querySelector('p').textContent.toLowerCase();
            item.style.display = 
                name.includes(searchTerm) || email.includes(searchTerm) 
                    ? 'block' 
                    : 'none';
        });
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
    
        async openChat(chatId, chatInfo = null) {
            try {
                console.log("Abriendo chat:", chatId, chatInfo);
                this.currentChat = chatId;
        
                // Si no tenemos la información del chat, la obtenemos
                if (!chatInfo) {
                    const chatDoc = await this.db.collection('chats').doc(chatId).get();
                    if (!chatDoc.exists) {
                        throw new Error('Chat no encontrado');
                    }
                    const chatData = chatDoc.data();
        
                    if (chatData.type === 'group') {
                        chatInfo = {
                            type: 'group',
                            name: chatData.name,
                            photoURL: chatData.imageUrl, // Asegúrate de que este campo coincida con tu estructura de datos
                            participantsCount: Object.keys(chatData.participants).length,
                            isAdmin: chatData.participants[this.currentUser.uid]?.role === 'admin'
                        };
                    } else {
                        const otherUserId = Object.keys(chatData.participants)
                            .find(uid => uid !== this.currentUser.uid);
                        const otherParticipant = chatData.participants[otherUserId];
                        chatInfo = {
                            type: 'direct',
                            name: otherParticipant.name,
                            photoURL: otherParticipant.photoURL || otherParticipant.imageProfile,
                            online: otherParticipant.online || false
                        };
                    }
                }
        
                // Guardar información del chat actual
                this.currentChatInfo = {
                    ...chatInfo,
                    id: chatId
                };
        
                // Actualizar UI
                this.updateChatHeader(this.currentChatInfo);
        
                // Actualizar chat activo en la lista
                document.querySelectorAll('.chat-item').forEach(item => {
                    item.classList.remove('active');
                });
                
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
                let name, photoURL, online;
        
                if (chatData.type === 'group') {
                    // Para grupos
                    name = chatData.name;
                    photoURL = chatData.imageUrl;
                    online = false; // Los grupos no tienen estado "online"
                } else {
                    // Para chats individuales
                    const otherParticipantId = Object.keys(chatData.participants)
                        .find(uid => uid !== this.currentUser.uid);
                    const otherParticipant = chatData.participants[otherParticipantId];
        
                    if (!otherParticipant) {
                        console.error('No se encontró al otro participante');
                        return;
                    }
        
                    name = otherParticipant.name;
                    photoURL = otherParticipant.photoURL;
                    online = otherParticipant.online;
                }
        
                const lastMessageTime = chatData.lastMessage?.timestamp 
                    ? this.formatTime(chatData.lastMessage.timestamp)
                    : '';
        
                // Avatar
                const avatarHTML = photoURL
                    ? `<img src="${photoURL}" alt="${name}" onerror="this.onerror=null; this.src='../img/default-avatar.png';">`
                    : this.createInitialsAvatar(name);
        
                const template = `
                    <div class="chat-item ${this.currentChat === chatId ? 'active' : ''}" data-chat-id="${chatId}">
                        <div class="avatar-container">
                            ${avatarHTML}
                            ${chatData.type !== 'group' ? `<span class="status-dot ${online ? 'online' : ''}"></span>` : ''}
                        </div>
                        <div class="chat-info">
                            <h2>${name}</h2>
                            <p class="last-message">
                                ${chatData.type === 'group' && chatData.lastMessage ? 
                                    `${chatData.lastMessage.senderName}: ${this.formatLastMessage(chatData.lastMessage)}` :
                                    this.formatLastMessage(chatData.lastMessage)}
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
        
        updateChatHeader(chatInfo) {
            const isGroup = chatInfo.type === 'group';
            
            // Preparar la información del estado
            let statusText = '';
            if (isGroup) {
                statusText = `${chatInfo.participantsCount || 0} participantes`;
            } else {
                statusText = chatInfo.online ? 'En línea' : 'Desconectado';
            }
        
            const headerTemplate = `
                <div class="d-flex align-items-center w-100">
                    <button class="back-to-list-btn d-md-none">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <div class="user-info flex-grow-1 d-flex align-items-center">
                        <div class="avatar-container">
                            ${chatInfo.photoURL 
                                ? `<img src="${chatInfo.photoURL}" alt="${chatInfo.name}" 
                                     onerror="this.onerror=null; this.src='${isGroup ? '../img/default-group.png' : '../img/default-avatar.png'}';">` 
                                : this.createInitialsAvatar(chatInfo.name)}
                        </div>
                        <div class="ms-2">
                            <h2 class="mb-0">${chatInfo.name}</h2>
                            <span class="status">${statusText}</span>
                        </div>
                    </div>
                    <div class="chat-actions">
                        ${!isGroup ? `
                           
                        ` : ''}
                        <div class="dropdown">
                            <button class="action-btn" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                ${isGroup ? `
                                    <li><a class="dropdown-item" href="#" id="viewParticipants">
                                        <i class="fas fa-users"></i> Ver participantes
                                    </a></li>
                                    ${chatInfo.isAdmin ? `
                                        <li><a class="dropdown-item" href="#" id="editGroup">
                                            <i class="fas fa-edit"></i> Editar grupo
                                        </a></li>
                                    ` : ''}
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item text-danger" href="#" id="leaveGroup">
                                        <i class="fas fa-sign-out-alt"></i> Salir del grupo
                                    </a></li>
                                ` : `
                                    <li><a class="dropdown-item text-danger" href="#" id="blockUser">
                                        <i class="fas fa-ban"></i> Bloquear usuario
                                    </a></li>
                                `}
                            </ul>
                        </div>
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
        
                // Si es un grupo, añadir eventos para las opciones del menú
                if (isGroup) {
                    const viewParticipants = header.querySelector('#viewParticipants');
                    if (viewParticipants) {
                        viewParticipants.addEventListener('click', (e) => {
                            e.preventDefault();
                            this.showGroupParticipants(chatInfo.id);
                        });
                    }
        
                    if (chatInfo.isAdmin) {
                        const editGroup = header.querySelector('#editGroup');
                        if (editGroup) {
                            editGroup.addEventListener('click', (e) => {
                                e.preventDefault();
                                this.showEditGroupDialog(chatInfo.id);
                            });
                        }
                    }
        
                    const leaveGroup = header.querySelector('#leaveGroup');
                    if (leaveGroup) {
                        leaveGroup.addEventListener('click', (e) => {
                            e.preventDefault();
                            this.confirmLeaveGroup(chatInfo.id);
                        });
                    }
                }
            }
        }


        // Función para mostrar los participantes del grupo
        async showGroupParticipants(chatId) {
            try {
                const chatDoc = await this.db.collection('chats').doc(chatId).get();
                const chatData = chatDoc.data();
                const participants = chatData.participants;
                const currentUserIsAdmin = participants[this.currentUser.uid]?.role === 'admin';
        
                const participantsList = Object.entries(participants).map(([uid, data]) => ({
                    uid,
                    ...data
                }));
        
                const modalContent = `
                    <div class="modal fade" id="participantsModal" tabindex="-1">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Participantes del grupo</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="participants-list">
                                        ${participantsList.map(participant => `
                                            <div class="participant-item d-flex align-items-center p-2">
                                                <div class="avatar-container me-2">
                                                    ${participant.photoURL 
                                                        ? `<img src="${participant.photoURL}" alt="${participant.name}">` 
                                                        : this.createInitialsAvatar(participant.name)}
                                                </div>
                                                <div class="participant-info flex-grow-1">
                                                    <div class="participant-name">${participant.name}</div>
                                                    <small class="text-muted">${participant.role === 'admin' ? 'Administrador' : 'Participante'}</small>
                                                </div>
                                                ${currentUserIsAdmin && participant.uid !== this.currentUser.uid ? `
                                                    <div class="dropdown">
                                                        <button class="btn btn-link" data-bs-toggle="dropdown">
                                                            <i class="fas fa-ellipsis-v"></i>
                                                        </button>
                                                        <ul class="dropdown-menu">
                                                            <li><a class="dropdown-item toggle-admin-role" href="#" data-participant-id="${participant.uid}">
                                                                ${participant.role === 'admin' ? 'Remover admin' : 'Hacer admin'}
                                                            </a></li>
                                                            <li><a class="dropdown-item text-danger remove-participant" href="#" data-participant-id="${participant.uid}">
                                                                Eliminar del grupo
                                                            </a></li>
                                                        </ul>
                                                    </div>
                                                ` : ''}
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
        
                // Eliminar modal anterior si existe
                const existingModal = document.getElementById('participantsModal');
                if (existingModal) {
                    existingModal.remove();
                }
        
                // Añadir nuevo modal al DOM
                document.body.insertAdjacentHTML('beforeend', modalContent);
                
                // Agregar eventos después de insertar el modal
                const modal = document.getElementById('participantsModal');
                
                // Evento para toggle admin
                modal.querySelectorAll('.toggle-admin-role').forEach(button => {
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        const participantId = e.target.dataset.participantId;
                        this.toggleParticipantRole(chatId, participantId);
                    });
                });
        
                // Evento para eliminar participante
                modal.querySelectorAll('.remove-participant').forEach(button => {
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        const participantId = e.target.dataset.participantId;
                        this.removeParticipant(chatId, participantId);
                    });
                });
        
                const modalInstance = new bootstrap.Modal(modal);
                modalInstance.show();
        
            } catch (error) {
                console.error('Error al mostrar participantes:', error);
                Swal.fire('Error', 'No se pudieron cargar los participantes', 'error');
            }
        }

// Función para editar el grupo
async showEditGroupDialog(chatId) {
    try {
        const chatDoc = await this.db.collection('chats').doc(chatId).get();
        const chatData = chatDoc.data();

        if (chatData.participants[this.currentUser.uid]?.role !== 'admin') {
            throw new Error('No tienes permisos para editar el grupo');
        }

        const modalContent = `
            <div class="modal fade" id="editGroupModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Editar Grupo</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editGroupForm">
                                <div class="mb-4 text-center">
                                    <div class="group-image-container position-relative mx-auto">
                                        <div class="image-preview-wrapper" id="editImagePreviewWrapper">
                                            <img src="${chatData.imageUrl || '../img/default-group.png'}" 
                                                 class="rounded-circle preview-image" 
                                                 id="editGroupImagePreview">
                                            <div class="image-overlay">
                                                <i class="fas fa-camera"></i>
                                                <span>Cambiar imagen</span>
                                            </div>
                                        </div>
                                        <input type="file" hidden id="editGroupImageInput" accept="image/*">
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Nombre del grupo</label>
                                    <input type="text" class="form-control" id="editGroupName" value="${chatData.name}" required>
                                </div>
                              
<div class="mb-3">
    <label class="form-label">Participantes</label>
    <div class="selected-users-container mb-2" id="editSelectedUsersPreview">
        <!-- Aquí se mostrarán los usuarios seleccionados -->
    </div>
    <button type="button" class="btn btn-outline-primary btn-sm w-100" id="editAddParticipantsBtn">
        <i class="fas fa-user-plus"></i> Añadir participantes
    </button>
</div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="editSaveGroupChangesBtn">
                                Guardar cambios
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Eliminar modal anterior si existe
        const existingModal = document.getElementById('editGroupModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalContent);

        const modal = new bootstrap.Modal(document.getElementById('editGroupModal'));
        modal.show();

        // Configurar eventos con los nuevos IDs
        const imagePreviewWrapper = document.getElementById('editImagePreviewWrapper');
        const groupImageInput = document.getElementById('editGroupImageInput');
        const groupImagePreview = document.getElementById('editGroupImagePreview');

        // Evento para abrir el selector de archivo
        if (imagePreviewWrapper) {
            imagePreviewWrapper.addEventListener('click', () => {
                console.log('Click en imagen de edición'); // Debug
                groupImageInput.click();
            });
        }

        // Evento para previsualizar la imagen
        if (groupImageInput) {
            groupImageInput.addEventListener('change', (e) => {
                console.log('Archivo seleccionado en edición'); // Debug
                const file = e.target.files[0];
                if (file) {
                    if (!file.type.startsWith('image/')) {
                        Swal.fire('Error', 'Por favor selecciona una imagen válida', 'error');
                        return;
                    }

                    const maxSize = 5 * 1024 * 1024; // 5MB
                    if (file.size > maxSize) {
                        Swal.fire('Error', 'La imagen es demasiado grande. Máximo 5MB', 'error');
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = (event) => {
                        console.log('Imagen cargada en edición'); // Debug
                        groupImagePreview.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Configurar otros botones
        document.getElementById('editSaveGroupChangesBtn').addEventListener('click', () => {
            this.saveGroupChanges(chatId);
        });

        document.getElementById('editAddParticipantsBtn').addEventListener('click', () => {
            this.showEditParticipantsModal(chatId);
        });

    } catch (error) {
        console.error('Error al mostrar diálogo de edición:', error);
        Swal.fire('Error', error.message, 'error');
    }
}

// Función para guardar los cambios del grupo
async saveGroupChanges(chatId) {
    try {
        const newName = document.getElementById('editGroupName').value.trim();
        const imageInput = document.getElementById('editGroupImageInput');
        const file = imageInput.files[0];

        if (!newName) {
            Swal.fire('Error', 'El nombre del grupo no puede estar vacío', 'error');
            return;
        }

        // Mostrar loading
        Swal.fire({
            title: 'Guardando cambios...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const updates = {
            name: newName,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Si hay una nueva imagen, subirla
        if (file) {
            const imageUrl = await this.uploadGroupImage(file, chatId);
            updates.imageUrl = imageUrl;
        }

        // Agregar nuevos participantes si hay alguno seleccionado
        if (this.selectedEditUsers.size > 0) {
            const batch = this.db.batch();
            const chatRef = this.db.collection('chats').doc(chatId);
            
            for (const uid of this.selectedEditUsers) {
                const participantElement = document.querySelector(`.participant-item[data-user-id="${uid}"]`);
                const userName = participantElement?.dataset.userName || 'Usuario';
                
                updates[`participants.${uid}`] = {
                    uid: uid,
                    name: userName,
                    role: 'member',
                    joined: firebase.firestore.FieldValue.serverTimestamp()
                };
            }
        }

        // Actualizar el documento
        await this.db.collection('chats').doc(chatId).update(updates);

        // Limpiar selección después de guardar
        this.selectedEditUsers.clear();
        
        // Cerrar el modal y mostrar mensaje de éxito
        const modal = bootstrap.Modal.getInstance(document.getElementById('editGroupModal'));
        modal.hide();
        
        Swal.fire('¡Éxito!', 'Los cambios se guardaron correctamente', 'success');

    } catch (error) {
        console.error('Error al guardar cambios:', error);
        Swal.fire('Error', 'No se pudieron guardar los cambios', 'error');
    }
}

// Funciones auxiliares para gestión de participantes
async toggleParticipantRole(chatId, participantId) {
    try {
        const chatDoc = await this.db.collection('chats').doc(chatId).get();
        const chatData = chatDoc.data();
        
        // Verificar que el usuario actual es admin
        if (chatData.participants[this.currentUser.uid].role !== 'admin') {
            throw new Error('No tienes permisos para realizar esta acción');
        }

        const currentRole = chatData.participants[participantId].role;
        const newRole = currentRole === 'admin' ? 'member' : 'admin';

        await this.db.collection('chats').doc(chatId).update({
            [`participants.${participantId}.role`]: newRole
        });

        // Recargar modal de participantes
        this.showGroupParticipants(chatId);

    } catch (error) {
        console.error('Error al cambiar rol:', error);
        Swal.fire('Error', error.message, 'error');
    }
}

async removeParticipant(chatId, participantId) {
    try {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "El participante será eliminado del grupo",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            const chatDoc = await this.db.collection('chats').doc(chatId).get();
            const chatData = chatDoc.data();
            
            // Verificar que el usuario actual es admin
            if (chatData.participants[this.currentUser.uid].role !== 'admin') {
                throw new Error('No tienes permisos para realizar esta acción');
            }

            // Eliminar participante
            const participants = { ...chatData.participants };
            delete participants[participantId];

            await this.db.collection('chats').doc(chatId).update({
                participants: participants
            });

            // Cerrar el modal actual
            const currentModal = bootstrap.Modal.getInstance(document.getElementById('participantsModal'));
            if (currentModal) {
                currentModal.hide();
                
                // Remover el backdrop manualmente
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) {
                    backdrop.remove();
                }
                
                // Restaurar el scroll del body si es necesario
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }

            // Mostrar mensaje de éxito
            await Swal.fire({
                icon: 'success',
                title: 'Participante eliminado',
                showConfirmButton: false,
                timer: 1500
            });

            // Recargar el chat con los cambios actualizados
            const updatedChatDoc = await this.db.collection('chats').doc(chatId).get();
            const updatedChatData = updatedChatDoc.data();
            
            // Actualizar la UI con los nuevos datos
            await this.openChat(chatId, {
                type: 'group',
                name: updatedChatData.name,
                photoURL: updatedChatData.imageUrl,
                participantsCount: Object.keys(updatedChatData.participants).length,
                isAdmin: updatedChatData.participants[this.currentUser.uid]?.role === 'admin'
            });

            // Actualizar la lista de chats
            this.loadChats();

            // Volver a mostrar el modal de participantes con la lista actualizada
            setTimeout(() => {
                this.showGroupParticipants(chatId);
            }, 100);
        }
    } catch (error) {
        console.error('Error al eliminar participante:', error);
        Swal.fire('Error', error.message, 'error');
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

    // Mostrar la lista de chats automáticamente en vista móvil
    if (window.innerWidth <= 768) {
        this.showSidebar();
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
        // Usar DocumentFragment para mejor rendimiento
        const fragment = document.createDocumentFragment();
        let lastSenderId = null;
        
        messages.forEach((message, index) => {
            const isSent = message.senderId === this.currentUser.uid;
            const showAvatar = !isSent && lastSenderId !== message.senderId;
            
            const messageElement = document.createElement('div');
            messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
            
            messageElement.innerHTML = `
                ${showAvatar ? `
                    <div class="message-avatar">
                        ${message.senderPhoto 
                            ? `<img src="${message.senderPhoto}" alt="${message.senderName}" 
                                 onerror="this.onerror=null; this.src='../img/default-avatar.png';">` 
                            : this.createInitialsAvatar(message.senderName)}
                    </div>
                ` : ''}
                <div class="message-wrapper">
                    ${!isSent && showAvatar ? `<span class="sender">${message.senderName}</span>` : ''}
                    <div class="message-content">
                        <p>${this.formatMessage(message)}</p>
                    </div>
                    <span class="message-time">
                        ${this.formatTime(message.timestamp)}
                    </span>
                </div>
            `;
            
            fragment.appendChild(messageElement);
            lastSenderId = message.senderId;
        });
    
        this.messagesContainer.innerHTML = '';
        this.messagesContainer.appendChild(fragment);
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
        input.accept = 'image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
    
            console.log('Archivo seleccionado:', file); // Debug
    
            // Validar tamaño (10MB máximo)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                Swal.fire('Error', 'El archivo es demasiado grande. Máximo 10MB', 'error');
                return;
            }
    
            let uploadingModal;
            try {
                uploadingModal = Swal.fire({
                    title: 'Subiendo archivo...',
                    text: 'Por favor espere...',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    showConfirmButton: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
    
                console.log('Obteniendo datos del usuario...'); // Debug
                const currentUserDoc = await this.db
                    .collection('usuarios')
                    .doc(this.currentUser.uid)
                    .get();
                
                const currentUserData = currentUserDoc.data();
                console.log('Datos del usuario obtenidos'); // Debug
    
                // Crear referencia en Storage
                console.log('Iniciando subida a Storage...'); // Debug
                const fileName = `${Date.now()}_${file.name}`;
                const storageRef = this.storage.ref(`chats/${this.currentChat}/${fileName}`);
    
                // Subir archivo con control de progreso
                const uploadTask = storageRef.put(file);
                
                uploadTask.on('state_changed', 
                    (snapshot) => {
                        // Progreso de la subida
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log('Progreso de subida: ', progress); // Debug
                        Swal.update({
                            title: 'Subiendo archivo...',
                            text: `Progreso: ${Math.round(progress)}%`
                        });
                    },
                    (error) => {
                        // Error en la subida
                        console.error('Error en la subida:', error);
                        throw error;
                    }
                );
    
                // Esperar a que termine la subida
                await uploadTask;
                console.log('Archivo subido exitosamente'); // Debug
    
                // Obtener URL de descarga
                const url = await storageRef.getDownloadURL();
                console.log('URL obtenida:', url); // Debug
    
                // Determinar el tipo de archivo
                let type = 'file';
                if (file.type.startsWith('image/')) {
                    type = 'image';
                } else if (file.type.startsWith('video/')) {
                    type = 'video';
                }
    
                const messageData = {
                    content: url,
                    type: type,
                    fileName: file.name,
                    fileSize: file.size,
                    senderId: this.currentUser.uid,
                    senderName: currentUserData.name || 'Usuario',
                    senderPhoto: currentUserData.imageProfile || null,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                };
    
                console.log('Guardando mensaje en Firestore...'); // Debug
                await this.db
                    .collection(`chats/${this.currentChat}/messages`)
                    .add(messageData);
    
                console.log('Actualizando chat...'); // Debug
                await this.db.collection('chats').doc(this.currentChat).update({
                    lastMessage: messageData,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
    
                console.log('Proceso completado exitosamente'); // Debug
                await Swal.fire({
                    icon: 'success',
                    title: 'Archivo subido correctamente',
                    showConfirmButton: false,
                    timer: 1500
                });
    
            } catch (error) {
                console.error('Error detallado:', error);
                await Swal.fire({
                    icon: 'error',
                    title: 'Error al subir el archivo',
                    text: error.message || 'Ocurrió un error inesperado',
                    confirmButtonText: 'OK'
                });
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
                return `
                    <div class="message-media">
                        <img src="${message.content}" 
                             alt="Imagen" 
                             class="message-image"
                             onclick="window.chatApp.openMediaViewer('${message.content}', 'image')"
                             style="max-width: 300px; width: auto; height: auto; border-radius: 8px; cursor: pointer;">
                    </div>`;
                
            case 'video':
                return `
                    <div class="message-media">
                        <video controls style="max-width: 300px; width: 100%; border-radius: 8px;">
                            <source src="${message.content}" type="video/mp4">
                            Tu navegador no soporta videos.
                        </video>
                    </div>`;
                
            case 'file':
                const fileExtension = message.fileName.split('.').pop().toLowerCase();
                const isPDF = fileExtension === 'pdf';
                
                return `
                    <div class="message-file" style="display: flex; align-items: center; gap: 10px; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 8px;">
                        <i class="fas ${isPDF ? 'fa-file-pdf' : 'fa-file'}" style="font-size: 24px;"></i>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${message.fileName}
                            </div>
                            ${message.fileSize ? 
                                `<div style="font-size: 12px; opacity: 0.7;">
                                    ${this.formatFileSize(message.fileSize)}
                                </div>` 
                                : ''}
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <a href="${message.content}" 
                               target="_blank" 
                               style="color: inherit; padding: 5px; border-radius: 4px; text-decoration: none;">
                                <i class="fas fa-external-link-alt"></i>
                            </a>
                            <a href="${message.content}" 
                               download="${message.fileName}"
                               style="color: inherit; padding: 5px; border-radius: 4px; text-decoration: none;">
                                <i class="fas fa-download"></i>
                            </a>
                        </div>
                    </div>`;
                
            default:
                return message.content;
        }
    }
    
    // Método para abrir el visor de imágenes
    openMediaViewer(url, type) {
        if (type === 'image') {
            Swal.fire({
                imageUrl: url,
                imageAlt: 'Imagen',
                showConfirmButton: false,
                showCloseButton: true,
                width: '90%',
                padding: 0,
                customClass: {
                    image: 'swal2-full-image',
                    closeButton: 'swal2-close-button'
                },
                didOpen: (modal) => {
                    // Añadir estilos específicos al modal
                    const modalContent = modal.querySelector('.swal2-popup');
                    modalContent.style.padding = '0';
                    modalContent.style.background = 'transparent';
                    
                    const image = modal.querySelector('.swal2-image');
                    image.style.maxWidth = '100%';
                    image.style.maxHeight = '90vh';
                    image.style.margin = '0';
                    
                    const closeButton = modal.querySelector('.swal2-close');
                    closeButton.style.position = 'fixed';
                    closeButton.style.right = '20px';
                    closeButton.style.top = '20px';
                    closeButton.style.color = 'white';
                    closeButton.style.fontSize = '28px';
                }
            });
        }
    }
    
    formatFileSize(bytes) {
        if (!bytes) return '';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
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