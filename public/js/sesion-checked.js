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

           // loadNotifications(userId);
        } else {
            // If not authenticated, redirect to login
            window.location.href = './page-sign-in.html';
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
        window.location.href = './page-sign-in.html';
    }).catch((error) => {
        console.error('Error al cerrar sesión:', error);
    });
}



/*
function loadNotifications(userId) {
    const notificationList = document.getElementById('notificationList');
    const notificationCount = document.getElementById('notificationCount');
    const notificationHeader = document.getElementById('notificationHeader');

    db.collection('Notificaciones')
        .where('uidReceptor', '==', userId)
        .where('visto', '==', false)
        .onSnapshot((snapshot) => {
            notificationList.innerHTML = '';
            let count = 0;

            snapshot.forEach((doc) => {
                const notification = doc.data();
                count++;

                const notificationElement = createNotificationElement(doc.id, notification);
                notificationList.appendChild(notificationElement);
            });

            notificationCount.textContent = count;
            notificationHeader.textContent = `${count} New Notifications`;
        }, (error) => {
            console.error("Error loading notifications: ", error);
        });
}


function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}
function createNotificationElement(id, notification) {
    const a = document.createElement('a');
    a.href = '#';
    a.className = 'list-group-item';
    a.innerHTML = `
        <div class="row g-0 align-items-center">
            <div class="col-2">
                <i class="text-${getNotificationIcon(notification.type)}" data-feather="${getNotificationIcon(notification.type)}"></i>
            </div>
            <div class="col-10">
                <div class="text-dark">${notification.tituloNotificacion}</div>
                <div class="text-muted small mt-1">${notification.mensaje}</div>
                <div class="text-muted small mt-1">${formatDate(notification.fechaEnvio)}</div>
            </div>
        </div>
    `;

    a.addEventListener('click', (e) => {
        e.preventDefault();
        showNotificationDetails(id, notification);
    });

    return a;
}


function getNotificationIcon(type) {
    switch (type) {
        case 'CITA_AGENDADA':
            return 'calendar';
        // Add more cases for different notification types
        default:
            return 'bell';
    }
}


function showNotificationDetails(id, notification) {
    // Implement a modal or other UI to show notification details
    console.log('Showing details for notification:', notification);

    // Mark the notification as read
    db.collection('Notificaciones').doc(id).update({ visto: true })
        .then(() => console.log('Notification marked as read'))
        .catch((error) => console.error('Error updating notification:', error));
}
*/

const logoutButton = document.getElementById('logOut');
if (logoutButton) {
    logoutButton.addEventListener('click', function(e) {
        e.preventDefault();
        logOutUser();
    });
}

/*
async function testNotificationQuery(userId) {
    try {
        const snapshot = await db.collection('Notificaciones')
            .where('uidReceptor', '==', userId)
            .where('visto', '==', false)
            .get();

        if (snapshot.empty) {
            console.log('No matching documents.');
            return;
        }

        snapshot.forEach(doc => {
            console.log(doc.id, '=>', doc.data());
        });
    } catch (error) {
        console.error("Error querying notifications: ", error);
    }
}

// Test with a sample user ID
testNotificationQuery('98ounVrtZoa6r7iOouYFXRAt4qf2');*/