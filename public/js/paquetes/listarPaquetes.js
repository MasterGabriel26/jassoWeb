function createPostElement(post) {
  const postElement = document.createElement("div");
  postElement.className = "post";
  postElement.innerHTML = `
        <img src="${post.multimediaUrl[0]}" alt="${
    post.tituloEvento
  }" class="post-image">
        <div class="post-content">
            <div class="post-title">${post.tituloEvento}</div>
            <div class="post-info"><i class="fas fa-map-marker-alt"></i> ${
              post.lugar
            }</div>
            <div class="post-info"><i class="fas fa-tag"></i> ${
              post.categoria
            }</div>
            <div class="post-description">${post.descripcion}</div>
        </div>
        <div class="post-footer">
        
            <div class="post-date">${new Date(
              post.fechaPost
            ).toLocaleDateString()}</div>
        </div>
    `;
  postElement.addEventListener("click", () => showModal(post));
  return postElement;
}

function showModal(post) {
  const modalContent = document.getElementById("modal-content");
  modalContent.innerHTML = `
      <div class="modal-header">
          <h2 class="modal-title">${post.tituloEvento}</h2>
          <span class="close" onclick="closeModal()">&times;</span>
      </div>
      <div class="modal-body">
          <div class="modal-image-container">
              <img src="${post.multimediaUrl[0]}" alt="${post.tituloEvento}" class="modal-image" id="modalImage">
          </div>
          
          <div class="modal-thumbnails">
              ${post.multimediaUrl.map((url, index) => `
                  <img src="${url}" alt="Thumbnail ${index + 1}" 
                       class="modal-thumbnail" onclick="changeModalImage('${url}')">
              `).join('')}
          </div>

          <div class="modal-details">
              <p><strong>Lugar:</strong> <i class="fas fa-map-marker-alt"></i> ${post.lugar}</p>
              <p><strong>Categoría:</strong> <i class="fas fa-tag"></i> ${post.categoria}</p>
              <p><strong>Tipo de evento:</strong> <i class="fas fa-calendar-alt"></i> ${post.tipoEvento.join(", ")}</p>
              <p><strong>Costo:</strong> <i class="fas fa-dollar-sign"></i> $${post.costoPaquete}</p>
              <p><strong>Valor agregado:</strong> <i class="fas fa-plus-circle"></i> ${post.valorAgregado}</p>
              <pre><strong>Descripción:</strong>\n${post.descripcion}</pre>
          </div>

          <div class="modal-actions">
              <button class="btn-edit" onclick="editPost('${post.id}')">
                  <i class="fas fa-edit"></i> Editar
              </button>
              <button class="btn-delete" onclick="deletePost('${post.id}')">
                  <i class="fas fa-trash-alt"></i> Eliminar
              </button>
          </div>

          <div class="whatsapp-share">
              <button class="btn-whatsapp" onclick="sendWhatsAppMessage('${post.id}')">
                  <i class="fab fa-whatsapp"></i> Compartir por WhatsApp
              </button>
          </div>
      </div>
  `;

  const modal = document.getElementById("modal");
  modal.style.display = "block";
}


