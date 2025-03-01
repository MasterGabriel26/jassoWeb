let isAdmin = false;
let currentImageIndex = 0;
const loaderContainer = document.getElementById("loader");

let galleryImages = [];


// Cargar categorías desde Firebase
async function cargarCategorias() {
  const categoriasPermitidas = ["Decoracion", "Eventos", "Vestidos", "Degustacion"];
  const categorySelect = document.getElementById("imageCategory");
  
  // Limpiar opciones existentes
  categorySelect.innerHTML = '';

  // Verificar y crear documentos para cada categoría si no existen
  for (const categoria of categoriasPermitidas) {
    const querySnapshot = await db.collection("galeria")
      .where("categoriasDeImagenes", "==", categoria)
      .get();

    if (querySnapshot.empty) {
      // Si no existe el documento, lo creamos
      await db.collection("galeria").add({
        categoriasDeImagenes: categoria,
        fecha_create: Date.now(),
        imagenes: []
      });
    }

    // Crear option para el select
    const option = document.createElement("option");
    option.value = categoria;
    option.textContent = categoria;
    categorySelect.appendChild(option);
  }
}

// Mostrar/ocultar el input para nueva categoría
document
  .getElementById("imageCategory")
  ?.addEventListener("change", function () {
    const newCategoryInput = document.getElementById("newCategoryInput");
    if (this.value === "nueva") {
      newCategoryInput.style.display = "block";
    } else {
      newCategoryInput.style.display = "none";
    }
  });


  // Función para comprimir la imagen
async function comprimirImagen(file) {
  return new Promise((resolve, reject) => {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
          reject(new Error('El archivo seleccionado no es una imagen'));
          return;
      }

      const reader = new FileReader();
      reader.onload = function(e) {
          const img = new Image();
          
          img.onload = function() {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;

              // Máximo tamaño deseado
              const MAX_WIDTH = 1200;
              const MAX_HEIGHT = 1200;

              if (width > height) {
                  if (width > MAX_WIDTH) {
                      height = Math.round(height * MAX_WIDTH / width);
                      width = MAX_WIDTH;
                  }
              } else {
                  if (height > MAX_HEIGHT) {
                      width = Math.round(width * MAX_HEIGHT / height);
                      height = MAX_HEIGHT;
                  }
              }

              canvas.width = width;
              canvas.height = height;

              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);

              // Determinar calidad según tamaño original
              let quality = 0.7;
              if (file.size < 500 * 1024) { // < 500KB
                  quality = 0.9;
              } else if (file.size > 5 * 1024 * 1024) { // > 5MB
                  quality = 0.5;
              }

              canvas.toBlob(
                  (blob) => {
                      if (blob) {
                          // Crear nuevo File object
                          const compressedFile = new File([blob], file.name, {
                              type: file.type,
                              lastModified: Date.now()
                          });
                          resolve(compressedFile);
                      } else {
                          reject(new Error('Error al comprimir la imagen'));
                      }
                  },
                  file.type,
                  quality
              );
          };

          img.onerror = () => reject(new Error('Error al cargar la imagen'));
          img.src = e.target.result;
      };

      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
  });
}

