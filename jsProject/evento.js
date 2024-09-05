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

firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
var storage = firebase.storage();

$(function () {
    progress();
    $('#eventForm').on('submit', handleFormSubmit);
});

// Función para previsualizar la imagen seleccionada
document.getElementById('imagenDecoracion').onchange = function(event) {
    const [file] = event.target.files;
    if (file) {
        const preview = document.getElementById('previewImagenDecoracion');
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
    }
};

var galeriaFiles = [];
var portadaFiles = [];

async function getEventData(imageURL) {
    try {
        const eventData = {
            fechaEvento: $('#fechaEvento').val() || '',
            nombrePareja: $('#nombrePareja').val() || '',
            lugarEvento: $('#lugarEvento').val() || '',
            horaLlegadaNovios: $('#horaLlegadaNovios').val() || '',
            horaCivil: $('#horaCivil').val() || '',
            horaMisa: $('#horaMisa').val() || '',
            horaRecepcion: $('#horaRecepcion').val() || '',
            horaCena: $('#horaCena').val() || '',
            horaFinEvento: $('#horaFinEvento').val() || '',
            numeroInvitados: $('#numeroInvitados').val() || '',
            menu: {
                entremes: $('#entremes').val() || '',
                entrada: $('#entrada').val() || '',
                platoFuerte: $('#platoFuerte').val() || '',
                postre: $('#postre').val() || ''
            },
            decoracion: {
                concepto: $('#conceptoDecoracion').val() || '',
                bases: $('#basesDecoracion').val() || '',
                guias: $('#guiasDecoracion').val() || '',
                imagenURL: imageURL || ''  
            },
            ramos: {
                ramoPrincipal: $('#ramoPrincipal').val() || '',
                ramoAventar: $('#ramoAventar').val() || '',
                botoniers: $('#botoniers').val() || ''
            },
            montaje: {
                mesasImperiales: $('#mesasImperiales').val() || '',
                mesasRedondas: $('#mesasRedondas').val() || '',
                mesasCuadradas: $('#mesasCuadradas').val() || '',
                sillas: $('#sillas').val() || '',
                sillasAdicionales: $('#sillasAdicionales').val() || ''
            },
            mantel: {
                colores: $('#coloresMantel').val() || '',
                servilletas: $('#servilletas').val() || '',
                platoBase: $('#platoBase').val() || ''
            },
            detallesEspeciales: $('#detalleEspecial').val() || '',
            adicional: $('#adicional').val() || ''  // Nuevo campo select
        };

        // Validar que todos los campos obligatorios tienen valores
        for (const key in eventData) {
            if (typeof eventData[key] === 'object' && eventData[key] !== null) {
                for (const subKey in eventData[key]) {
                    if (eventData[key][subKey] === '') {
                        throw new Error(`El campo ${subKey} está vacío o no es válido.`);
                    }
                }
            } else if (eventData[key] === '') {
                throw new Error(`El campo ${key} está vacío o no es válido.`);
            }
        }

        return eventData;
    } catch (error) {
        console.error('Error al obtener los datos del formulario: ', error);
        alertify.alert('Error', `Error al obtener los datos del formulario: ${error.message}`);
        throw error;
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    showLoadingDialog();

    try {
        // Subir imagen a Firebase Storage
        const file = document.getElementById('imagenDecoracion').files[0];
        let imageURL = '';
        if (file) {
            imageURL = await uploadImage(file, 'decoracion');
        }

        // Obtener datos del evento junto con la URL de la imagen
        const eventData = await getEventData(imageURL);
        
        // Guardar los datos en Firestore
        await db.collection('eventosHTML').add(eventData);

        alertify.alert('Éxito', 'Evento creado correctamente.', function () {
            location.reload();
        });

    } catch (error) {
        console.error('Error al guardar los datos: ', error);
        alertify.alert('Error', 'Error al guardar los datos. Por favor, intenta nuevamente.');
    } finally {
        hideLoadingDialog();
    }
}

// Función para subir la imagen a Firebase Storage
async function uploadImage(file, folder) {
    const storageRef = storage.ref();
    const timestamp = new Date().getTime();
    const fileRef = storageRef.child(`eventosHTML/${folder}/${timestamp}_${file.name}`);
    const uploadTask = fileRef.put(file);

    return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
            (snapshot) => { },
            (error) => reject(error),
            () => {
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => resolve(downloadURL));
            }
        );
    });
}

function showLoadingDialog() {
    document.getElementById('loadingDialog').style.display = 'flex';
    lottie.loadAnimation({
        container: document.getElementById('loadingAnimation'),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: './css/loading.json'
    });
}

function hideLoadingDialog() {
    document.getElementById('loadingDialog').style.display = 'none';
}

function initCardScroll() {
    const containers = document.querySelectorAll('.card-scroll-container');
    containers.forEach(container => {
        let isDown = false;
        let startX;
        let scrollLeft;

        container.addEventListener('mousedown', (e) => {
            isDown = true;
            container.classList.add('grabbing');
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
        });

        container.addEventListener('mouseleave', () => {
            isDown = false;
            container.classList.remove('grabbing');
        });

        container.addEventListener('mouseup', () => {
            isDown = false;
            container.classList.remove('grabbing');
        });

        container.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 3;
            container.scrollLeft = scrollLeft - walk;
        });

        container.addEventListener('touchstart', (e) => {
            isDown = true;
            container.classList.add('grabbing');
            startX = e.touches[0].pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
        });

        container.addEventListener('touchend', () => {
            isDown = false;
            container.classList.remove('grabbing');
        });

        container.addEventListener('touchmove', (e) => {
            if (!isDown) return;
            const x = e.touches[0].pageX - container.offsetLeft;
            const walk = (x - startX) * 3;
            container.scrollLeft = scrollLeft - walk;
        });
    });
}

function progress() {
    $('#circleProgress').circleProgress({
        value: 0,
        size: 60,
        fill: {
            color: "#3498db"
        }
    });

    $('#eventForm').on('input change', function () {
        var progress = calculateProgress();
        updateProgress(progress);
    });

    var initialProgress = calculateProgress();
    updateProgress(initialProgress);
}

function calculateProgress() {
    var totalFields = $('#eventForm').find('input, textarea, select').length;
    var filledFields = 0;

    $('#eventForm').find('input, textarea, select').each(function () {
        if ($(this).val() && $(this).val() !== '') {
            filledFields++;
        }
    });

    var progress = (filledFields / totalFields) * 100;
    return Math.round(progress);
}

function updateProgress(value) {
    $('#circleProgress').circleProgress('value', value / 100);
    $('#progressText').text(value + '%');

    if (value >= 100) {
        $('#circleProgress').circleProgress({
            fill: {
                color: "#28a745"
            }
        });
    } else {
        $('#circleProgress').circleProgress({
            fill: {
                color: "#3498db"
            }
        });
    }
}

