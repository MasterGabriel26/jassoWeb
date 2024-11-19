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
const auth = firebase.auth(); // Initialize Firebase Authentication

// Login functionality
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
        // Check if user exists in the 'usuarios' collection
        const userDoc = await db.collection('usuarios').where('email', '==', email).get();
        
        if (userDoc.empty) {
            alert('Usuario no encontrado');
            return;
        }

        const userData = userDoc.docs[0].data();
        
        if (userData.password !== password) {
            alert('Contraseña incorrecta');
            return;
        }

        // If credentials are correct, sign in with Firebase Auth
        await auth.signInWithEmailAndPassword(email, password);
        
        // Redirect to index page or dashboard
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error during login:', error);
        alert('Error al iniciar sesión. Por favor, intenta de nuevo.');
    }
});