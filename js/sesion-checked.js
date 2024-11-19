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
    // Esperamos a que se verifique el estado de autenticación antes de mostrar el nombre
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            displayUserName('nombreUsuario', 'usuarios', 'name', user.uid);
            displayUserPic('imgPerfil', 'usuarios', 'imageProfile', user.uid);
        }
    });
});

// Check for active session
firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        // No active session, redirect to login page
        window.location.href = './page-sign-in.html';
    } else {
        // User is signed in, you can proceed with loading the page content
        console.log('User is signed in:', user.email);
        // You can add any additional logic here, such as loading user-specific data
    }
});

function displayUserName(spanId, collectionName, attribute, userId) {
    const span = document.getElementById(spanId);
    
    if (!span) {
        console.error('No se encontró el elemento span');
        return;
    }
    
    // Obtenemos el documento del usuario actual
    db.collection(collectionName).doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                span.textContent = doc.data()[attribute];
            } else {
                console.log("No se encontró el documento del usuario");
                span.textContent = "Usuario no encontrado";
            }
        })
        .catch((error) => {
            console.error("Error fetching user data: ", error);
            span.textContent = "Error al cargar el nombre";
        });
}

function displayUserPic(imgId, collectionName, attribute, userId) {
    const img = document.getElementById(imgId);
    
    if (!img) {
        console.error('No se encontró el elemento imagen');
        return;
    }
    
    // Obtenemos el documento del usuario actual
    db.collection(collectionName).doc(userId).get()
        .then((doc) => {
            if (doc.exists && doc.data()[attribute]) {
                img.src = doc.data()[attribute];
                img.alt = doc.data().name || 'Foto de perfil';
            } else {
                console.log("No se encontró la imagen de perfil");
                img.src = '/src/img/avatars/default-profile.png'; // Ajusta esta ruta según tu estructura
                img.alt = 'Imagen por defecto';
            }
        })
        .catch((error) => {
            console.error("Error fetching user data: ", error);
            img.src = '/src/img/avatars/default-profile.png';
            img.alt = 'Error al cargar la imagen';
        });
}

document.getElementById('logOut').addEventListener('click', function(e) {
    e.preventDefault(); // Previene la navegación por defecto del enlace
    
    firebase.auth().signOut().then(() => {
        // Cierre de sesión exitoso
        console.log('Sesión cerrada exitosamente');
        
        window.location.href = '/static/page-sign-in.html'; // Redirige a la página de login
    }).catch((error) => {
        // Error al cerrar sesión
        console.error('Error al cerrar sesión:', error);
    });
});