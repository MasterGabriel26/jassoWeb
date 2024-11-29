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
const auth = firebase.auth();

// Login functionality
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
        // Check if user exists in the 'usuarios' collection
        const userQuery = await db.collection('usuarios').where('email', '==', email).get();
        
        if (userQuery.empty) {
            alert('Usuario no encontrado');
            return;
        }

        const userDoc = userQuery.docs[0];
        const userData = userDoc.data();
        
        if (userData.password !== password) {
            alert('Contraseña incorrecta');
            return;
        }

        if (userData.userType !== 'admin') {
            alert('Este tipo de usuario no tiene acceso a esta sección');
            return;
        }

        // If credentials are correct and user is admin, sign in with Firebase Auth
        await auth.signInWithEmailAndPassword(email, password);
        
        // Redirect to index page or dashboard
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error during login:', error);
        alert('Error al iniciar sesión. Por favor, intenta de nuevo.');
    }
});