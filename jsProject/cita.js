$(function() {
    // Configuración de Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyBTD0WrmlvOYViJ5J8_Tt3vDzCDmxQL3tQ",
        authDomain: "jassodb-4b8e4.firebaseapp.com",
        projectId: "jassodb-4b8e4",
        storageBucket: "jassodb-4b8e4.appspot.com",
        messagingSenderId: "851107842246",
        appId: "1:851107842246:web:166bb374ed3dd2cf7e6fc7",
        measurementId: "G-WXYY0N3TMG"
    };

    const app = firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    function agregarCita(nuevaCita) {
        const idDocumentoPrincipal = "237fbntZSHSeUD3pUMk2xc4qu9L2";  
        const nuevoIdCita = db.collection("citas").doc().id;

        const docRef = db.collection("citas").doc(idDocumentoPrincipal)
                        .collection("userCitas").doc(nuevoIdCita);

        docRef.set(nuevaCita)  // El método `set` devuelve una promesa
        .then(() => {
            alertify.success("Cita agregada exitosamente.");
            $("#citaForm")[0].reset();
            redirigirWhatsApp(nuevaCita);
        })
        .catch((error) => {
            console.error("Error al agregar la cita: ", error);
        });
    }

    function redirigirWhatsApp(cita) {
        const mensaje = `Hola, mi nombre es ${cita.nombre}. Estoy interesad@ en este vestido de talla ${cita.talla}, me gustaría verlo en persona el día ${cita.fecha} a la hora ${cita.hora_inicio}.`;
        const numeroWhatsApp = "+578444938326";
        const url = `https://api.whatsapp.com/send?phone=${numeroWhatsApp}&text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
    }

    $("#citaForm").on("submit", function(e) {
        e.preventDefault();

        const fechaCita = $("#fechaCita").val();
        const horaInicioCita = $("#horaInicioCita").val();
        const horaFinCita = $("#horaFinCita").val();
        const nombre = $("#nombre").val();
        const celular = $("#celular").val();
        const descripcion = $("#descripcion").val();
        const vestido = $("#vestido").val();
        const talla = $("#talla").val();
        const color = $("#color").val();

        if (horaInicioCita >= horaFinCita) {
            alert("La hora de finalización debe ser posterior a la hora de inicio.");
            return;
        }
        
        const nuevaCita = {
            fecha: fechaCita,
            hora_inicio: horaInicioCita,
            hora_final: horaFinCita,
            nombre: nombre,
            celular: celular,
            descripcion: descripcion,
            vestido: vestido,
            talla: talla,
            color: color,
            estado: "pendiente",
            titulo: "Cita Vestidos"
        };
       
        agregarCita(nuevaCita);
    });
});
