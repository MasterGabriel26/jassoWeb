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

//variables


var db = firebase.firestore();
var idTarjeta = "";
var idInvitado = "";
var idGrupo = ""
var nombreInvitado = "";
var mesaInvitado = "";
var statusInvitado = "";
var numeroAcompanantes = "";
var colorQR = "#121F38"
let acompanantes = [];
$(function () {
    idTarjeta = getQueryParam("tj");
    idInvitado = getQueryParam("in");
    $("#miQR").hide()
    $("#acompanantes").hide()

    if (idTarjeta) {
        loadTarjeta(idTarjeta);

    }

    if (idInvitado) {
        loadInvitado(idInvitado);

    }

    if (idInvitado == null && idTarjeta == null) {
        window.location.href = "error.html"

    }

    $("#confirmarAsistencia").click(function (e) {
        e.preventDefault(); // Prevent default button action
        db.collection('invitados').doc(idInvitado).update({
            status: CONFIRMADA,
            personas: (acompanantes.length + 1).toString(),
            listadoAcompanantes: acompanantes
        })
            .then(() => {
                console.log("Status updated to CONFIRMADA");
                $("#rsvpModal").modal("hide")
                $("#qrModal").modal("show")
            })
            .catch(error => {
                console.error("Error updating status: ", error);
            });
    });


    $("#botonNoAsistire").click(function (e) {
        e.preventDefault(); // Prevent default button action
        db.collection('invitados').doc(idInvitado).update({
            status: NO_ASISTIRA
        })
            .then(() => {
                console.log("Status updated to CONFIRMADA");
                $("#botonConfirmar").show()
                alert("Notificada tu ausencia.");
            })
            .catch(error => {
                console.error("Error updating status: ", error);
            });
    });

    $('#guardarAcompanantes').on('click', function (event) {
        event.preventDefault(); // Prevenir la recarga de la página
        let allFilled = true;
        acompanantes = [];

        // Recolectar todos los nombres de los inputs y verificar que no estén vacíos
        $('#acompanantesInputsContainer .form-control').each(function () {
            if (!$(this).val()) {
                allFilled = false;
                $(this).addClass('is-invalid'); // Agrega una clase para indicar error
            } else {
                $(this).removeClass('is-invalid');
                acompanantes.push($(this).val()); // Agrega el valor al array si no está vacío
            }
        });

        if (!allFilled) {
            alertify.alert('Error', 'Por favor, complete todos los campos antes de guardar.');

            return false; // Detiene la función si algún campo está vacío
        }

        // Aquí podrías enviar 'acompanantes' a un servidor o almacenarlo como prefieras
        console.log(acompanantes); // Imprime la lista de acompañantes en la consola

        // Cerrar el modal actual y abrir el siguiente si es necesario
        $('#accompanyingGuestsModal').modal('hide');

        // Si necesitas abrir otro modal inmediatamente, puedes hacerlo aquí.
        $("#listaAcompanantes").html(acompanantes.length)
        $("#rsvpModal").modal("show")
    });

});

// Ejemplo de función que se llama cuando cambia el select en otro modal o en cualquier lógica de tu aplicación
function updateAccompanyingGuests(count) {
    const container = $('#acompanantesInputsContainer');
    container.empty(); // Limpiar antiguos inputs

    for (let i = 1; i <= count; i++) {
        container.append(`<div class="form-group">
            <label for="acompanante_${i}">Acompañante ${i}</label>
            <input type="text" id="acompanante_${i}" name="acompanante_${i}" class="form-control" placeholder="Nombre del acompañante ${i}">
        </div>`);
    }
}



function getQueryParam(param) {
    var urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function loadInvitado(idInvitado) {
    db.collection('invitados').doc(idInvitado).onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            idGrupo = data.idGrupoInvitados;
            nombreInvitado = data.nombre;
            mesaInvitado = data.mesa;
            statusInvitado = data.status;
            numeroAcompanantes = data.personas;

            $("#status").html(statusInvitado);

            if (statusInvitado === 'CONFIRMADA' || statusInvitado === 'INGRESADO') {
                $("#botonConfirmar").hide()
                $("#invitationName").html(nombreInvitado + " y sus " + (numeroAcompanantes - 1) + " acompañante(s)");
                $("#assignedTable").text("Mesa asignada: " + mesaInvitado);

                if (statusInvitado === 'INGRESADO') {
                    colorQR = "#0b9422";
                    $("#status").html("Estado: Ingresado");
                    $("#status").css("color", colorQR);

                } else {


                    colorQR = "#121F38"; // Valor predeterminado para CONFIRMADA
                }
                $("#miQR").show();
                $("#acompanantes").show()
            } else {
                $("#miQR").hide();
                $("#acompanantes").hide()
            }
            acompanantes

            // Agregar opciones al select de número de invitados
            var select = $('#numeroInvitadosSelect');
            select.empty(); // Limpiar opciones existentes
            for (let i = numeroAcompanantes - 1; i >= 0; i--) {
                select.append(`<option value="${i}">${i}</option>`);
            }
            select.val();
            updateAccompanyingGuests(numeroAcompanantes - 1)

            updateAccompanyingGuests(numeroAcompanantes - 1)
            if (mesaInvitado=="") {
                 $("#li-mesaAsignada").hide()
            }else{               
                $("#li-mesaAsignada").show()
               $(".mesaAsignada").html(`${mesaInvitado}`); 
            }
            



            getIdGrupoInvitado(idGrupo);
        } else {
            console.log('No such document!');
            window.location.href = "error.html"
        }
    }, error => {
        window.location.href = "error.html"
        console.error('Error getting document: ', error);
    });
}


