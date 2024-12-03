let isAdmin = false;


// Cargar categorías desde Firebase
function cargarCategorias() {
    db.collection('galeria').get().then((querySnapshot) => {
        const categorySelect = document.getElementById('imageCategory');
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const categoria = data.categoriasDeImagenes;
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            categorySelect.appendChild(option);
        });
    });
}

// Mostrar/ocultar el input para nueva categoría
document.getElementById('imageCategory').addEventListener('change', function() {
    const newCategoryInput = document.getElementById('newCategoryInput');
    if (this.value === 'nueva') {
        newCategoryInput.style.display = 'block';
    } else {
        newCategoryInput.style.display = 'none';
    }
});

// Modificar la función addImage
function addImage(file, category) {
    const storageRef = firebase.storage().ref();
    const imageRef = storageRef.child(`galeria/${file.name}`);

    imageRef.put(file).then((snapshot) => {
        snapshot.ref.getDownloadURL().then((downloadURL) => {
            if (category === 'nueva') {
                const newCategory = document.getElementById('newCategory').value;
                db.collection('galeria').add({
                    imagenes: [downloadURL],
                    categoriasDeImagenes: newCategory,
                    fecha_create: Date.now()
                }).then(() => {
                    alert('Imagen subida exitosamente');
                    location.reload(); // Recargar la página para mostrar la nueva imagen
                });
            } else {
                db.collection('galeria').where('categoriasDeImagenes', '==', category).get().then((querySnapshot) => {
                    querySnapshot.forEach((doc) => {
                        db.collection('galeria').doc(doc.id).update({
                            imagenes: firebase.firestore.FieldValue.arrayUnion(downloadURL)
                        }).then(() => {
                            alert('Imagen agregada a la categoría existente');
                            location.reload();
                        });
                    });
                });
            }
        });
    }).catch((error) => {
        console.error("Error uploading file: ", error);
        alert('Error al subir la imagen');
    });
}
// Add this function to check if the user is an admin
function checkAdminStatus() {
    return new Promise((resolve) => {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                db.collection('users').doc(user.uid).get().then((doc) => {
                    if (doc.exists && doc.data().role === 'admin') {
                        isAdmin = true;
                    }
                    resolve();
                }).catch(() => resolve());
            } else {
                resolve();
            }
        });
    });
}

const loaderContainer = document.getElementById('loader');
const addImageBtn = document.getElementById('addImageBtn');


function cargarGaleria() {
    db.collection('galeria').get().then((querySnapshot) => {
        let categorias = {};

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const imagenes = data.imagenes;
            const categoria = data.categoriasDeImagenes;

            // Agregar imágenes a la pestaña "Todo"
            imagenes.forEach((imagen) => {
                $('#galeria-todo').append(`
                    <div class="col-6 col-md-4 col-lg-3 mb-4">
                        <div class="image-container" style="height: 200px; overflow: hidden;">
                            <img src="${imagen}" class="img-fluid w-100 h-100 object-fit-cover" alt="Imagen" onclick="openImageModal('${imagen}')">
                        </div>
                    </div>
                `);
            });

            // Agregar imágenes a la categoría correspondiente
            if (!categorias[categoria]) {
                categorias[categoria] = [];
                $('#myTab').append(`<li class="nav-item" role="presentation"><a class="nav-link" id="${categoria}-tab" data-bs-toggle="tab" href="#${categoria}" role="tab" aria-controls="${categoria}" aria-selected="false">${categoria}</a></li>`);
                $('#myTabContent').append(`<div class="tab-pane fade" id="${categoria}" role="tabpanel" aria-labelledby="${categoria}-tab"><div class="row" id="galeria-${categoria}"></div></div>`);
            }
            categorias[categoria].push(imagenes);
        });

        // Insertar imágenes en las pestañas de categorías
        for (const [categoria, imagenes] of Object.entries(categorias)) {
            imagenes.forEach((imagenArray) => {
                imagenArray.forEach((imagen) => {
                    $(`#galeria-${categoria}`).append(`
                        <div class="col-6 col-md-4 col-lg-3 mb-4">
                            <div class="image-container" style="height: 200px; overflow: hidden;">
                                <img src="${imagen}" class="img-fluid w-100 h-100 object-fit-cover" alt="Imagen" onclick="openImageModal('${imagen}')">
                            </div>
                        </div>
                    `);
                });
            });
        }

        loaderContainer.classList.add('hidden');

        // Show add image button if user is admin
        if (isAdmin) {
            const addImageBtn = document.getElementById('addImageBtn');
            if (addImageBtn) {
                addImageBtn.style.display = 'block';
            }
        }
    });
}

function openImageModal(imageSrc) {
    const modalImage = document.getElementById('modalImage');
    modalImage.src = imageSrc;
    const imageModal = new bootstrap.Modal(document.getElementById('imageModal'));
    imageModal.show();
}

function addImage(file, category) {
    const storageRef = firebase.storage().ref();
    const imageRef = storageRef.child(`galeria/${file.name}`);

    imageRef.put(file).then((snapshot) => {
        snapshot.ref.getDownloadURL().then((downloadURL) => {
            db.collection('galeria').add({
                imagenes: [downloadURL],
                categoriasDeImagenes: category
            }).then(() => {
                alert('Imagen subida exitosamente');
                location.reload(); // Reload the page to show the new image
            }).catch((error) => {
                console.error("Error adding document: ", error);
                alert('Error al subir la imagen');
            });
        });
    }).catch((error) => {
        console.error("Error uploading file: ", error);
        alert('Error al subir la imagen');
    });
}

$(document).ready(function() {
    cargarGaleria();
    cargarCategorias();

    const userType = localStorage.getItem('userType');
    const addImageBtn = document.getElementById('addImageBtn');

    if (userType === 'admin' && addImageBtn) {
        isAdmin = true;
        addImageBtn.style.display = 'block';
        
        addImageBtn.addEventListener('click', function() {
            const addImageModal = new bootstrap.Modal(document.getElementById('addImageModal'));
            addImageModal.show();
        });
    }

    const addImageForm = document.getElementById('addImageForm');
    if (addImageForm) {
        addImageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const file = document.getElementById('imageFile').files[0];
            const category = document.getElementById('imageCategory').value;
            addImage(file, category);
        });
    }
});

function openImageModal(imageSrc) {
    const modalImage = document.getElementById('modalImage');
    modalImage.src = imageSrc;
    const imageModal = new bootstrap.Modal(document.getElementById('imageModal'));
    imageModal.show();
}