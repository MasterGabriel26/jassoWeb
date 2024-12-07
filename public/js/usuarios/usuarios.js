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

    // Función para alternar la visibilidad de la contraseña
    togglePasswordBtn.addEventListener('click', () => {
        const type = userPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        userPasswordInput.setAttribute('type', type);
        togglePasswordBtn.innerHTML = type === 'password' ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
    });

    // Cargar usuarios al iniciar la página
    cargarUsuarios();
});