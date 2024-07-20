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

$(function() {
    loadInvitacion("RJvrdlnY9uu1GnLwQ8Mm");
    iniciarQR()
});

function loadInvitacion(docId) {
    db.collection('tarjetaInvitacion').doc(docId).get().then(doc => {
        if (doc.exists) {
            const data = doc.data();

            // Novios
            const novio = data.pareja.generoMarido === 'hombre' ? 'Novio' : 'Novia';
            const novia = data.pareja.generoMujer === 'mujer' ? 'Novia' : 'Novio';

            $('#novioNovia').text(`${novio} & ${novia}`);
            $('#novio').text(novio);
            $('#novia').text(novia);
            $('.novios').text(data.pareja.nombreMarido+" & "+data.pareja.nombreMujer);
            
            
            $('.nombreMarido').text(data.pareja.nombreMarido);
            $('#descripcionMarido').text(data.pareja.descripcionMarido);
            $('#fotoMarido').attr('src', data.pareja.fotoMarido);
            $('.nombreMujer').text(data.pareja.nombreMujer);
            $('#descripcionMujer').text(data.pareja.descripcionMujer);
            $('#fotoMujer').attr('src', data.pareja.fotoMujer);

            $('#descripcionFelicidad').text(data.descripcionFelicidad);
            $('#navbarBrand').html(`${data.pareja.nombreMarido} <span class="text-primary">&</span> ${data.pareja.nombreMujer}`);

            // Detalles del Evento
            $('#fechaEvento').text(data.detallesEvento.fechaEvento);
            $('#descripcionEvento').text(data.detallesEvento.descripcionEvento);
            $('#fotoLugar').attr('src', data.detallesEvento.fotoLugar);
            
            const lugarClave = data.detallesEvento.lugarEvento;
            const nombreLugar = LUGARES[lugarClave] ? LUGARES[lugarClave].lugar : lugarClave;
            const direccion = LUGARES[lugarClave] ? LUGARES[lugarClave].direccion : '';
            const iframe = LUGARES[lugarClave] ? LUGARES[lugarClave].iframe : '';
            console.log(direccion)
            $('#lugarEvento').text(nombreLugar);
            $('#direccion').text(direccion);
            $('.mapa').html(iframe);
            
            
            // $('#lugarEvento').text(data.detallesEvento.lugarEvento);
            $('#horaCeremonia').text(data.detallesEvento.horaCeremonia);
            $('#horaRecepcion').text("Hora: "+data.detallesEvento.horaRecepcion);

            // Historia
            $('#fechaPrimerEncuentro').text(data.historia.primerEncuentro.fecha);
            $('#descripcionPrimerEncuentro').text(data.historia.primerEncuentro.descripcion);
            $('#fotoPrimerEncuentro').attr('src', data.historia.primerEncuentro.foto);

            $('#fechaPrimeraCita').text(data.historia.primeraCita.fecha);
            $('#descripcionPrimeraCita').text(data.historia.primeraCita.descripcion);
            $('#fotoPrimeraCita').attr('src', data.historia.primeraCita.foto);

            $('#fechaPropuesta').text(data.historia.propuesta.fecha);
            $('#descripcionPropuesta').text(data.historia.propuesta.descripcion);
            $('#fotoPropuesta').attr('src', data.historia.propuesta.foto);

            $('#fechaCompromiso').text(data.historia.compromiso.fecha);
            $('#descripcionCompromiso').text(data.historia.compromiso.descripcion);
            $('#fotoCompromiso').attr('src', data.historia.compromiso.foto);

            // Galería y Portada
            loadGaleria(data.galeriaFotos);
            loadPortada(data.portadaFotos);

            // Padrinos
            loadPadrinos(data.padrinos);
        } else {
            console.log("No such document!");
        }
    }).catch(error => {
        console.error("Error getting document:", error);
    });
}

function iniciarQR(){
    var qrCode = new QRCode(document.getElementById("qrcode"), {
        text: "",
        width: 300,
        height: 300,
        colorDark: "#121F38",
        colorLight: "#E47A2E",
        correctLevel: QRCode.CorrectLevel.H
    });

    $('#qrModal').on('show.bs.modal', function () {
        qrCode.makeCode("https://www.wippi.com.co");
    });
}
function loadGaleria(galeriaFotos) {
    const galeriaContainer = $('.gallery-carousel');
    let item = "";

    galeriaFotos = galeriaFotos.map(fotoUrl => fotoUrl.replace(/^"(.*)"$/, '$1'));
    
    galeriaFotos.forEach(fotoUrl => {
        item += `
            <div class="gallery-item">
                <img class="img-fluid w-100" src="${fotoUrl}" alt="">
                <a href="${fotoUrl}" data-lightbox="gallery">
                    <i class="fa fa-2x fa-plus text-white"></i>
                </a>
            </div>
        `;
        console.log(fotoUrl);
    });

    galeriaContainer.html(item);
    
    galeriaContainer.owlCarousel('destroy'); // Asegúrate de destruir cualquier instancia previa
    galeriaContainer.owlCarousel({
        items: 1,
        loop: true,
        nav: true,
        dots: false,
        autoplay: true,
        smartSpeed: 1000,
        margin: 30,
        navText: [
            '<i class="fa fa-angle-left"></i>',
            '<i class="fa fa-angle-right"></i>'
        ],
        responsive: {
            0: {
                items: 1
            },
            576: {
                items: 2
            },
            768: {
                items: 3
            },
            992: {
                items: 4
            }
        }
    });
}

function loadPortada(portadaFotos) {
    $('#fotoPortada1').attr('src', portadaFotos[0]);
    if (portadaFotos.length > 1) {
        $('#fotoPortada2').attr('src', portadaFotos[1]);
    }
}

function loadPadrinos(padrinos) {
    const padrinosContainer = $('#padrinosContainer');
    padrinosContainer.empty(); // Limpiar el contenedor antes de agregar nuevos elementos
    var item = ""
    padrinos.forEach(padrino => {
        const tipo = padrino.genero === 'hombre' ? 'Padrino' : 'Madrina';
        item += `
            <div class="col-lg-6 col-md-6 mb-4 portfolio-item first">
                <div class="position-relative mb-2">
                    <img class="img-fluid w-100" src="${padrino.foto}" alt="">
                    <div class="bg-secondary text-center p-4">
                        <h4 class="mb-3">${padrino.nombre}</h4>
                        <p class="text-uppercase">${tipo}</p>
                        <div class="d-inline-block">
                            <a class="mx-2" href="#"><i class="fab fa-twitter"></i></a>
                            <a class="mx-2" href="#"><i class="fab fa-facebook-f"></i></a>
                            <a class="mx-2" href="#"><i class="fab fa-linkedin-in"></i></a>
                            <a class="mx-2" href="#"><i class="fab fa-instagram"></i></a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    padrinosContainer.html(item);
}

function startImageRotation(images) {
    let currentIndex = 0;
    const galleryImage = document.getElementById('galleryImage');
console.log(images)
    setInterval(() => {
        galleryImage.style.opacity = 0;
        setTimeout(() => {
          
            galleryImage.src = images[currentIndex];
            galleryImage.style.opacity = 1;
            currentIndex = (currentIndex + 1) % images.length;
            // console.log(galleryImage)
        }, 3000); // Match the transition duration in CSS
    }, 5000); // Change image every 2 seconds (1 second fade out + 1 second fade in)
}