// Función para agregar imagen
async function addImage(file, category) {
  try {
    // Mostrar indicador de carga con progreso
    Swal.fire({
        title: 'Procesando imagen...',
        html: 'Comprimiendo imagen...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // Comprimir imagen
    const compressedFile = await comprimirImagen(file);
    
    // Actualizar mensaje de carga
    Swal.update({
        html: 'Subiendo imagen...'
    });

    const storageRef = firebase.storage().ref();
    const imageRef = storageRef.child(`galeria/${Date.now()}_${compressedFile.name}`);

    // Subir archivo comprimido
    const snapshot = await imageRef.put(compressedFile);
    const downloadURL = await snapshot.ref.getDownloadURL();

    // Guardar en Firestore
    if (category === 'nueva') {
        const newCategory = document.getElementById('newCategory').value;
        await db.collection('galeria').add({
            imagenes: [downloadURL],
            categoriasDeImagenes: newCategory,
            fecha_create: Date.now()
        });
    } else {
        const querySnapshot = await db.collection('galeria')
            .where('categoriasDeImagenes', '==', category)
            .get();

        if (querySnapshot.empty) {
            // Crear nueva categoría
            await db.collection('galeria').add({
                imagenes: [downloadURL],
                categoriasDeImagenes: category,
                fecha_create: Date.now()
            });
        } else {
            // Actualizar categoría existente
            await querySnapshot.docs[0].ref.update({
                imagenes: firebase.firestore.FieldValue.arrayUnion(downloadURL)
            });
        }
    }

    // Mostrar mensaje de éxito
    await Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Imagen subida correctamente',
        showConfirmButton: false,
        timer: 1500
    });

    location.reload();

} catch (error) {
    console.error("Error:", error);
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Hubo un problema al procesar la imagen'
    });
  }
}

// Verificar estado de administrador
function checkAdminStatus() {
  return new Promise((resolve) => {
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        db.collection("users")
          .doc(user.uid)
          .get()
          .then((doc) => {
            if (
              (doc.exists && doc.data().role === "admin") ||
              (doc.exists && doc.data().role === "asesor") ||
              (doc.exists && doc.data().role === "lider")
            ) {
              isAdmin = true;
            }
            resolve();
          })
          .catch(() => resolve());
      } else {
        resolve();
      }
    });
  });
}

