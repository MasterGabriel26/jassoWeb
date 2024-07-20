$(function(){
    initEventListeners();
    initCardScroll();
});

var padrinoCount = 1;
var galeriaFiles = [];
var portadaFiles = []; 

function initEventListeners() {
    $('#galeriaFotos').on('change', function() {
        previewImages(this, 'galeriaPreview');
    });

    $('#portadaFotos').on('change', function() {
        previewImages(this, 'portadaPreview');
    });

    $('#fotoPrimerEncuentro').on('change', function() {
        previewSingleImage(this, 'fotoPrimerEncuentroPreview');
    });

    $('#fotoPrimeraCita').on('change', function() {
        previewSingleImage(this, 'fotoPrimeraCitaPreview');
    });

    $('#fotoPropuesta').on('change', function() {
        previewSingleImage(this, 'fotoPropuestaPreview');
    });

    $('#fotoCompromiso').on('change', function() {
        previewSingleImage(this, 'fotoCompromisoPreview');
    });

    $('#fotoMarido').on('change', function() {
        previewSingleImage(this, 'fotoMaridoPreview');
    });

    $('#fotoMujer').on('change', function() {
        previewSingleImage(this, 'fotoMujerPreview');
    });

    $('#fotoLugar').on('change', function() {
        previewSingleImage(this, 'fotoLugarPreview');
    });

    $(`#fotoPadrino${padrinoCount}`).on('change', function() {
        previewSingleImage(this, `fotoPadrinoPreview${padrinoCount}`);
    });

    $('#addPadrinoButton').on('click', function() {
        showConfirmationDialog(padrinoCount, function() {
            addPadrino();
            showSuccessMessage(`Padrino ${padrinoCount} agregado exitosamente.`);
        });
    });
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
    `;
    document.getElementById('padrinosContainer').appendChild(padrinoDiv);
    $(`#fotoPadrino${padrinoCount}`).on('change', function() {
        previewSingleImage(this, `fotoPadrinoPreview${padrinoCount}`);
    });
}

function previewImages(input, previewContainerId) {
    var previewContainer = document.getElementById(previewContainerId);
    var filesArray = Array.from(input.files);

    if (input.id === 'galeriaFotos') {
        galeriaFiles = galeriaFiles.concat(filesArray);
        updatePreview(galeriaFiles, previewContainer);
    } else if (input.id === 'portadaFotos') {
        portadaFiles = portadaFiles.concat(filesArray);
        updatePreview(portadaFiles, previewContainer);
    }
}

function updatePreview(files, previewContainer) {
    previewContainer.innerHTML = '';
    files.forEach(function(file) {
        var reader = new FileReader();
        reader.onload = function(event) {
            var img = document.createElement('img');
            img.src = event.target.result;
            img.classList.add('card-categoria');
            previewContainer.appendChild(img);
        }
        reader.readAsDataURL(file);
    });
    initializeCarousel(previewContainer.id);
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

function previewSingleImage(input, previewContainerId) {
    var previewContainer = document.getElementById(previewContainerId);
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(event) {
            var img = document.createElement('img');
            img.src = event.target.result;
            img.classList.add('card-categoria');
            previewContainer.innerHTML = '';
            previewContainer.appendChild(img);
        }
        reader.readAsDataURL(input.files[0]);
    }
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
function showConfirmationDialog(padrinoCount, onConfirm) {
    alertify.confirm(
        'Confirmación',
        `¿Desea agregar al padrino ${padrinoCount}?`,
        function() {
            onConfirm();
        },
        function() {
            alertify.error('Cancelado');
        }
    );
}

function showSuccessMessage(message) {
    alertify.success(message);
}