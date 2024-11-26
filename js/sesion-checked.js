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
            displayUserInfo('nombreUsuario', 'imgPerfil', 'usuarios', user.uid);
        }
    });
});

// Check for active session
firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = './page-sign-in.html';
    } else {
        console.log('User is signed in:', user.email);
    }
});

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

function createInitialsCanvas(container, name) {
    const canvas = document.createElement('canvas');
    const size = 32; // Ajusta este valor según el tamaño deseado
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

function getInitials(name) {
    if (!name) return "?";
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

function getConsistentColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = Math.abs(hash).toString(16).substring(0, 6);
    return `#${'0'.repeat(6 - color.length)}${color}`;
}

document.getElementById('logOut').addEventListener('click', function(e) {
    e.preventDefault();
    
    firebase.auth().signOut().then(() => {
        console.log('Sesión cerrada exitosamente');
        window.location.href = './page-sign-in.html';
    }).catch((error) => {
        console.error('Error al cerrar sesión:', error);
    });
});

