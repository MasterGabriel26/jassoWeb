// Initialize Firebase (replace with your own config)
const firebaseConfig = {
    apiKey: "AIzaSyAOvefpvlXLtbTx1T2hYg2Ds56eiKI3eAk",
    authDomain: "jassodb-4b8e4.firebaseapp.com",
    projectId: "jassodb-4b8e4",
    storageBucket: "jassodb-4b8e4.appspot.com",
    messagingSenderId: "851107842246",
    appId: "1:851107842246:web:aa155261b9acdda47e6fc7",
    measurementId: "G-N18F7GL2NG"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const storage = firebase.storage();

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('userForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const imageInput = document.getElementById('imageProfile');
    const imagePreview = document.getElementById('imagePreview');

    // Toggle password visibility
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.querySelector('i').classList.toggle('bi-eye');
        this.querySelector('i').classList.toggle('bi-eye-slash');
    });

    // Image preview
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                imagePreview.innerHTML = '';
                imagePreview.appendChild(img);
            }
            reader.readAsDataURL(file);
        }
    });

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (form.checkValidity() === false) {
            e.stopPropagation();
            form.classList.add('was-validated');
            return;
        }

        const userData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            phone: document.getElementById('phone').value,
            userType: document.getElementById('userType').value,
            uidLider: document.getElementById('uidLider').value || null,
            active: document.getElementById('active').checked,
            timestamp: Date.now()
        };

        try {
            // Upload image if provided
            if (imageInput.files.length > 0) {
                const file = imageInput.files[0];
                const storageRef = storage.ref('profile_images/' + file.name);
                await storageRef.put(file);
                userData.imageProfile = await storageRef.getDownloadURL();
            } else {
                userData.imageProfile = "";
            }

            // Add user to Firestore
            const docRef = await db.collection("usuarios").add(userData);
            userData.uid = docRef.id;
            await docRef.update({ uid: userData.uid });

            alert('Usuario creado exitosamente!');
            form.reset();
            imagePreview.innerHTML = '';
            form.classList.remove('was-validated');
        } catch (error) {
            console.error("Error al crear usuario: ", error);
            alert('Error al crear usuario. Por favor, intente de nuevo.');
        }
    });
});