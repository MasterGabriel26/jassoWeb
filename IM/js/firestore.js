
// Configuración de Firebase
var f1 = "AIzaSyBTD0WrmlvOYViJ5J8_Tt3vDzCDmxQL3tQ";
var f2 = "jassodb-4b8e4.firebaseapp.com";
var f3 = "jassodb-4b8e4";
var f4 = "jassodb-4b8e4.appspot.com";
var f5 = "851107842246";
var f6 = "1:851107842246:web:166bb374ed3dd2cf7e6fc7";
var f7 = "G-WXYY0N3TMG";

const firebaseConfig = {
    apiKey: f1,
    authDomain: f2,
    projectId: f3,
    storageBucket: f4,
    messagingSenderId: f5,
    appId: f6,
    measurementId: f7
};

firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
var storage = firebase.storage();

function getQueryParam(param) {
    var urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

var idGrupo = "";

$(function () {
    initEventListeners();
    initCardScroll(); // Inicializar la funcionalidad de scroll de tarjetas
    idGrupo = getQueryParam("idGrupoInvitados");
    cargarDatosCliente(idGrupo)
  
    progress()
});
function cargarDatosCliente(idGrupo) {


}

var padrinoCount = 1;
var galeriaFiles = [];
var portadaFiles = [];

function initEventListeners() {
    let optionsHtml = '';
    for (const key in LUGARES) {
        if (LUGARES.hasOwnProperty(key)) {
            optionsHtml += `<option value="${key}">${key}</option>`;
        }
    }
    $('#lugarEvento').html(optionsHtml);

    $('#galeriaFotos').on('change', function () {
        compressAndPreviewImages(this, 'galeriaPreview', galeriaFiles, 'galeriaImageCount', 10);
    });
    
    $('#portadaFotos').on('change', function () {
        compressAndPreviewImages(this, 'portadaPreview', portadaFiles, 'portadaImageCount', 2);
    });

    $('#fotoPrimerEncuentro').on('change', function () {
        compressAndPreviewSingleImage(this, 'fotoPrimerEncuentroPreview');
    });

    $('#fotoPrimeraCita').on('change', function () {
        compressAndPreviewSingleImage(this, 'fotoPrimeraCitaPreview');
    });

    $('#fotoPropuesta').on('change', function () {
        compressAndPreviewSingleImage(this, 'fotoPropuestaPreview');
    });

    $('#fotoCompromiso').on('change', function () {
        compressAndPreviewSingleImage(this, 'fotoCompromisoPreview');
    });

    $('#fotoMarido').on('change', function () {
        compressAndPreviewSingleImage(this, 'fotoMaridoPreview');
    });

    $('#fotoMujer').on('change', function () {
        compressAndPreviewSingleImage(this, 'fotoMujerPreview');
    });

    $('#fotoLugar').on('change', function () {
        compressAndPreviewSingleImage(this, 'fotoLugarPreview');
    });

    $(`#fotoPadrino1`).on('change', function () {
        compressAndPreviewSingleImage(this, `fotoPadrinoPreview1`);
    });

    $('#addPadrinoButton').on('click', function () {
        showConfirmationDialog(function () {
            addPadrino();
            showSuccessMessage(`Padrino ${padrinoCount} agregado exitosamente.`);
        });
    });

    $('#weddingForm').on('submit', handleFormSubmit);
}

function addPadrino() {
    padrinoCount++;
    var padrinoDiv = document.createElement('div');
    padrinoDiv.classList.add('form-group', 'padrino');
    padrinoDiv.innerHTML = `
        <label for="nombrePadrino${padrinoCount}">Nombre del Padrino</label>
        <input type="text" id="nombrePadrino${padrinoCount}" name="nombrePadrino[]" placeholder="Ej: Nombre del Padrino" required>
        <label for="fotoPadrino${padrinoCount}">Foto del Padrino</label>
        <input type="file" id="fotoPadrino${padrinoCount}" name="fotoPadrino[]" accept="image/*" required>
        <div class="single-image-preview" id="fotoPadrinoPreview${padrinoCount}"></div>
        <div class="genero-container">
            <label>Género:</label>
            <div class="radio-group">
                <input type="radio" id="padrinoHombre${padrinoCount}" name="generoPadrino${padrinoCount}" value="hombre" checked>
                <label for="padrinoHombre${padrinoCount}">Hombre</label>
            </div>
            <div class="radio-group">
                <input type="radio" id="padrinoMujer${padrinoCount}" name="generoPadrino${padrinoCount}" value="mujer">
                <label for="padrinoMujer${padrinoCount}">Mujer</label>
            </div>
        </div>
    `;
    document.getElementById('padrinosContainer').appendChild(padrinoDiv);
    $(`#fotoPadrino${padrinoCount}`).on('change', function () {
        compressAndPreviewSingleImage(this, `fotoPadrinoPreview${padrinoCount}`);
    });
    var progressValue = calculateProgress();
        updateProgress(progressValue);
}

function compressAndPreviewImages(input, previewContainerId, filesArray, countElementId, maxFiles) {
    var previewContainer = document.getElementById(previewContainerId);
    var newFilesArray = Array.from(input.files);

    // Verificar si se excede el límite de archivos
    if (filesArray.length + newFilesArray.length > maxFiles) {
        alert(`No puedes seleccionar más de ${maxFiles} imágenes.`);
        return;
    }

    newFilesArray.forEach(file => {
        new Compressor(file, {
            quality: 0.6, // Reduce la calidad para comprimir
            success(result) {
                filesArray.push(result);
                updatePreview(filesArray, previewContainer);
                updateImageCount(filesArray, countElementId, maxFiles);
            },
            error(err) {
                console.log(err.message);
            },
        });
    });
}
function updateImageCount(filesArray, countElementId, maxFiles) {
    var imageCountElement = document.getElementById(countElementId);
    if (imageCountElement) {
        imageCountElement.textContent = `${filesArray.length}/${maxFiles} imágenes seleccionadas`;
    } else {
        console.error(`Elemento con id ${countElementId} no encontrado.`);
    }
}
function compressAndPreviewSingleImage(input, previewContainerId) {
    var previewContainer = document.getElementById(previewContainerId);

   

    if (input.files && input.files[0]) {
        new Compressor(input.files[0], {
            quality: 0.6, // Reduce la calidad para comprimir
            success(result) {
                var reader = new FileReader();
                reader.onload = function (event) {
                    var img = document.createElement('img');
                    img.src = event.target.result;
                    img.classList.add('card-categoria');
                    previewContainer.innerHTML = '';
                    previewContainer.appendChild(img);
                }
                reader.readAsDataURL(result);
            },
            error(err) {
                console.log(err.message);
            },
        });
    }
}


function updatePreview(files, previewContainer) {
    previewContainer.innerHTML = '';
    files.forEach(function (file) {
        var reader = new FileReader();
        reader.onload = function (event) {
            var img = document.createElement('img');
            img.src = event.target.result;
            img.classList.add('card-categoria');
            previewContainer.appendChild(img);
        }
        reader.readAsDataURL(file);
    });
    initializeCarousel(previewContainer.id);
}


async function getWeddingData() {
    try {
        const pareja = {
            nombreMarido: $('#nombreMarido').val() || '',
            generoMarido: $('input[name="generoMarido"]:checked').val() || 'hombre',
            descripcionMarido: $('#descripcionMarido').val() || '',
            fotoMarido: await uploadImage($('#fotoMarido').prop('files')[0], 'pareja') || '',
            nombreMujer: $('#nombreMujer').val() || '',
            generoMujer: $('input[name="generoMujer"]:checked').val() || 'mujer',
            descripcionMujer: $('#descripcionMujer').val() || '',
            fotoMujer: await uploadImage($('#fotoMujer').prop('files')[0], 'pareja') || ''
        };

        // Validar que todos los campos obligatorios tienen valores
        for (const key in pareja) {
            if (pareja[key] === '') {
                throw new Error(`El campo ${key} está vacío o no es válido.`);
            }
        }

        const historia = {
            primerEncuentro: {
                descripcion: $('#primerEncuentro').val() || '',
                fecha: $('#fechaPrimerEncuentro').val() || '',
                foto: await uploadImage($('#fotoPrimerEncuentro').prop('files')[0], 'historia') || ''
            },
            primeraCita: {
                descripcion: $('#primeraCita').val() || '',
                fecha: $('#fechaPrimeraCita').val() || '',
                foto: await uploadImage($('#fotoPrimeraCita').prop('files')[0], 'historia') || ''
            },
            propuesta: {
                descripcion: $('#propuesta').val() || '',
                fecha: $('#fechaPropuesta').val() || '',
                foto: await uploadImage($('#fotoPropuesta').prop('files')[0], 'historia') || ''
            },
            compromiso: {
                descripcion: $('#compromiso').val() || '',
                fecha: $('#fechaCompromiso').val() || '',
                foto: await uploadImage($('#fotoCompromiso').prop('files')[0], 'historia') || ''
            }
        };

        const detallesEvento = {
            fechaEvento: $('#fechaEvento').val() || '',
            descripcionEvento: $('#descripcionEvento').val() || '',
            fotoLugar: await uploadImage($('#fotoLugar').prop('files')[0], 'evento') || '',
            lugarEvento: $('#lugarEvento').val() || '',
            horaCeremonia: $('#horaCeremonia').val() || '',
            horaRecepcion: $('#horaRecepcion').val() || '',
            redesSociales: {
                facebook: $('#facebookLugar').val() || '',
                instagram: $('#instagramLugar').val() || ''
            },
            codigoVestimentaHombre: $('#codigoVestimentaHombre').val() || '',
            codigoVestimentaMujer: $('#codigoVestimentaMujer').val() || ''
        };

        const galeriaFotos = await Promise.all(
            Array.from($('#galeriaFotos').prop('files')).map(file => uploadImage(file, 'galeria'))
        );

        const portadaFotos = await Promise.all(
            Array.from($('#portadaFotos').prop('files')).map(file => uploadImage(file, 'portada'))
        );

        const padrinos = await Promise.all(
            $('.padrino').map(async function () {
                const nombre = $(this).find('input[name="nombrePadrino[]"]').val() || '';
                const genero = $(this).find('input[name^="generoPadrino"]:checked').val() || 'hombre';
                const fotoInput = $(this).find('input[name="fotoPadrino[]"]');
                if (fotoInput.prop('files').length > 0) {
                    const foto = await uploadImage(fotoInput.prop('files')[0], 'padrinos') || '';
                    return { nombre, genero, foto };
                }
                return { nombre, genero, foto: '' };
            }).get()
        );

        return {
            idGrupoInvitacion: idGrupo,
            pareja,
            descripcionFelicidad: $('#descripcionFelicidad').val() || '',
            detallesEvento,
            historia,
            galeriaFotos,
            portadaFotos,
            padrinos
        };
    } catch (error) {
        console.error('Error al obtener los datos del formulario: ', error);
        alertify.alert('Error', `Error al obtener los datos del formulario: ${error.message}`);
        throw error; // Lanzar error para que se capture en handleFormSubmit
    }
}


function initializeCarousel(previewContainerId) {
    $('#' + previewContainerId).not('.slick-initialized').slick({
        infinite: true,
        slidesToShow: 3,
        slidesToScroll: 1,
        prevArrow: '<button type="button" class="slick-prev">‹</button>',
        nextArrow: '<button type="button" class="slick-next">›</button>',
    });
}

function showConfirmationDialog(onConfirm) {
    alertify.confirm(
        'Confirmación',
        '¿Desea agregar un padrino?',
        function () {
            onConfirm();
        },
        function () {
            alertify.error('Cancelado');
        }
    );
}

function showSuccessMessage(message) {
    alertify.success(message);
}

async function uploadImage(file, folder) {
    const storageRef = storage.ref();
    const timestamp = new Date().getTime();
    const fileRef = storageRef.child(`tarjeta/${folder}/${timestamp}_${file.name}`);
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



async function handleFormSubmit(event) {
    event.preventDefault();
    showLoadingDialog();

    try {
        const weddingData = await getWeddingData();
        await db.collection('tarjetaInvitacion').add(weddingData);

        // Usa alertify.alert para confirmar antes de recargar
        alertify.alert('Éxito', 'Tarjeta de invitación creada correctamente.', function () {
            location.reload(); // Solo recarga la página después de que el usuario presione OK
        });

    } catch (error) {
        console.error('Error al guardar los datos: ', error);
        alertify.alert('Error', 'Error al guardar los datos. Por favor, intenta nuevamente.');
    } finally {
        hideLoadingDialog();
    }
}

function showLoadingDialog() {
    document.getElementById('loadingDialog').style.display = 'flex';
    lottie.loadAnimation({
        container: document.getElementById('loadingAnimation'),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: './assets/loading.json' // URL del archivo Lottie
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
            const walk = (x - startX) * 3; // Scroll-fast
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
            const walk = (x - startX) * 3; // Scroll-fast
            container.scrollLeft = scrollLeft - walk;
        });
    });
}

function progress() {
    // Inicializar el progreso circular
    $('#circleProgress').circleProgress({
        value: 0,
        size: 100,
        fill: {
            color: "#3498db"
        }
    });

    // Función para actualizar el progreso
  

    // Función para calcular el progreso del formulario
   

    // Evento para actualizar el progreso cuando se cambie el formulario
    $('#weddingForm').on('input change', function() {
        var progress = calculateProgress();
        updateProgress(progress);
    });

    // Actualizar el progreso inicialmente
    var initialProgress = calculateProgress();
    updateProgress(initialProgress);
}
function calculateProgress() {
    // Selecciona todos los campos relevantes (input, textarea, select)
    var totalFields = $('#weddingForm').find('input, textarea, select').length;
    var filledFields = 0;

    $('#weddingForm').find('input, textarea, select').each(function() {
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
    
    // Cambiar el color del progreso a verde cuando sea 100%
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

