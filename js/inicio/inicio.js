let currentUser;

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
              currentUser = { ...doc.data(), uid: user.uid };
              resolve(currentUser);
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

function createPostElement(post) {
  const postElement = document.createElement("div");
  postElement.className = "post";
  postElement.innerHTML = `
    <img src="${post.multimediaUrl[0]}" alt="${post.tituloEvento}" class="post-image">
    <button class="like-button ${post.likes && post.likes.includes(currentUser.uid) ? 'liked' : ''}" data-post-id="${post.id}">
      <i class="fas fa-heart"></i>
    </button>

    <div class="post-content">
      <div class="post-title">${post.tituloEvento}</div>
      <div class="post-info"><i class="fas fa-map-marker-alt"></i> ${post.lugar}</div>
      <div class="post-info"><i class="fas fa-tag"></i> ${post.categoria}</div>
      <div class="post-description">${post.descripcion}</div>
    </div>
    <div class="post-footer">
      <div class="post-date">${new Date(post.fechaPost).toLocaleDateString()}</div>
    </div>
  `;
  
  const likeButton = postElement.querySelector('.like-button');
  likeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleLike(post.id);
  });

  postElement.addEventListener("click", () => showModal(post));
  return postElement;
}

function toggleLike(postId) {
  if (!currentUser) {
    alert("Debes iniciar sesión para dar like");
    return;
  }

  const postRef = db.collection("publicaciones").doc(postId);
  
  return db.runTransaction((transaction) => {
    return transaction.get(postRef).then((postDoc) => {
      if (!postDoc.exists) {
        throw "Document does not exist!";
      }

      const postData = postDoc.data();
      const likes = postData.likes || [];
      const likesCount = postData.likesCount || 0;

      if (likes.includes(currentUser.uid)) {
        // User has already liked, so unlike
        const newLikes = likes.filter(uid => uid !== currentUser.uid);
        transaction.update(postRef, { 
          likes: newLikes,
          likesCount: likesCount - 1
        });
      } else {
        // User hasn't liked, so add like
        transaction.update(postRef, { 
          likes: [...likes, currentUser.uid],
          likesCount: likesCount + 1
        });
      }
    });
  }).then(() => {
    console.log("Like toggled successfully");
    updatePostsDisplay();
  }).catch((error) => {
    console.error("Error toggling like: ", error);
  });
}

function showModal(post) {
  const modal = document.getElementById("modal");
  const modalContent = document.getElementById("modal-content");
  modalContent.innerHTML = `
        <h2 class="modal-title">${post.tituloEvento}</h2>
        <div class="modal-image-container">
            <img src="${post.multimediaUrl[0]}" alt="${
    post.tituloEvento
  }" class="modal-image">
        </div>
        <div class="modal-thumbnails">
            ${post.multimediaUrl
              .map(
                (url, index) => `
                <img src="${url}" alt="Imagen ${
                  index + 1
                }" class="modal-thumbnail" onclick="changeModalImage('${url}')">
            `
              )
              .join("")}
        </div>
      
       

        <div class="modal-details">
            <p class="modal-text"><strong>Lugar:</strong> ${post.lugar}</p>
            <p class="modal-text"><strong>Categoría:</strong> ${
              post.categoria
            }</p>
            <p class="modal-text"><strong>Tipo de evento:</strong> ${post.tipoEvento.join(
              ", "
            )}</p>
            <p class="modal-text"><strong>Costo del paquete:</strong> $${
              post.costoPaquete
            }</p>
            <p class="modal-text"><strong>Valor agregado:</strong> ${
              post.valorAgregado
            }</p>
            <pre class="modal-description"><strong>Descripción:</strong> ${
              post.descripcion
            }</pre>
        </div>
             <div class="container">
                <div class="row justify-content-center">
                    <div class="col-md-6">
                        <div class="whatsapp-share">
                            
                            <div class="input-group mb-3" style="text-align: center;">
                                <button onclick='sendWhatsAppMessage("${post.id}", ${JSON.stringify(post)})' class="btn btn-success">
  <i class="fab fa-whatsapp"></i> Compartir por WhatsApp
</button>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <p class="modal-date"><strong>Fecha:</strong> ${new Date(
              post.fechaPost
            ).toLocaleDateString()}</p>
        </div>
        
    `;
  modal.style.display = "block";
}

function changeModalImage(url) {
  const modalImage = document.querySelector(".modal-image");
  modalImage.src = url;
}

const popularPostsContainer = document.getElementById("popular-posts-container");
const allPostsContainer = document.getElementById("posts-container");
const loaderContainer = document.getElementById("loader");

function updatePostsDisplay() {
  popularPostsContainer.innerHTML = '';
  allPostsContainer.innerHTML = '';
  
  db.collection("publicaciones")
    .orderBy("likesCount", "desc")
    .limit(3)
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const post = { ...doc.data(), id: doc.id };
        popularPostsContainer.appendChild(createPostElement(post));
      });
    });

  db.collection("publicaciones")
    .orderBy("fechaPost", "desc")
    .get()
    .then((querySnapshot) => {
      loaderContainer.classList.add("hidden");
      querySnapshot.forEach((doc) => {
        const post = { ...doc.data(), id: doc.id };
        allPostsContainer.appendChild(createPostElement(post));
      });
    })
    .catch((error) => {
      console.error("Error getting documents: ", error);
    });
}

getCurrentUser().then(() => {
  updatePostsDisplay();
}).catch((error) => {
  console.error("Error getting current user:", error);
  loaderContainer.classList.add("hidden");
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

function sendWhatsAppMessage(postId, post) {
  if (!currentUser) {
    alert("Debes iniciar sesión para enviar mensajes");
    return;
  }

 

  // Actualizar las etiquetas de Open Graph
  updateMetaTags(post);

  const message = encodeURIComponent(
    `Hola, tu asesor: ${currentUser.name}, te está invitando a que conozcas más información sobre "${post.tituloEvento}": https://jassocompany.com/paquete-detalle.html?id=${postId}`
  );

  const whatsappUrl = `https://api.whatsapp.com/send?text=${message}`;
  window.open(whatsappUrl, '_blank');
}


function updateMetaTags(post) {
  const titleMeta = document.querySelector('meta[property="og:title"]');
  const descriptionMeta = document.querySelector('meta[property="og:description"]');
  const imageMeta = document.querySelector('meta[property="og:image"]');
  const urlMeta = document.querySelector('meta[property="og:url"]');

  if (titleMeta) {
    titleMeta.setAttribute('content', post.tituloEvento);
  } else {
    console.error('Meta tag og:title not found');
  }

  if (descriptionMeta) {
    descriptionMeta.setAttribute('content', `${post.descripcion.substring(0, 100)}... | Costo: $${post.costoPaquete} | Lugar: ${post.lugar}`);
  } else {
    console.error('Meta tag og:description not found');
  }

  if (imageMeta) {
    imageMeta.setAttribute('content', post.multimediaUrl[0]);
  } else {
    console.error('Meta tag og:image not found');
  }

  if (urlMeta) {
    urlMeta.setAttribute('content', `https://jassocompany.com/paquete-detalle.html?id=${post.id}`);
  } else {
    console.error('Meta tag og:url not found');
  }
}


