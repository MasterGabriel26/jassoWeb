// usuarios.js
document.addEventListener('DOMContentLoaded', () => {
    const usuariosLista = document.getElementById('usuarios-lista');
    const usuarioModal = new bootstrap.Modal(document.getElementById('usuarioModal'));
    const usuarioForm = document.getElementById('usuarioForm');
    const saveUserBtn = document.getElementById('saveUserBtn');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const userPasswordInput = document.getElementById('userPassword');

    let currentUserId = null;

    // Función para cargar y mostrar usuarios
    function cargarUsuarios() {
        usuariosLista.innerHTML = '';
        db.collection("usuarios").get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const usuario = doc.data();
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${usuario.name || 'N/A'}</td>
                    <td>${usuario.email || 'N/A'}</td>
                    <td>${usuario.phone || 'N/A'}</td>
                    <td>${usuario.userType || 'N/A'}</td>
                    <td>${usuario.active ? 'Activo' : 'Inactivo'}</td>
                `;
                row.addEventListener('click', () => mostrarDetallesUsuario(doc.id, usuario));
                usuariosLista.appendChild(row);
                loaderContainer.classList.add('hidden');
            });
        }).catch((error) => {
            console.error("Error al cargar usuarios: ", error);
        });
       
    }


    const loaderContainer = document.getElementById('loader');

    // Función para mostrar detalles del usuario en el modal
   // usuarios.js
   function mostrarDetallesUsuario(id, usuario) {
    currentUserId = id;
    
    const setElementValue = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = value;
            } else if (element.tagName === 'SELECT') {
                if (element.querySelector(`option[value="${value}"]`)) {
                    element.value = value;
                } else {
                    // If the option doesn't exist, create it
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value;
                    element.appendChild(option);
                    element.value = value;
                }
            } else {
                element.value = value;
            }
        } else {
            console.warn(`Element with id '${id}' not found`);
        }
    };

    setElementValue('userId', id);
    setElementValue('userName', usuario.name || '');
    setElementValue('userEmail', usuario.email || '');
    setElementValue('userPhone', usuario.phone || '');
    setElementValue('userType', usuario.userType || '');
    setElementValue('userPassword', usuario.password || '');
    setElementValue('userActive', usuario.active || false);

    usuarioModal.show();
}



const btnCreateUser = document.getElementById('btnCreateUser');

// Función para limpiar el formulario
function limpiarFormulario() {
    document.getElementById('userId').value = '';
    document.getElementById('userName').value = '';
    document.getElementById('userEmail').value = '';
    document.getElementById('userPhone').value = '';
    document.getElementById('userType').value = 'cliente'; // valor por defecto
    document.getElementById('userPassword').value = '';
    document.getElementById('userActive').checked = true;
}

// Evento para el botón crear usuario
btnCreateUser.addEventListener('click', () => {
    currentUserId = null; // Indicar que es un nuevo usuario
    limpiarFormulario();
    usuarioModal.show();
});

// Modificar el evento saveUserBtn para manejar tanto creación como actualización
saveUserBtn.addEventListener('click', () => {
    const userData = {
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        phone: document.getElementById('userPhone').value,
        userType: document.getElementById('userType').value,
        password: document.getElementById('userPassword').value,
        active: document.getElementById('userActive').checked
    };

    if (currentUserId) {
        // Actualizar usuario existente
        db.collection("usuarios").doc(currentUserId).update(userData)
            .then(() => {
                console.log("Usuario actualizado correctamente");
                usuarioModal.hide();
                cargarUsuarios();
            })
            .catch((error) => {
                console.error("Error al actualizar usuario: ", error);
            });
    } else {
        // Crear nuevo usuario
        db.collection("usuarios").add(userData)
            .then(() => {
                console.log("Usuario creado correctamente");
                usuarioModal.hide();
                cargarUsuarios();
            })
            .catch((error) => {
                console.error("Error al crear usuario: ", error);
            });
    }
});


    // Evento para guardar cambios del usuario
    saveUserBtn.addEventListener('click', () => {
        const userData = {
            name: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
            phone: document.getElementById('userPhone').value,
            userType: document.getElementById('userType').value,
            password: document.getElementById('userPassword').value,
            active: document.getElementById('userActive').checked
        };

        db.collection("usuarios").doc(currentUserId).update(userData)
            .then(() => {
                console.log("Usuario actualizado correctamente");
                usuarioModal.hide();
                cargarUsuarios();
            })
            .catch((error) => {
                console.error("Error al actualizar usuario: ", error);
            });
    });

    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('userPassword');

    togglePassword.addEventListener('click', function(e) {
        e.preventDefault(); // Prevenir cualquier comportamiento por defecto
        
        // Cambiar el tipo de input
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Cambiar el icono
        const icon = this.querySelector('i');
        if (type === 'password') {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        } else {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    });


    // Cargar usuarios al iniciar la página
    cargarUsuarios();
});