
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


firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();



document.addEventListener("DOMContentLoaded", async function () {
    // try {
    const urlParams = new URLSearchParams(window.location.search);
    const publicacionId = urlParams.get("id");
    const tipoUsuario = urlParams.get("tipo"); // Obtener el tipo de usuario
  

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
    const id = doc.id;
    // Verificar el valor de 'lugar' y redirigir a la página correspondiente
if (data.lugar === "Museo de las Aves") {
    window.location.href = "museoDeLasAves.html?id="+id; // Redirige a arteaga.html
} else if (data.lugar === "V. Carranza") {
    window.location.href =  "casaAntiguaAteaga.html?id="+id;; // Redirige a sabinas.html
} else if (data.lugar === "Casa Antigua Arteaga") {
    window.location.href = "casaAntiguaAteaga.html?id="+id; // Redirige a monclova.html
} else if (data.lugar === "MOVE Eventos Saltillo") {
    window.location.href = "casaAntiguaAteaga.html?id="+id+"&tipo=asesor"; // Redirige a monclova.html
}else {
    console.error("Lugar no reconocido");
    // Puedes manejar el caso de un lugar no reconocido aquí
}

});