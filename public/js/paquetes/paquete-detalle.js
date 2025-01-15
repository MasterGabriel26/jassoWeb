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

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (postId) {
        db.collection("publicaciones").doc(postId).get().then((doc) => {
            if (doc.exists) {
                const post = doc.data();
                post.id = doc.id;
                // Update meta tags first for proper WhatsApp preview
                updateMetaTags(post);
                // Then display the package details
                displayPaqueteDetalle(post);
            } else {
                console.log("No se encontró el documento");
            }
        }).catch((error) => {
            console.log("Error obteniendo el documento:", error);
        });
    }
});

function displayPaqueteDetalle(post) {
    const paqueteDetalle = document.getElementById('paquete-detalle');
    paqueteDetalle.innerHTML = `
        <h1 class="mb-4">${post.tituloEvento}</h1>
        <div class="row">
            <div class="col-md-8">
                <div class="image-gallery">
                    <div class="main-image">
                        <img src="${post.multimediaUrl[0]}" alt="${post.tituloEvento}" class="img-fluid" onclick="openImageModal(this.src)">
                    </div>
                    <div class="thumbnails">
                        ${post.multimediaUrl.map((url, index) => `
                            <img src="${url}" alt="Imagen ${index + 1}" class="thumbnail" onclick="changeMainImage('${url}')">
                        `).join('')}
                    </div>
                </div>
                <div class="descripcion-container mt-4">
                    <h2>Descripción</h2>
                    <pre>${post.descripcion}</pre>
                </div>
            </div>
            <div class="col-md-4">
                <div class="detalles-container">
                    <h3>Detalles del Paquete</h3>
                    <ul class="list-group">
                        <li class="list-group-item"><i class="fas fa-map-marker-alt"></i> <strong>Lugar:</strong> ${post.lugar}</li>
                        <li class="list-group-item"><i class="fas fa-tag"></i> <strong>Categoría:</strong> ${post.categoria}</li>
                        <li class="list-group-item"><i class="fas fa-calendar-alt"></i> <strong>Tipo de evento:</strong> ${post.tipoEvento.join(', ')}</li>
                        <li class="list-group-item"><i class="fas fa-dollar-sign"></i> <strong>Costo del paquete:</strong> $${post.costoPaquete}</li>
                        <li class="list-group-item"><i class="fas fa-users"></i> <strong>Capacidad:</strong> ${post.cantidadDePersonas || 'No especificado'}</li>
                        <li class="list-group-item"><i class="fas fa-gift"></i> <strong>Valor agregado:</strong> ${post.valorAgregado}</li>
                        <li class="list-group-item"><i class="fas fa-calendar-check"></i> <strong>Fecha de vigencia:</strong> ${new Date(post.fechaVigencia).toLocaleDateString()}</li>
                    </ul>
                </div>
                <div class="detalles-adicionales mt-4">
                    <h4>Información Adicional</h4>
                    <p><strong>Anticipo:</strong> $${post.anticipo}</p>
                    <p><strong>Costo para firmar:</strong> $${post.costoParaFirmar}</p>
                    <p><strong>Boda civil incluida:</strong> ${post.bodaCivil ? 'Sí' : 'No'}</p>
                    ${post.cantidadBotellas ? `<p><strong>Cantidad de botellas:</strong> ${post.cantidadBotellas}</p>` : ''}
                    ${post.colores.length > 0 ? `<p><strong>Colores disponibles:</strong> ${post.colores.join(', ')}</p>` : ''}
                    ${post.horarioEvento ? `<p><strong>Horario del evento:</strong> ${post.horarioEvento}</p>` : ''}
                </div>
            </div>
        </div>
    `;
}

function changeMainImage(url) {
    const mainImage = document.querySelector('.main-image img');
    mainImage.src = url;
}

function openImageModal(src) {
    const modalImage = document.getElementById('modalImage');
    modalImage.src = src;
    const imageModal = new bootstrap.Modal(document.getElementById('imageModal'));
    imageModal.show();
}
