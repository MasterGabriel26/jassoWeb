

const firebaseConfig = {
  apiKey: "AIzaSyAOvefpvlXLtbTx1T2hYg2Ds56eiKI3eAk",
  authDomain: "jassodb-4b8e4.firebaseapp.com",
  databaseURL: "https://jassodb-4b8e4-default-rtdb.firebaseio.com",
  projectId: "jassodb-4b8e4",
  storageBucket: "jassodb-4b8e4.appspot.com",
  messagingSenderId: "851107842246",
  appId: "1:851107842246:web:aa155261b9acdda47e6fc7",
  measurementId: "G-N18F7GL2NG",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Función auxiliar para formatear moneda
function formatearMoneda(valor) {
  if (valor === undefined || valor === null) return "$0";
  return `$${valor.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Función para obtener el usuario actual y sus datos
async function getCurrentUser() {
  return new Promise((resolve, reject) => {
    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Obtener datos adicionales del usuario desde Firestore
          const userDoc = await db
            .collection("usuarios")
            .doc(user.uid)
            .get();
          const userData = userDoc.data();
          resolve({
            uid: user.uid,
            email: user.email,
            ...userData, // Esto incluirá nombre, imageProfile, etc.
          });
        } catch (error) {
          console.error("Error al obtener datos del usuario:", error);
          resolve({
            uid: user.uid,
            email: user.email,
          });
        }
      } else {
        resolve(null);
      }
    });
  });
}


// Función para crear avatar con iniciales o imagen de perfil
async function createAvatarElement(userId, userName, size = 40) {
  const avatar = document.createElement("div");
  avatar.className = "user-avatar";
  avatar.style.width = `${size}px`;
  avatar.style.height = `${size}px`;

  try {
    // Buscar datos del usuario en Firestore
    const userDoc = await db.collection("usuarios").doc(userId).get();

    if (userDoc.exists && userDoc.data().imageProfile) {
      // Si existe imagen de perfil, usarla
      avatar.style.backgroundImage = `url('${
        userDoc.data().imageProfile
      }')`;
      avatar.style.backgroundSize = "cover";
      avatar.style.backgroundPosition = "center";
      avatar.textContent = ""; // Limpiar el texto si hay imagen
    } else {
      // Si no hay imagen, crear avatar con iniciales
      avatar.style.background =
        "linear-gradient(45deg, #2d3456, #1e2330)";
      const initials = userName
        ? userName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
        : "U";
      avatar.textContent = initials;
    }
  } catch (error) {
    console.error("Error al obtener imagen de perfil:", error);
    // En caso de error, mostrar avatar con iniciales
    avatar.style.background = "linear-gradient(45deg, #2d3456, #1e2330)";
    const initials = userName
      ? userName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "U";
    avatar.textContent = initials;
  }

  return avatar;
}
// Función para formatear fecha
function formatDate(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) {
    return `hace ${minutes} minutos`;
  } else if (hours < 24) {
    return `hace ${hours} horas`;
  } else if (days < 7) {
    return `hace ${days} días`;
  } else {
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

async function loadComments(publicacionId) {
  const commentsList = document.getElementById("commentsList");

  // Obtener usuario actual
  const currentUser = await getCurrentUser();
  console.log("Usuario actual:", currentUser);

  // Crear avatar para el usuario actual en el formulario
  const currentUserAvatarContainer =
    document.getElementById("currentUserAvatar");
  currentUserAvatarContainer.innerHTML = "";

  if (currentUser) {
    const currentUserAvatar = await createAvatarElement(
      currentUser.uid,
      currentUser.name || currentUser.email
    );
    currentUserAvatarContainer.appendChild(currentUserAvatar);
  }

  // Escuchar cambios en los comentarios usando subcolección
  db.collection("publicaciones2")
    .doc(publicacionId)
    .collection("comentarios")
    .orderBy("fecha", "desc")
    .onSnapshot(async (snapshot) => {
      commentsList.innerHTML = "";

      if (snapshot.empty) {
        commentsList.innerHTML =
          '<div class="no-comments">No hay comentarios aún. ¡Sé el primero en comentar!</div>';
        return;
      }

      for (const doc of snapshot.docs) {
        const comment = doc.data();
        const commentElement = document.createElement("div");
        commentElement.className = "comment-item";

        // Obtener datos del usuario que comentó
        try {
          const userDoc = await db
            .collection("usuarios")
            .doc(comment.userId)
            .get();
          const userData = userDoc.data();
          const userName = userData ? userData.name : comment.autor;

          const avatarElement = await createAvatarElement(
            comment.userId,
            userName
          );

          const contentWrapper = document.createElement("div");
          contentWrapper.className = "comment-content-wrapper";
          contentWrapper.innerHTML = `
                  <div class="comment-header">
                      <span class="comment-author">${userName}</span>
                  </div>
                  <div class="comment-text">${comment.texto}</div>
                  <div class="comment-metadata">
                      ${formatDate(comment.fecha.toDate())}
                  </div>
              `;

          commentElement.appendChild(avatarElement);
          commentElement.appendChild(contentWrapper);
          commentsList.appendChild(commentElement);
        } catch (error) {
          console.error("Error al cargar datos del usuario:", error);
        }
      }
    });
}

// Evento para enviar comentario
document
  .getElementById("submitComment")
  .addEventListener("click", async () => {
    const commentText = document
      .getElementById("commentText")
      .value.trim();
    const urlParams = new URLSearchParams(window.location.search);
    const publicacionId = urlParams.get("id");

    if (!commentText) {
      alert("Por favor escribe un comentario");
      return;
    }

    try {
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        alert("Debes iniciar sesión para comentar");
        return;
      }

      // Agregar comentario como subcolección de la publicación
      await db
        .collection("publicaciones2")
        .doc(publicacionId)
        .collection("comentarios")
        .add({
          userId: currentUser.uid,
          autor: currentUser.nombre || currentUser.email,
          texto: commentText,
          fecha: firebase.firestore.Timestamp.now(),
        });

      document.getElementById("commentText").value = "";
    } catch (error) {
      console.error("Error al agregar comentario:", error);
      alert("Error al publicar el comentario");
    }
  });

