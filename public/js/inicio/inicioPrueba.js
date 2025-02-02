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

// Primero, agrega estos estilos globales
// Estilos globales
const globalStyles = `
  <style>
    body {
      background-color: #f5f7fa;
    }

    .section-title {
      font-size: 1.8rem;
      color: #2c3e50;
      margin: 20px;
      padding-left: 10px;
    }

    .carousel-container {
      margin-bottom: 40px;
      padding: 20px;
    }

    .posts-carousel {
      display: flex;
      overflow-x: auto;
      gap: 20px;
      padding: 10px 5px;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }

    .posts-carousel::-webkit-scrollbar {
      display: none;
    }

    .carousel-card {
      min-width: 280px;
      flex: 0 0 auto;
    }
  </style>
`;

const featuredStyles = `
<style>
    .featured-carousel {
        position: relative;
        border-radius: 30px;
        width: 100%;
        height: 600px;
        margin-bottom: 40px;
        overflow: hidden;
    }

    .featured-slides {
        display: flex;
        transition: transform 0.5s ease;
        height: 100%;
        width: 100%;
    }

    .featured-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: brightness(0.7);
    }

    .featured-content {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 100px 60px 60px;
        background: linear-gradient(
            0deg,
            rgba(0,0,0,0.9) 0%,
            rgba(0,0,0,0.8) 30%,
            rgba(0,0,0,0.4) 60%,
            transparent 100%
        );
        color: white;
        z-index: 2;
    }

    .featured-title {
        font-size: 3.5rem;
        font-weight: 700;
        margin-bottom: 20px;
        color: #ffffff;
        text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
        letter-spacing: 0.5px;
        line-height: 1.2;
        max-width: 800px;
    }

    .featured-info {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 15px;
        text-shadow: 1px 1px 4px rgba(0,0,0,0.5);
    }

    .featured-category {
        background: rgba(255,255,255,0.15);
        padding: 8px 20px;
        border-radius: 30px;
        backdrop-filter: blur(8px);
        font-weight: 500;
        border: 1px solid rgba(255,255,255,0.2);
        font-size: 0.9rem;
        letter-spacing: 0.5px;
    }

    .featured-location {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1rem;
        opacity: 0.9;
    }

    .featured-controls {
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        transform: translateY(-50%);
        display: flex;
        justify-content: space-between;
        padding: 0 30px;
        pointer-events: none;
        z-index: 10;
    }

    .featured-prev, .featured-next {
        width: 50px;
        height: 50px;
        border: none;
        border-radius: 50%;
        background: rgba(0,0,0,0.6);
        color: white;
        cursor: pointer;
        pointer-events: auto;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        backdrop-filter: blur(4px);
        z-index: 11;
    }

    .featured-prev:hover, .featured-next:hover {
        background: rgba(255,255,255,0.2);
        transform: scale(1.1);
    }

    .featured-indicators {
        position: absolute;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 12px;
        z-index: 10;
    }

    .featured-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(255,255,255,0.4);
        cursor: pointer;
        transition: all 0.3s ease;
        border: 2px solid rgba(255,255,255,0.6);
        pointer-events: auto;
    }

    .featured-indicator:hover {
        background: rgba(255,255,255,0.8);
    }

    .featured-indicator.active {
        background: white;
        transform: scale(1.2);
    }

    .featured-slide-link {
        flex: 0 0 100%;
        width: 100%;
        height: 100%;
        text-decoration: none;
        color: inherit;
        position: relative;
    }

    .featured-slide {
        width: 100%;
        height: 100%;
        position: relative;
        cursor: pointer;
    }

    @media (max-width: 768px) {
        .featured-carousel {
            height: 400px;
        }

        .featured-content {
            padding: 60px 30px 40px;
        }

        .featured-title {
            font-size: 1.8rem;
        }

        .featured-category {
            padding: 6px 15px;
            font-size: 0.8rem;
        }

        .featured-location {
            font-size: 0.9rem;
        }
    }
</style>
`;
document.head.insertAdjacentHTML('beforeend', featuredStyles);


// Agregar estilos al documento
document.head.insertAdjacentHTML('beforeend', globalStyles);





// Función para formatear la fecha
function formatearFecha(fecha) {
  if (fecha instanceof firebase.firestore.Timestamp) {
    const date = fecha.toDate();
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  } else if (typeof fecha === "string" || typeof fecha === "number") {
    const date = new Date(fecha);
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  }
  return "Fecha no disponible";
}

// Actualizar la función createCarouselCard
function createCarouselCard(post) {
  const defaultPost = {
    imagen_destacada: 'img/default-image.jpg',
    titulo: 'Sin título',
    categoria: 'Sin categoría',
    lugar: 'Lugar no especificado',
    fecha_creacion: new Date(),
    ...post
  };

  const cardElement = document.createElement("div");
  cardElement.className = "carousel-card";
  cardElement.style.width = window.innerWidth <= 480 ? '200px' : window.innerWidth <= 768 ? '250px' : '280px';
  cardElement.innerHTML = `
    <div class="post-card">
      <div class="card-image-container">
        <img src="${defaultPost.imagen_destacada}" alt="${defaultPost.titulo}" class="card-image">
        ${defaultPost.isPromocion ? '<div class="promo-badge"><span>Promo</span></div>' : ''}
        <span class="card-category">${defaultPost.categoria}</span>
      </div>
      <div class="card-content">
        <h3 class="card-title">${defaultPost.titulo}</h3>
        <div class="card-info">
          <span class="card-location">
            <i class="fas fa-map-marker-alt"></i> ${defaultPost.lugar}
          </span>
          <span class="card-date">
            <i class="far fa-calendar"></i> ${formatearFecha(post.fecha_creacion)}
          </span>
        </div>
      </div>
    </div>
  `;

  cardElement.onclick = () => {
    window.location.href = `publicaciones/casaAntiguaAteaga.html?id=${defaultPost.id}&tipo=asesor`;  
  };

  return cardElement;
}