function getIdGrupoInvitado(idGrupo) {
    return db.collection('tarjetaInvitacion')
        .where('idGrupoInvitacion', '==', idGrupo)
        .get()
        .then(querySnapshot => {
            if (!querySnapshot.empty) {
                // Asumiendo que solo habrá un documento que cumple con la condición
                idTarjeta = querySnapshot.docs[0].id;
                idTarjeta = querySnapshot.docs[0].id;

                loadTarjeta(idTarjeta);
                iniciarQR(idInvitado);
            } else {
                window.location.href = "error.html"
                console.log('No matching documents found.');
                return null;
            }
        })
        .catch(error => {
            window.location.href = "error.html"
            console.error('Error searching for documents: ', error);
            return null;
        });
}

function updateMetaImage(imageUrl) {
    // Revisa si ya existe una etiqueta og:image, si no, la crea.
    let ogImageTag = document.querySelector('meta[property="og:image"]');
    if (!ogImageTag) {
        ogImageTag = document.createElement('meta');
        ogImageTag.setAttribute('property', 'og:image');
        document.getElementsByTagName('head')[0].appendChild(ogImageTag);
    }
    ogImageTag.setAttribute('content', imageUrl);
}
function loadTarjeta(docId) {

    db.collection('tarjetaInvitacion').doc(docId).get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            // Aquí ajustamos la metaetiqueta og:image con la imagen de la pareja
            updateMetaImage(data.pareja.fotoMujer);

            // Novios
            const novio = data.pareja.generoMarido === 'hombre' ? 'Novio' : 'Novia';
            const novia = data.pareja.generoMujer === 'mujer' ? 'Novia' : 'Novio';



            $('#novioNovia').text(`${novio} & ${novia}`);
            $('#novio').text(novio);
            $('#novia').text(novia);
            $('.novios').text(data.pareja.nombreMarido + " & " + data.pareja.nombreMujer);


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

            // $(".vestido-hombre").html(`Vestido hombre: ${vestidoHombre}`);
            $(".hora-evento").text(data.detallesEvento.horaCeremonia);
            $(".direccion").text(direccion);

            $('#lugarEvento').text(nombreLugar);
            $('#direccion').text(direccion);
            $('.mapa').html(iframe);


            // $('#lugarEvento').text(data.detallesEvento.lugarEvento);
            $('#horaCeremonia').text(data.detallesEvento.horaCeremonia);
            $('#horaRecepcion').text("Hora: " + data.detallesEvento.horaRecepcion);

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

function iniciarQR(idInvitado) {
    // Borrar cualquier QR existente antes de crear uno nuevo
    var qrElement = document.getElementById("qrcode");
    qrElement.innerHTML = ""; // Limpiar QR anterior
    const url = "https://jassocompany.com/IM/index.html?tj=" + idTarjeta + "&in=" + idInvitado + "&idGrupo=" + idGrupo
    console.log("url " + url)
    var qrCode = new QRCode(qrElement, {
        text: url,
        width: 300,
        height: 300,
        colorDark: colorQR,
        colorLight: "#fff",
        correctLevel: QRCode.CorrectLevel.H
    });

    document.getElementById('downloadQR').addEventListener('click', function () {
        const scannerLine = document.querySelector('.scanner-line');
        scannerLine.style.display = 'none';
        console.log("descargando");
        html2canvas(document.querySelector('#qrModal .modal-body')).then(canvas => {
            console.log("descargando21");
            let link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = 'invitacion.png';
            link.click();
        }).catch(error => {
            console.error('Error generating canvas:', error);
        }).finally(() => {
            scannerLine.style.display = 'block'; // Mostrar nuevamente la línea del escáner después de la descarga
        });
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