document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const tipoUsuario = urlParams.get("tipo");

  // Ocultar el formulario de comentarios si el usuario no es admin o asesor
 
// Ocultar toda la sección de comentarios si el usuario no es admin o asesor
const commentsSection = document.querySelector(".comments-section");
if (!tipoUsuario || 
  (tipoUsuario.toLowerCase() !== "admin" && 
   tipoUsuario.toLowerCase() !== "asesor")) {
  commentsSection.style.display = "none";
}

const material_apoyo = document.getElementById("material-card");
if (!tipoUsuario || 
  (tipoUsuario.toLowerCase() !== "admin" && 
   tipoUsuario.toLowerCase() !== "asesor")) {
    material_apoyo.style.display = "none";
}

});

document.addEventListener("DOMContentLoaded", async function () {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const publicacionId = urlParams.get("id");
    const tipoUsuario = urlParams.get("tipo"); // Obtener el tipo de usuario

    // Mostrar/ocultar sección de comisiones según el tipo de usuario
    const comisionesCard = document.getElementById("comisiones-card");
    if (tipoUsuario && tipoUsuario.toLowerCase() === "asesor") {
      comisionesCard.style.display = "block";
    }

    if (tipoUsuario && tipoUsuario.toLowerCase() === "admin") {
      comisionesCard.style.display = "block";
    }

    if (!publicacionId) {
      throw new Error("ID de publicación no proporcionado");
    }

    const doc = await firebase
      .firestore()
      .collection("publicaciones2")
      .doc(publicacionId)
      .get();

    if (!doc.exists) {
      throw new Error("Publicación no encontrada");
    }

    const data = doc.data();

    // Establecer imagen de fondo
    if (data.imagen_destacada) {
      document.getElementById(
        "hero-image"
      ).style.backgroundImage = `url('${data.imagen_destacada}')`;
    }

    // Llenar datos principales
    document.getElementById("titulo").textContent = data.titulo;
    document.getElementById("categoria").textContent = data.categoria;
    document.getElementById("lugar").textContent = data.lugar;
    document.getElementById("contenido").innerHTML = data.contenido;

    // Cargar información de comisiones si el usuario es asesor
    if (tipoUsuario && tipoUsuario.toLowerCase() === "asesor") {
      // Verificar si los campos existen y tienen valores
      if (data.comision_llamada !== undefined) {
        document.getElementById("comision-llamada").textContent =
          formatearMoneda(data.comision_llamada);
      }

      if (data.comision_lider !== undefined) {
        document.getElementById("comision-lider").textContent =
          formatearMoneda(data.comision_lider);
      }

      if (data.comision_venta !== undefined) {
        document.getElementById("comision-venta").textContent =
          formatearMoneda(data.comision_venta);
      }

      if (data.precio !== undefined) {
        document.getElementById("precio-total").textContent =
          formatearMoneda(data.precio);
      }
    }

    // Después de insertar el contenido, procesa los elementos
    const contenidoDiv = document.getElementById("contenido");

    // Procesar imágenes
    contenidoDiv.querySelectorAll("img").forEach((img) => {
      const originalStyle = img.getAttribute("style") || "";
      img.setAttribute("data-mce-style", originalStyle);
      img.style.maxWidth = "100%";
      img.style.height = "auto";
    });

    // Procesar tablas
    contenidoDiv.querySelectorAll("table").forEach((table) => {
      const originalStyle = table.getAttribute("style") || "";
      table.setAttribute("data-mce-style", originalStyle);
      table.classList.add("mce-table");
    });

    // Procesar elementos con alineación
    contenidoDiv
      .querySelectorAll('[style*="text-align"]')
      .forEach((el) => {
        const originalStyle = el.getAttribute("style");
        el.setAttribute("data-mce-style", originalStyle);
      });

    // Procesar elementos con color
    contenidoDiv.querySelectorAll('[style*="color"]').forEach((el) => {
      const originalStyle = el.getAttribute("style");
      el.setAttribute("data-mce-style", originalStyle);
    });

    // Agregar clase para mantener estilos del editor
    contenidoDiv.classList.add("mce-content-body");

    // Llenar sidebar
    document.getElementById("lugar-sidebar").textContent = data.lugar;
    document.getElementById("categoria-sidebar").textContent =
      data.categoria;

    // Formatear y mostrar fechas
    const fecha = data.fecha_creacion.toDate();
    const fechaFormateada = fecha.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    document.getElementById("fecha").textContent = fechaFormateada;
    document.getElementById("fecha-sidebar").textContent =
      fechaFormateada;

  // En la sección donde se cargan los medios
// En la sección donde se cargan los medios
if (data.material_ || data.galeria) {
    const materialContainer = document.getElementById("material-apoyo");
    const galeriaContainer = document.getElementById("galeria-imagenes");
    materialContainer.innerHTML = "";
    galeriaContainer.innerHTML = "";

    // Mostrar descripción del material si existe
    if (data.descripcion_material) {
        const descripcionElement = document.getElementById('descripcion-material');
        descripcionElement.textContent = data.descripcion_material;
        descripcionElement.style.display = 'block';
    } else {
        document.getElementById('descripcion-material').style.display = 'none';
    }

    // Crear lightbox común
    const lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.innerHTML = `
        <span class="lightbox-close">&times;</span>
        <div class="lightbox-content"></div>
    `;
    document.body.appendChild(lightbox);

    // Funciones del lightbox
    const openLightbox = (content) => {
        const lightboxContent = lightbox.querySelector(".lightbox-content");
        lightboxContent.innerHTML = content;
        lightbox.classList.add("active");
        document.body.classList.add("no-scroll");
    };

    const closeLightbox = () => {
        lightbox.classList.remove("active");
        lightbox.querySelector(".lightbox-content").innerHTML = "";
        document.body.classList.remove("no-scroll");
    };

    // Configurar eventos del lightbox
    lightbox.querySelector(".lightbox-close").onclick = closeLightbox;
    lightbox.onclick = (e) => {
        if (e.target === lightbox) closeLightbox();
    };

    // Función para crear elementos de galería
    const createGalleryItem = (medio, container) => {
        const div = document.createElement("div");
        div.className = "gallery-item";

        if (medio.tipo === "image" || medio.tipo === "imagen") {
            const img = document.createElement("img");
            img.src = medio.url;
            img.alt = medio.nombre || "Imagen de galería";
            img.loading = "lazy";

            div.onclick = () => {
                openLightbox(`<img src="${medio.url}" alt="${medio.nombre || "Imagen ampliada"}">`);
            };

            div.appendChild(img);
        } 
        else if (medio.tipo === "video") {
            const thumbnail = document.createElement("div");
            thumbnail.className = "video-thumbnail";
            thumbnail.innerHTML = '<i class="fas fa-play"></i>';

            div.onclick = () => {
                openLightbox(`
                    <video src="${medio.url}" controls autoplay>
                        Tu navegador no soporta el elemento de video.
                    </video>
                `);
            };

            div.appendChild(thumbnail);
        }
        else if (medio.tipo === "pdf" || medio.tipo === "application/pdf") {
            div.className = "gallery-item pdf-item";
            div.innerHTML = `
                <div class="pdf-content">
                    <i class="fas fa-file-pdf pdf-icon"></i>
                    <span class="pdf-name">${medio.nombre || "Documento PDF"}</span>
                </div>
            `;

            div.onclick = () => {
                window.open(medio.url, '_blank');
            };
        }

        container.appendChild(div);
    };

    // Cargar material de apoyo
    if (data.medios && data.medios.length > 0) {
        data.medios.forEach(medio => createGalleryItem(medio, materialContainer));
    } else {
        materialContainer.innerHTML = "<p>No hay material de apoyo disponible</p>";
    }

    // Cargar galería
    if (data.galeria && data.galeria.length > 0) {
        data.galeria.forEach(medio => createGalleryItem(medio, galeriaContainer));
    } else {
        galeriaContainer.innerHTML = "<p>No hay imágenes en la galería</p>";
    }
}

    // Cargar comentarios al inicio
   loadComments(publicacionId);
  } catch (error) {
    console.error("Error:", error);
    alert("Error al cargar la publicación: " + error.message);
  }
});

  