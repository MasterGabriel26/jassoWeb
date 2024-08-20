const firebaseConfig = {
  apiKey: "AIzaSyBTD0WrmlvOYViJ5J8_Tt3vDzCDmxQL3tQ",
  authDomain: "jassodb-4b8e4.firebaseapp.com",
  projectId: "jassodb-4b8e4",
  storageBucket: "jassodb-4b8e4.appspot.com",
  messagingSenderId: "851107842246",
  appId: "1:851107842246:web:166bb374ed3dd2cf7e6fc7",
  measurementId: "G-WXYY0N3TMG"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

$(function () {
  obtenerDocumentos();
});

// Función para obtener documentos y mostrar las imágenes
function obtenerDocumentos() {
  const docRef = db.collection("galeriaCompartida");

  docRef.get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(data.imagenes);

      if (Array.isArray(data.imagenes) && data.imagenes.length > 0) {
        mostrarImagenes(data.imagenes);
      }
    });
  }).catch((error) => {
    console.log("Error obteniendo documentos: ", error);
  });
}

// Función para mostrar las imágenes en el HTML
function mostrarImagenes(imagenes) {
  let plantilla = "";

  imagenes.forEach(imagen => {
    plantilla += `
      <div class="card">
        <div class="card-body">
          <img src="${imagen}" class="card-img-top" alt="Imagen">
        </div>
      </div>`;
  });

  // Agrega la plantilla al contenedor
  $("#fotosVestidos").html(plantilla);

  // Inicializa Owl Carousel después de cargar las imágenes
  $("#fotosVestidos").owlCarousel({
    loop: true,
    margin: 10,
    nav: true,
    responsive: {
      0: {
        items: 1
      },
      600: {
        items: 3
      },
      1000: {
        items: 5
      }
    }
  });
}