function editPost(postId) {
  Swal.fire({
      icon: 'info',
      title: 'Funcionalidad en Desarrollo',
      html: `
          <div class="text-center">
              <i class="fas fa-code-branch fa-3x mb-3 text-primary"></i>
              <p class="mb-3">¡Estamos trabajando en mejorar tu experiencia!</p>
              <p class="text-muted">La funcionalidad de edición estará disponible próximamente.</p>
          </div>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#4361ee',
      background: '#fff',
      padding: '2em',
      customClass: {
          title: 'text-primary fw-bold',
          popup: 'rounded-lg shadow-lg',
          confirmButton: 'btn-lg px-4'
      },
      showClass: {
          popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
      }
  });
}

function getCurrentUser() {
  return new Promise((resolve, reject) => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      unsubscribe();
      if (user) {
        db.collection("usuarios")
          .doc(user.uid)
          .get()
          .then((doc) => {
            if (doc.exists) {
              resolve(doc.data());
            } else {
              reject(new Error("User document not found"));
            }
          })
          .catch(reject);
      } else {
        reject(new Error("No user is signed in"));
      }
    }, reject);
  });
}

function deletePost(postId) {
  Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      customClass: {
          confirmButton: 'btn btn-danger',
          cancelButton: 'btn btn-secondary'
      },
  }).then((result) => {
      if (result.isConfirmed) {
          // Mostrar loading mientras se elimina
          Swal.fire({
              title: 'Eliminando...',
              text: 'Por favor espere',
              allowOutsideClick: false,
              showConfirmButton: false,
              willOpen: () => {
                  Swal.showLoading();
              }
          });

          // Obtener la referencia del documento
          const docRef = db.collection('publicaciones').doc(postId);

          // Primero obtener el documento para conseguir las URLs de las imágenes
          docRef.get().then((doc) => {
              if (doc.exists) {
                  const data = doc.data();
                  const imageUrls = data.multimediaUrl || [];

                  // Crear un array de promesas para eliminar cada imagen
                  const deleteImagePromises = imageUrls.map(url => {
                      // Obtener la referencia del storage desde la URL
                      const storageRef = firebase.storage().refFromURL(url);
                      return storageRef.delete();
                  });

                  // Eliminar todas las imágenes y luego el documento
                  Promise.all(deleteImagePromises)
                      .then(() => {
                          // Una vez eliminadas las imágenes, eliminar el documento
                          return docRef.delete();
                      })
                      .then(() => {
                          Swal.fire({
                              icon: 'success',
                              title: '¡Eliminado!',
                              text: 'La publicación ha sido eliminada correctamente',
                              showConfirmButton: false,
                              timer: 1500
                          }).then(() => {
                              // Cerrar el modal
                              closeModal();
                              // Recargar la página o actualizar la lista
                              location.reload();
                          });
                      })
                      .catch((error) => {
                          console.error("Error al eliminar: ", error);
                          Swal.fire({
                              icon: 'error',
                              title: 'Error',
                              text: 'Hubo un problema al eliminar la publicación',
                              confirmButtonText: 'Aceptar'
                          });
                      });
              } else {
                  Swal.fire({
                      icon: 'error',
                      title: 'Error',
                      text: 'No se encontró la publicación',
                      confirmButtonText: 'Aceptar'
                  });
              }
          }).catch((error) => {
              console.error("Error al obtener el documento: ", error);
              Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: 'Hubo un problema al eliminar la publicación',
                  confirmButtonText: 'Aceptar'
              });
          });
      }
  });
}

function closeModal() {
  const modal = document.getElementById("modal");
  modal.style.display = "none";
}

function sendWhatsAppMessage(postId) {
  getCurrentUser()
    .then((user) => {
      const message = encodeURIComponent(`Hola, tu asesor: ${user.name}, te está invitando a que conozcas más información del paquete que solicitaste: https://jassocompany.com/paquete-detalle.html?id=${postId}`);
      
      // Open WhatsApp with pre-filled message
      const whatsappUrl = `https://api.whatsapp.com/send?text=${message}`;
      window.open(whatsappUrl, '_blank');
    })
    .catch((error) => {
      console.error("Error getting current user:", error);
      alert("Debes iniciar sesión para enviar mensajes");
    });
}

function changeModalImage(url) {
  const modalImage = document.querySelector(".modal-image");
  modalImage.src = url;
}

const postsContainer = document.getElementById("posts-container");
const loaderContainer = document.getElementById("loader");
// Fetch posts from Firestore
db.collection("publicaciones")
  .orderBy("fechaPost", "desc")
  .get()
  .then((querySnapshot) => {
    loaderContainer.classList.add("hidden");
    querySnapshot.forEach((doc) => {
      const post = doc.data();
      post.id = doc.id;
      postsContainer.appendChild(createPostElement(post));
    });
  })
  .catch((error) => {
    console.error("Error getting documents: ", error);
  });

const modal = document.getElementById("modal");
const span = document.getElementsByClassName("close")[0];

span.onclick = function () {
  modal.style.display = "none";
};

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};
