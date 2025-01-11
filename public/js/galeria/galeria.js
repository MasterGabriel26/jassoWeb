let isAdmin = false;
let currentImageIndex = 0;
const loaderContainer = document.getElementById('loader');
 
let galleryImages = [];

// Cargar categorías desde Firebase
function cargarCategorias() {
    db.collection('galeria').get().then((querySnapshot) => {
        const categorySelect = document.getElementById('imageCategory');
        const categoriasUnicas = new Set();
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.categoriasDeImagenes) {
                categoriasUnicas.add(data.categoriasDeImagenes);
            }
        });

        categoriasUnicas.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            categorySelect.appendChild(option);
        });
    });
}

// Mostrar/ocultar el input para nueva categoría
document.getElementById('imageCategory')?.addEventListener('change', function() {
    const newCategoryInput = document.getElementById('newCategoryInput');
    if (this.value === 'nueva') {
        newCategoryInput.style.display = 'block';
    } else {
        newCategoryInput.style.display = 'none';
    }
});

// Función para agregar imagen
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
                    location.reload();
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

// Verificar estado de administrador
function checkAdminStatus() {
    return new Promise((resolve) => {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                db.collection('users').doc(user.uid).get().then((doc) => {
                    if (doc.exists && doc.data().role === 'admin' ||doc.exists && doc.data().role === 'asesor'||doc.exists && doc.data().role === 'lider'  ) {
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

// Función para cargar la galería
function cargarGaleria() {
    db.collection('galeria').get().then((querySnapshot) => {
        let categorias = {};
        galleryImages = []; // Reiniciar el array de imágenes

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const imagenes = data.imagenes || [];
            const categoria = data.categoriasDeImagenes;

            // Agregar imágenes al array global
            galleryImages = galleryImages.concat(imagenes);

            // Agregar imágenes a la pestaña "Todo"
            imagenes.forEach((imagen) => {
                $('#galeria-todo').append(`
                    <div class="pin-container">
                        <div class="pin">
                            <img src="${imagen}" alt="Imagen de galería">
                            <div class="pin-overlay">
                                <div class="pin-actions">
                                    <button class="pin-button" onclick="openImageModal('${imagen}')">
                                        <i class="fas fa-expand-alt"></i> Ver
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
            });

            // Agregar imágenes a la categoría correspondiente
            if (!categorias[categoria]) {
                categorias[categoria] = [];
                $('#myTab').append(`
                    <li class="nav-item" role="presentation">
                        <a class="nav-link" id="${categoria}-tab" data-bs-toggle="tab" 
                           href="#${categoria}" role="tab" aria-controls="${categoria}" 
                           aria-selected="false">${categoria}</a>
                    </li>
                `);
                $('#myTabContent').append(`
                    <div class="tab-pane fade" id="${categoria}" role="tabpanel" 
                         aria-labelledby="${categoria}-tab">
                        <div id="galeria-${categoria}"></div>
                    </div>
                `);
            }
            categorias[categoria].push(imagenes);
        });

        // Insertar imágenes en las pestañas de categorías
        for (const [categoria, imagenes] of Object.entries(categorias)) {
            imagenes.forEach((imagenArray) => {
                imagenArray.forEach((imagen) => {
                    $(`#galeria-${categoria}`).append(`
                        <div class="pin-container">
                            <div class="pin">
                                <img src="${imagen}" alt="Imagen de galería">
                                <div class="pin-overlay">
                                    <div class="pin-actions">
                                        <button class="pin-button" onclick="openImageModal('${imagen}')">
                                            <i class="fas fa-expand-alt"></i> Ver
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `);
                });
            });
        }

        loaderContainer.classList.add('hidden');

        const tipoUsuario= localStorage.getItem("userType")


        if (tipoUsuario=='asesor'||tipoUsuario=='admin'||tipoUsuario=='lider') {
            const addImageBtn = document.getElementById('addImageBtn');
            if (addImageBtn) {
                addImageBtn.style.display = 'block';
            }
        }

        // Inicializar los botones de navegación
        initializeNavigationButtons();
    });
}

// Funciones de navegación del modal
function initializeNavigationButtons() {
    const prevButton = document.querySelector('.modal-nav-button.prev');
    const nextButton = document.querySelector('.modal-nav-button.next');
    
    if (prevButton && nextButton) {
        prevButton.addEventListener('click', navigatePrevious);
        nextButton.addEventListener('click', navigateNext);
    }
}

function openImageModal(imageSrc) {
    const modalImage = document.getElementById('modalImage');
    modalImage.src = imageSrc;
    currentImageIndex = galleryImages.indexOf(imageSrc);
    updateNavigationButtons();
    new bootstrap.Modal(document.getElementById('imageModal')).show();
}

function updateNavigationButtons() {
    const prevButton = document.querySelector('.modal-nav-button.prev');
    const nextButton = document.querySelector('.modal-nav-button.next');
    
    if (prevButton && nextButton) {
        prevButton.disabled = currentImageIndex <= 0;
        nextButton.disabled = currentImageIndex >= galleryImages.length - 1;
    }
}

function navigatePrevious() {
    if (currentImageIndex > 0) {
        currentImageIndex--;
        const modalImage = document.getElementById('modalImage');
        modalImage.src = galleryImages[currentImageIndex];
        updateNavigationButtons();
    }
}

function navigateNext() {
    if (currentImageIndex < galleryImages.length - 1) {
        currentImageIndex++;
        const modalImage = document.getElementById('modalImage');
        modalImage.src = galleryImages[currentImageIndex];
        updateNavigationButtons();
    }
}

// Inicialización cuando el documento está listo
$(document).ready(function() {
    cargarGaleria();
    cargarCategorias();

    const userType = localStorage.getItem('userType');
    const addImageBtn = document.getElementById('addImageBtn');

    if (userType === 'admin' && addImageBtn) {
        isAdmin = true;
        addImageBtn.style.display = 'block';
        
        addImageBtn.addEventListener('click', function() {
            new bootstrap.Modal(document.getElementById('addImageModal')).show();
        });
    }

    const addImageForm = document.getElementById('addImageForm');
    if (addImageForm) {
        addImageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const file = document.getElementById('imageFile').files[0];
            const category = document.getElementById('imageCategory').value;
            if (category === 'nueva') {
                const newCategory = document.getElementById('newCategory').value;
                if (newCategory) {
                    addImage(file, newCategory);
                } else {
                    alert('Por favor, ingrese el nombre de la nueva categoría');
                }
            } else {
                addImage(file, category);
            }
        });
    }


    // Agregar navegación con teclado
    document.addEventListener('keydown', function(e) {
        const imageModal = document.getElementById('imageModal');
        if (imageModal && imageModal.classList.contains('show')) {
            if (e.key === 'ArrowLeft') {
                navigatePrevious();
            } else if (e.key === 'ArrowRight') {
                navigateNext();
            }
        }
    });
});