function createFeaturedSlide(post) {
  const slide = document.createElement('a');
  slide.href = `publicaciones/casaAntiguaAteaga.html?id=${post.id}&tipo=asesor`;
  slide.classList.add('featured-slide-link');
  slide.innerHTML = `
      <div class="featured-slide">
          ${post.isPromocion ? '<div class="promo-badge"><span>Promo</span></div>' : ''}
          <img src="${post.imagen_destacada}" alt="${post.titulo}" class="featured-image">
          <div class="featured-content">
              <h2 class="featured-title">${post.titulo}</h2>
              <div class="featured-info">
                  <span class="featured-category">${post.categoria}</span>
                  <span class="featured-location">
                      <i class="fas fa-map-marker-alt"></i> ${post.lugar}
                  </span>
              </div>
          </div>
      </div>
  `;
  return slide;
}

function initializeFeaturedCarousel(posts) {
  const featuredContainer = document.getElementById('featured-container');
  const indicatorsContainer = document.getElementById('featured-indicators');
  let currentSlide = 0;

  // Limpiar y crear slides
  featuredContainer.innerHTML = '';
  posts.forEach(post => {
      const slide = createFeaturedSlide(post);
      featuredContainer.appendChild(slide);
  });
  
  // Crear indicadores
  indicatorsContainer.innerHTML = posts.map((_, index) => 
      `<div class="featured-indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></div>`
  ).join('');

  // Función para cambiar slide
  function goToSlide(index) {
      currentSlide = index;
      featuredContainer.style.transform = `translateX(-${index * 100}%)`;
      document.querySelectorAll('.featured-indicator').forEach((indicator, i) => {
          indicator.classList.toggle('active', i === index);
      });
  }

  // Eventos de los controles
  document.querySelector('.featured-prev').addEventListener('click', (e) => {
      e.preventDefault();
      currentSlide = (currentSlide - 1 + posts.length) % posts.length;
      goToSlide(currentSlide);
  });

  document.querySelector('.featured-next').addEventListener('click', (e) => {
      e.preventDefault();
      currentSlide = (currentSlide + 1) % posts.length;
      goToSlide(currentSlide);
  });

  // Cambio automático
  let autoplayInterval = setInterval(() => {
      currentSlide = (currentSlide + 1) % posts.length;
      goToSlide(currentSlide);
  }, 5000);

  // Eventos de los indicadores
  document.querySelectorAll('.featured-indicator').forEach(indicator => {
      indicator.addEventListener('click', (e) => {
          e.preventDefault();
          goToSlide(parseInt(indicator.dataset.index));
      });
  });

  // Pausar autoplay en hover
  featuredContainer.addEventListener('mouseenter', () => {
      clearInterval(autoplayInterval);
  });

  featuredContainer.addEventListener('mouseleave', () => {
      autoplayInterval = setInterval(() => {
          currentSlide = (currentSlide + 1) % posts.length;
          goToSlide(currentSlide);
      }, 5000);
  });
}

// Actualiza la función updatePostsDisplay
function updatePostsDisplay() {
  popularPostsContainer.innerHTML = '';
  
  db.collection("publicaciones2")
      .orderBy("fecha_creacion", "desc")
      .get()
      .then((querySnapshot) => {
          const posts = [];
          querySnapshot.forEach((doc) => {
              const post = { ...doc.data(), id: doc.id };
              posts.push(post);
          });

          // Filtrar publicaciones en promoción
          const promoPosts = posts.filter(post => post.isPromocion);

          // Si no hay suficientes publicaciones en promoción, agregar publicaciones al azar
          const featuredPosts = promoPosts.length >= 4 ? promoPosts : [
              ...promoPosts,
              ...posts.filter(post => !post.isPromocion).sort(() => 0.5 - Math.random()).slice(0, 4 - promoPosts.length)
          ];

          // Inicializar carrusel destacado
          initializeFeaturedCarousel(featuredPosts);

          // Carrusel de publicaciones recientes
          posts.forEach(post => {
              popularPostsContainer.appendChild(createCarouselCard(post));
          });

          if (loaderContainer) loaderContainer.classList.add("hidden");
      })
      .catch((error) => {
          console.error("Error getting documents: ", error);
          if (loaderContainer) loaderContainer.classList.add("hidden");
      });
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







const popularPostsContainer = document.getElementById("popular-posts-container");
const allPostsContainer = document.getElementById("posts-container");
const loaderContainer = document.getElementById("loader");



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




function updateMetaTags(post) {
  const titleMeta = document.querySelector('meta[property="og:title"]');
  const descriptionMeta = document.querySelector('meta[property="og:description"]');
  const imageMeta = document.querySelector('meta[property="og:image"]');
  const urlMeta = document.querySelector('meta[property="og:url"]');

  const baseUrl = 'https://jassocompany.com';

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
    const imageUrl = post.multimediaUrl[0].startsWith('http') ? post.multimediaUrl[0] : `${baseUrl}${post.multimediaUrl[0]}`;
    imageMeta.setAttribute('content', imageUrl);
  } else {
    console.error('Meta tag og:image not found');
  }

  if (urlMeta) {
    urlMeta.setAttribute('content', `${baseUrl}/paquete-detalle.html?id=${post.id}`);
  } else {
    console.error('Meta tag og:url not found');
  }
}