// Función para cargar la galería
function cargarGaleria() {
    const tipoUsuario = localStorage.getItem("userType");
  db.collection("galeria")
    .get()
    .then((querySnapshot) => {
      let categorias = {};
      galleryImages = []; // Reiniciar el array de imágenes

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const imagenes = data.imagenes || [];
        const categoria = data.categoriasDeImagenes;

        // Agregar imágenes al array global
        galleryImages = galleryImages.concat(imagenes);

        // Agregar imágenes a la pestaña "Todo"
        // Agregar imágenes a la pestaña "Todo"
        imagenes.forEach((imagen) => {
          $("#galeria-todo").append(`
        <div class="pin-container">
            <div class="pin">
                <img src="${imagen}" alt="Imagen de galería">
                <div class="pin-overlay">
                    <div class="pin-actions">
                        <button class="pin-button view-button" onclick="openImageModal('${imagen}')">
                            <i class="fas fa-expand-alt"></i> Ver
                        </button>
                        ${
                          tipoUsuario === "admin" ||
                          tipoUsuario === "asesor" ||
                          tipoUsuario === "lider"
                            ? `<button class="pin-button delete-button" onclick="deleteImage('${imagen}', '${doc.id}')">
                                <i class="fas fa-trash-alt"></i> Eliminar
                            </button>`
                            : ""
                        }
                    </div>
                </div>
            </div>
        </div>
    `);
        });

        // Agregar imágenes a la categoría correspondiente
        if (!categorias[categoria]) {
          categorias[categoria] = [];
          $("#myTab").append(`
                    <li class="nav-item" role="presentation">
                        <a class="nav-link" id="${categoria}-tab" data-bs-toggle="tab" 
                           href="#${categoria}" role="tab" aria-controls="${categoria}" 
                           aria-selected="false">${categoria}</a>
                    </li>
                `);
          $("#myTabContent").append(`
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

      loaderContainer.classList.add("hidden");

   

      if (
        tipoUsuario == "asesor" ||
        tipoUsuario == "admin" ||
        tipoUsuario == "lider"
      ) {
        const addImageBtn = document.getElementById("addImageBtn");
        if (addImageBtn) {
          addImageBtn.style.display = "block";
        }
      }

      // Inicializar los botones de navegación
      initializeNavigationButtons();
    });
}

// Funciones de navegación del modal
function initializeNavigationButtons() {
  const prevButton = document.querySelector(".modal-nav-button.prev");
  const nextButton = document.querySelector(".modal-nav-button.next");

  if (prevButton && nextButton) {
    prevButton.addEventListener("click", navigatePrevious);
    nextButton.addEventListener("click", navigateNext);
  }
}

function openImageModal(imageSrc) {
  const modalImage = document.getElementById("modalImage");
  modalImage.src = imageSrc;
  currentImageIndex = galleryImages.indexOf(imageSrc);
  updateNavigationButtons();
  new bootstrap.Modal(document.getElementById("imageModal")).show();
}


function deleteImage(imageUrl, docId) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "No podrás revertir esta acción",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Mostrar loader
            Swal.fire({
                title: 'Eliminando imagen...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Referencia a la imagen en Storage
            const storageRef = firebase.storage().refFromURL(imageUrl);

            // Eliminar la imagen de Storage
            storageRef.delete().then(() => {
                // Actualizar Firestore
                db.collection('galeria').get().then((querySnapshot) => {
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        if (data.imagenes && data.imagenes.includes(imageUrl)) {
                            // Filtrar la imagen eliminada
                            const nuevasImagenes = data.imagenes.filter(img => img !== imageUrl);
                            
                            // Actualizar documento
                            db.collection('galeria').doc(doc.id).update({
                                imagenes: nuevasImagenes
                            }).then(() => {
                                Swal.fire(
                                    '¡Eliminada!',
                                    'La imagen ha sido eliminada correctamente.',
                                    'success'
                                ).then(() => {
                                    // Eliminar el elemento del DOM
                                    const container = document.querySelector(`img[src="${imageUrl}"]`).closest('.pin-container');
                                    container.remove();
                                });
                            });
                        }
                    });
                });
            }).catch((error) => {
                console.error("Error al eliminar la imagen:", error);
                Swal.fire(
                    'Error',
                    'Hubo un problema al eliminar la imagen.',
                    'error'
                );
            });
        }
    });
}


function updateNavigationButtons() {
  const prevButton = document.querySelector(".modal-nav-button.prev");
  const nextButton = document.querySelector(".modal-nav-button.next");

  if (prevButton && nextButton) {
    prevButton.disabled = currentImageIndex <= 0;
    nextButton.disabled = currentImageIndex >= galleryImages.length - 1;
  }
}

function navigatePrevious() {
  if (currentImageIndex > 0) {
    currentImageIndex--;
    const modalImage = document.getElementById("modalImage");
    modalImage.src = galleryImages[currentImageIndex];
    updateNavigationButtons();
  }
}

function navigateNext() {
  if (currentImageIndex < galleryImages.length - 1) {
    currentImageIndex++;
    const modalImage = document.getElementById("modalImage");
    modalImage.src = galleryImages[currentImageIndex];
    updateNavigationButtons();
  }
}

// Inicialización cuando el documento está listo
$(document).ready(function () {
    cargarGaleria();
    cargarCategorias();

    const userType = localStorage.getItem("userType");
    const addImageBtn = document.getElementById("addImageBtn");

    if ((userType === "admin" || userType === "asesor" || userType === "lider") && addImageBtn) {
        isAdmin = true;
        addImageBtn.style.display = "block";

        addImageBtn.addEventListener("click", function() {
            const modal = new bootstrap.Modal(document.getElementById("addImageModal"));
            modal.show();
        });
    }

    // Manejar el envío del formulario
    const addImageForm = document.getElementById("addImageForm");
    if (addImageForm) {
        addImageForm.addEventListener("submit", function(e) {
            e.preventDefault();
            
            const file = document.getElementById("imageFile").files[0];
            const category = document.getElementById("imageCategory").value;
            
            if (!file) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Por favor seleccione una imagen'
                });
                return;
            }

            if (!category) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Por favor seleccione una categoría'
                });
                return;
            }

           
            addImage(file, category);
        });
    }

  // Agregar navegación con teclado
  document.addEventListener("keydown", function (e) {
    const imageModal = document.getElementById("imageModal");
    if (imageModal && imageModal.classList.contains("show")) {
      if (e.key === "ArrowLeft") {
        navigatePrevious();
      } else if (e.key === "ArrowRight") {
        navigateNext();
      }
    }
  });
});
