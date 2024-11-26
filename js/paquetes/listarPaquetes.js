




function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.innerHTML = `
        <img src="${post.multimediaUrl[0]}" alt="${post.tituloEvento}" class="post-image">
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
    postElement.addEventListener('click', () => showModal(post));
    return postElement;
}

function showModal(post) {
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `<h2 class="modal-title">${post.tituloEvento}</h2>
<div class="modal-image-container">
    <img src="${post.multimediaUrl[0]}" alt="${post.tituloEvento}" class="modal-image">
</div>
<div class="modal-thumbnails">
    ${post.multimediaUrl.map((url, index) => `
        <img src="${url}" alt="Imagen ${index + 1}" class="modal-thumbnail" onclick="changeModalImage('${url}')">
    `).join('')}
</div>
<div class="modal-details">
    <p class="modal-text"><strong>Lugar:</strong> ${post.lugar}</p>
    <p class="modal-text"><strong>Categoría:</strong> ${post.categoria}</p>
    <p class="modal-text"><strong>Tipo de evento:</strong> ${post.tipoEvento.join(', ')}</p>
    <p class="modal-text"><strong>Costo del paquete:</strong> $${post.costoPaquete}</p>
    <p class="modal-text"><strong>Valor agregado:</strong> ${post.valorAgregado}</p>
    <pre class="modal-description"><strong>Descripción:</strong> ${post.descripcion}</pre>
</div>
<div class="modal-footer">
    <p class="modal-date"><strong>Fecha:</strong> ${new Date(post.fechaPost).toLocaleDateString()}</p>
</div>

    `;
    modal.style.display = 'block';
}

function changeModalImage(url) {
    const modalImage = document.querySelector('.modal-image');
    modalImage.src = url;
}

const postsContainer = document.getElementById('posts-container');
const loaderContainer = document.getElementById('loader');
// Fetch posts from Firestore
db.collection("publicaciones")
    .orderBy("fechaPost", "desc")
    .get()
    .then((querySnapshot) => {
        loaderContainer.classList.add('hidden');
        querySnapshot.forEach((doc) => {
            const post = doc.data();
            post.id = doc.id;
            postsContainer.appendChild(createPostElement(post));
        });
    })
    .catch((error) => {
        console.error("Error getting documents: ", error);
    });

const modal = document.getElementById('modal');
const span = document.getElementsByClassName('close')[0];

span.onclick = function () {
    modal.style.display = 'none';
}

window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}
