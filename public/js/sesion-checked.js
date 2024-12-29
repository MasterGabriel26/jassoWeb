// Firebase configuration
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', (event) => {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            const userId = user.uid;

            // Verify if the user is admin or asesor
            verifyUserAndDisplayInfo(userId);

           loadNotifications(userId);
        } else {
            // If not authenticated, redirect to login
            window.location.href = '/public/page-sign-in.html';
        }
    });
});

// Function to verify if the user is admin or asesor and display information
function verifyUserAndDisplayInfo(userId) {
    db.collection('usuarios').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                if (userData.userType === 'admin' || userData.userType === 'asesor') {
                    console.log('Usuario autorizado.');
                    displayUserInfo('nombreUsuario', 'imgPerfil', 'usuarios', userId);
                    localStorage.setItem('userType', userData.userType);
                } else {
                    console.warn('Usuario no autorizado. Cerrando sesión.');
                    logOutUser();
                }
            } else {
                console.error("No se encontró el documento del usuario.");
                logOutUser();
            }
        })
        .catch((error) => {
            console.error("Error verificando el tipo de usuario:", error);
            logOutUser();
        });
}

// Mostrar información del usuario
function displayUserInfo(nameSpanId, imgSpanId, collectionName, userId) {
    const nameSpan = document.getElementById(nameSpanId);
    const imgSpan = document.getElementById(imgSpanId);
    
    if (!nameSpan || !imgSpan) {
        console.error('No se encontraron los elementos necesarios');
        return;
    }
    
    db.collection(collectionName).doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                nameSpan.textContent = userData.name || "Usuario";
                
                if (userData.imageProfile) {
                    const img = document.createElement('img');
                    img.src = userData.imageProfile;
                    img.alt = userData.name || 'Foto de perfil';
                    img.className = 'avatar img-fluid rounded';
                    imgSpan.appendChild(img);
                } else {
                    createInitialsCanvas(imgSpan, userData.name);
                }
            } else {
                console.log("No se encontró el documento del usuario");
                nameSpan.textContent = "Usuario no encontrado";
                createInitialsCanvas(imgSpan, "Usuario");
            }
        })
        .catch((error) => {
            console.error("Error fetching user data: ", error);
            nameSpan.textContent = "Error al cargar el nombre";
            createInitialsCanvas(imgSpan, "Error");
        });
}

// Crear avatar con iniciales como canvas
function createInitialsCanvas(container, name) {
    const canvas = document.createElement('canvas');
    const size = 32; // Tamaño del avatar
    canvas.width = size;
    canvas.height = size;
    canvas.className = 'rounded';
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = getConsistentColor(name);
    ctx.fillRect(0, 0, size, size);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const initials = getInitials(name);
    ctx.fillText(initials, size / 2, size / 2);
    
    container.appendChild(canvas);
}

// Obtener iniciales
function getInitials(name) {
    if (!name) return "?";
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

// Generar un color basado en el nombre
function getConsistentColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = Math.abs(hash).toString(16).substring(0, 6);
    return `#${'0'.repeat(6 - color.length)}${color}`;
}

// Cerrar sesión y redirigir al login
function logOutUser() {
    firebase.auth().signOut().then(() => {
        console.log('Sesión cerrada exitosamente');
        window.location.href = '/page-sign-in.html';
    }).catch((error) => {
        console.error('Error al cerrar sesión:', error);
    });
}




const logoutButton = document.getElementById('logOut');
if (logoutButton) {
    logoutButton.addEventListener('click', function(e) {
        e.preventDefault();
        logOutUser();
    });
}

let allNotifications = [];
const NOTIFICATIONS_LIMIT = 4; // Show only the top 10 notifications

function getNotificationIcon(type) {
    switch (type) {
        case 'SEGUIMIENTO':
            return '<i class="fas fa-clipboard-check"></i>';
        case 'FELICITACIONES':
            return '<i class="fas fa-star"></i>';
        case 'CITA_AGENDADA':
            return '<i class="fas fa-calendar-check"></i>';
        case 'MENSAJE':
            return '<i class="fas fa-envelope"></i>';
        case 'VIDEO':
            return '<i class="fas fa-video"></i>';
        case 'APROBACION':
            return '<i class="fas fa-check-circle"></i>';
        case 'RECHAZADO':
            return '<i class="fas fa-times-circle"></i>';
        case 'CAMBIO_ROL':
            return '<i class="fas fa-user-tag"></i>';
        default:
            return '<i class="fas fa-bell"></i>';
    }
}

function formatearFecha(fecha) {
    if (fecha instanceof firebase.firestore.Timestamp) {
        return fecha.toDate().toLocaleDateString();
    } else if (typeof fecha === "string" || typeof fecha === "number") {
        return new Date(fecha).toLocaleDateString();
    } else {
        return "Fecha no disponible";
    }
}

function showNotificationDetails(id, notification) {
    console.log('Notification details:', id, notification);
    db.collection('Notificaciones').doc(id).update({ visto: true }).then(() => {
        updateNotificationDisplay();
    }).catch((error) => {
        console.error('Error updating notification:', error);
    });
}


function createNotificationElement(id, notification) {
    const a = document.createElement('a');
    a.href = '#';
    a.className = `list-group-item ${notification.visto ? 'notification-read' : 'notification-unread'}`;
    a.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="notification-icon notification-${notification.type}">
                ${getNotificationIcon(notification.type)}
            </div>
            <div class="flex-grow-1">
                <div class="notification-title notification-${notification.type}">${notification.tituloNotificacion}</div>
                <div class="text-muted small mt-1">${notification.mensaje}</div>
                <div class="text-muted small mt-1">${formatearFecha(notification.fechaEnvio)}</div>
            </div>
        </div>
    `;

    a.addEventListener('click', (e) => {
        e.preventDefault();
        showNotificationDetails(id, notification);
    });

    return a;
}

function loadNotifications(userId) {
    const notificationList = document.getElementById('notificationList');
    const notificationCount = document.getElementById('notificationCount');
    const notificationHeader = document.getElementById('notificationHeader');

    db.collection('Notificaciones')
        .where('uidReceptor', '==', userId)
        .orderBy('fechaEnvio', 'desc')
        .limit(100)  // Obtener todas las notificaciones, pero mostrar solo algunas inicialmente
        .get()
        .then((querySnapshot) => {
            allNotifications = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            updateNotificationDisplay();
        })
        .catch((error) => {
            console.error("Error loading notifications: ", error);
        });
}

function updateNotificationDisplay() {
    const notificationList = document.getElementById('notificationList');
    const notificationCount = document.getElementById('notificationCount');
    const notificationHeader = document.getElementById('notificationHeader');
    
    notificationList.innerHTML = '';
    const displayedNotifications = allNotifications.slice(0, NOTIFICATIONS_LIMIT);
    
    displayedNotifications.forEach(notification => {
        const notificationElement = createNotificationElement(notification.id, notification);
        notificationList.appendChild(notificationElement);
    });

    const unreadCount = allNotifications.filter(n => !n.visto).length;
    notificationCount.textContent = unreadCount;
    notificationHeader.textContent = `${unreadCount} Nuevas Notificaciones`;
}


// Initialize Feather Icons
feather.replace();
