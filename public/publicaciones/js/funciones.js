// Variables globales
const API_BASE_URL = 'http://localhost:8000/api/v1';
window.publicacionActualId = null;
window.mediosTemporales = [];

document.addEventListener("DOMContentLoaded", function () {
    populateSelect("lugar", "lugares", "nombreLugar");
})



function populateSelect(selectId, collectionName, attribute) {
    const select = document.getElementById(selectId);
    db.collection(collectionName)
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const option = document.createElement("option");
                const data = doc.data();
                option.value = data[attribute];     // Usar el nombre como valor
                option.textContent = data[attribute]; // Usar el nombre como texto
                select.appendChild(option);
            });
        })
        .catch((error) => {
            console.error("Error fetching data: ", error);
        });
}


// Inicialización
$(async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');

    await iniciarTiny();

    if (itemId) {
        // Esperar un momento para asegurarnos de que TinyMCE está listo
        setTimeout(async () => {
            await cargarItemParaEditar(itemId);
        }, 500);
    }

    inicializarEventos();
});
//
function iniciarTiny() {
    return tinymce.init({
        selector: '#editor',
        height: '100%',
        plugins: [
            'importcss', 'searchreplace', 'autolink', 'autosave', 'save',
            'directionality', 'code', 'visualblocks', 'visualchars', 'fullscreen',
            'image', 'link', 'media', 'codesample', 'table', 'charmap', 'pagebreak',
            'nonbreaking', 'anchor', 'insertdatetime', 'advlist', 'lists',
            'wordcount', 'help', 'charmap', 'quickbars', 'emoticons'
        ],
        toolbar: [
            'undo redo | styles | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify |',
            'bullist numlist | outdent indent | link image media | forecolor backcolor emoticons |',
            'removeformat code fullscreen help'
        ].join(' '),

        // Configuración de menús
        menubar: 'file edit view insert format tools table help',
        menu: {
            file: { title: 'File', items: 'newdocument restoredraft | print' },
            edit: { title: 'Edit', items: 'undo redo | cut copy paste pastetext | selectall | searchreplace' },
            view: { title: 'View', items: 'code | visualaid visualchars visualblocks | spellchecker | fullscreen' },
            insert: { title: 'Insert', items: 'image link media | codesample inserttable | charmap emoticons hr | pagebreak nonbreaking anchor | insertdatetime' },
            format: { title: 'Format', items: 'bold italic underline strikethrough superscript subscript | formats blockformats fontformats fontsizes align lineheight | forecolor backcolor | removeformat' },
            tools: { title: 'Tools', items: 'spellchecker code wordcount' },
            table: { title: 'Table', items: 'inserttable | cell row column | advtablesort | tableprops deletetable' }
        },

        // Configuración de imágenes
        image_title: true,
        image_caption: true,
        image_description: true,
        image_dimensions: true,
        image_advtab: true,
        image_uploadtab: true,
        images_upload_base_path: '/uploads',
        images_upload_credentials: true,
        images_reuse_filename: true,

        // Configuración de medios
        media_poster: true,
        media_alt_source: true,
        media_dimensions: true,
        media_live_embeds: true,
        media_upload_tab: true,

        // Manejador de subida de imágenes
        images_upload_handler: async function(blobInfo, progress) {
            try {
                const imagenComprimida = await comprimirImagen(blobInfo.blob());
                const resultado = await subirArchivo(imagenComprimida, 'imagenes');
                return resultado.url;
            } catch (error) {
                console.error('Error al subir imagen:', error);
                throw new Error('Error al subir la imagen: ' + error.message);
            }
        },

        // Selector de archivos
        file_picker_callback: function(callback, value, meta) {
            var input = document.createElement('input');
            input.setAttribute('type', 'file');
            
            if (meta.filetype === 'image') {
                input.setAttribute('accept', 'image/*');
            } else if (meta.filetype === 'media') {
                input.setAttribute('accept', 'video/*');
            } else {
                input.setAttribute('accept', '.pdf,.doc,.docx,.xls,.xlsx');
            }

            input.onchange = async function() {
                var file = this.files[0];
                
                try {
                    let resultado;
                    if (meta.filetype === 'image') {
                        const imagenComprimida = await comprimirImagen(file);
                        resultado = await subirArchivo(imagenComprimida, 'imagenes');
                    } else {
                        resultado = await subirArchivo(file, meta.filetype === 'media' ? 'videos' : 'documentos');
                    }

                    callback(resultado.url, {
                        title: file.name,
                        width: meta.filetype === 'media' ? '100%' : '',
                        height: meta.filetype === 'media' ? 'auto' : ''
                    });
                } catch (error) {
                    console.error('Error al subir archivo:', error);
                    tinymce.activeEditor.notificationManager.open({
                        text: 'Error al subir el archivo: ' + error.message,
                        type: 'error',
                        timeout: 3000
                    });
                }
            };
            
            input.click();
        },

        // Configuraciones adicionales
        automatic_uploads: true,
        file_picker_types: 'file image media',
        images_upload_url: null,
        images_upload_credentials: true,
        images_reuse_filename: true,
        media_upload_url: null,
        media_upload_credentials: true,
        paste_data_images: true,
        paste_as_text: false,
        branding: false,
        promotion: false,
        
        // Configuración de autosave
        autosave_ask_before_unload: true,
        autosave_interval: '30s',
        autosave_prefix: 'tinymce-autosave-{path}{query}-{id}-',
        autosave_restore_when_empty: false,
        autosave_retention: '30m',

        // Estilos del contenido
        content_style: `
            body {
                font-family: 'Poppins', sans-serif;
                margin: 20px auto;
                max-width: 800px;
                line-height: 1.6;
                font-size: 16px;
                color: #333;
            }
            img {
                max-width: 100%;
                height: auto;
                border-radius: 8px;
                margin: 10px 0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            video {
                max-width: 100%;
                border-radius: 8px;
                margin: 10px 0;
            }
            p {
                margin: 0 0 1em;
            }
            table {
                border-collapse: collapse;
                width: 100%;
                margin: 1em 0;
            }
            table td, table th {
                border: 1px solid #ddd;
                padding: 8px;
            }
        `,

        // Configuración visual
        skin: 'oxide',
        content_css: 'default',

        // Setup del editor
        setup: function(editor) {
            editor.on('init', function() {
                editor.notificationManager.open({
                    text: 'Editor listo para usar',
                    type: 'success',
                    timeout: 2000
                });

                // Botón de pantalla completa
                document.getElementById('fullscreen-toggle')?.addEventListener('click', function() {
                    const editorContainer = document.querySelector('.editor-container');
                    if (!document.fullscreenElement) {
                        editorContainer.requestFullscreen();
                        this.innerHTML = '<i class="fas fa-compress"></i>';
                    } else {
                        document.exitFullscreen();
                        this.innerHTML = '<i class="fas fa-expand"></i>';
                    }
                });
            });

            // Manejar cambios
            editor.on('change', function() {
                editor.save();
            });

            // Manejar pegado de contenido
            editor.on('paste', function(e) {
                // Puedes agregar lógica personalizada para el pegado
            });
        }
    });
}


// Asegúrate de que esta función se llame después de que el DOM esté listo
$(document).ready(function() {
    iniciarTiny().then(() => {
        console.log('Editor inicializado correctamente');
    }).catch(error => {
        console.error('Error al inicializar el editor:', error);
    });
});



// Variables globales para la galería
window.galeriaTemporales = [];

document.addEventListener('DOMContentLoaded', function() {
    const galeriaInput = document.getElementById('galeria-upload');
    const galeriaPreviewGrid = document.getElementById('galeria-preview-grid');
    const galeriaCounter = document.getElementById('galeria-count');
    let selectedGaleriaFiles = new Map();

    galeriaInput.addEventListener('change', handleGaleriaSelect);

    async function handleGaleriaSelect(e) {
        const files = Array.from(e.target.files);
        
        for (const file of files) {
            try {
                // Validar que solo sean imágenes o videos
                if (!isImageFile(file) && !isVideoFile(file)) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Tipo de archivo no permitido',
                        text: 'Solo se permiten imágenes y videos en la galería'
                    });
                    continue;
                }

                // Mostrar loading
                Swal.fire({
                    title: 'Procesando archivo...',
                    text: 'Esto puede tomar unos momentos',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                const fileId = `galeria-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                // Procesar el archivo según su tipo
                let processedFile;
                if (isImageFile(file)) {
                    processedFile = await comprimirImagen(file);
                } else if (isVideoFile(file)) {
                    processedFile = await comprimirVideo(file);
                }

                // Crear preview
                await createGaleriaPreviewItem(file, fileId, processedFile || file);

                // Subir archivo y guardar referencia
                const resultado = await subirArchivo(
                    processedFile || file, 
                    isImageFile(file) ? 'imagenes' : 'videos'
                );
                
                await guardarReferenciaGaleria({
                    tipo: isImageFile(file) ? 'imagen' : 'video',
                    url: resultado.url,
                    nombre: resultado.nombre,
                    timestamp: resultado.timestamp
                });

                // Actualizar contador
                selectedGaleriaFiles.set(fileId, {
                    file: processedFile || file,
                    type: file.type
                });
                updateGaleriaCounter();
                
                Swal.close();

            } catch (error) {
                console.error('Error al procesar archivo:', error);
                showError('Error al procesar el archivo: ' + error.message);
            }
        }
        
        galeriaInput.value = '';
    }

    // Función para crear preview de galería
    async function createGaleriaPreviewItem(file, fileId, processedFile) {
        const preview = document.createElement('div');
        preview.className = 'media-preview-item';
        preview.id = fileId;

        if (isImageFile(file)) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(processedFile);
            preview.appendChild(img);
        } else if (isVideoFile(file)) {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(processedFile);
            video.controls = true;
            preview.appendChild(video);
        }

        // Agregar controles
        const removeBtn = document.createElement('div');
        removeBtn.className = 'remove-media';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = () => removeGaleriaItem(fileId);
        preview.appendChild(removeBtn);

        galeriaPreviewGrid.appendChild(preview);
    }

    // Función para actualizar contador de galería
    function updateGaleriaCounter() {
        const count = selectedGaleriaFiles.size;
        galeriaCounter.textContent = `${count} archivo${count !== 1 ? 's' : ''} en galería`;
    }

    // Función para eliminar item de galería
    function removeGaleriaItem(fileId) {
        const element = document.getElementById(fileId);
        if (element) {
            element.remove();
            selectedGaleriaFiles.delete(fileId);
            updateGaleriaCounter();
        }
    }
});

// Función para guardar referencia de galería
async function guardarReferenciaGaleria(mediaData) {
    try {
        if (!window.publicacionActualId) {
            if (!window.galeriaTemporales) {
                window.galeriaTemporales = [];
            }
            window.galeriaTemporales.push(mediaData);
            return;
        }

        const publicacionRef = firebase.firestore()
            .collection('publicaciones2')
            .doc(window.publicacionActualId);
        
        await publicacionRef.update({
            galeria: firebase.firestore.FieldValue.arrayUnion(mediaData)
        });

    } catch (error) {
        console.error('Error al guardar referencia de galería:', error);
    }
}



// Añade estos estilos CSS
function isPDFFile(file) {
    return file.type === 'application/pdf';
}
// Inicializar el manejo de medios
document.addEventListener('DOMContentLoaded', function() {
    const mediaInput = document.getElementById('media-upload');
    const mediaPreviewGrid = document.getElementById('media-preview-grid');
    const mediaCounter = document.getElementById('media-count');
    let selectedFiles = new Map();

    mediaInput.addEventListener('change', handleMediaSelect);

    async function handleMediaSelect(e) {
        const files = Array.from(e.target.files);
        
        for (const file of files) {
            try {
                // Mostrar loading
                Swal.fire({
                    title: 'Procesando archivo...',
                    text: 'Esto puede tomar unos momentos',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
    
                // Validar el archivo
                const isValid = await validateFile(file);
                if (!isValid) continue;
    
                const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                // Procesar el archivo según su tipo
                let processedFile;
                if (isImageFile(file)) {
                    processedFile = await comprimirImagen(file);
                } else if (isVideoFile(file)) {
                    processedFile = await comprimirVideo(file);
                } else if (file.type === 'application/pdf') {
                    processedFile = file; // Para PDFs, usar el archivo original
                }
    
                // Crear preview
                await createPreviewItem(file, fileId, processedFile || file);
    
                // Determinar el tipo de carpeta para almacenamiento
                let storageFolder;
                if (isImageFile(file)) {
                    storageFolder = 'imagenes';
                } else if (isVideoFile(file)) {
                    storageFolder = 'videos';
                } else if (file.type === 'application/pdf') {
                    storageFolder = 'documentos';
                }
    
                // Subir archivo y guardar referencia
                const resultado = await subirArchivo(processedFile || file, storageFolder);
                
                await guardarReferenciaMedia({
                    tipo: isImageFile(file) ? 'imagen' : 
                          isVideoFile(file) ? 'video' : 'pdf',
                    url: resultado.url,
                    nombre: resultado.nombre,
                    timestamp: resultado.timestamp,
                    tamanioOriginal: formatFileSize(file.size),
                    tamanioComprimido: formatFileSize((processedFile || file).size)
                });
    
                // Actualizar contador
                selectedFiles.set(fileId, {
                    file: processedFile || file,
                    type: file.type
                });
                updateMediaCounter();
                
                // Cerrar loading
                Swal.close();
    
                // Mostrar mensaje de éxito
                const compressionRate = processedFile ? 
                    ((file.size - processedFile.size) / file.size * 100).toFixed(1) : 0;
                
                Swal.fire({
                    icon: 'success',
                    title: 'Archivo procesado',
                    text: processedFile !== file ? 
                        `Compresión: ${compressionRate}% (${formatFileSize(file.size)} → ${formatFileSize(processedFile.size)})` :
                        `Archivo subido: ${formatFileSize(file.size)}`,
                    timer: 2000,
                    showConfirmButton: false
                });
    
            } catch (error) {
                console.error('Error al procesar archivo:', error);
                showError('Error al procesar el archivo: ' + error.message);
            }
        }
        
        mediaInput.value = '';
    }
    
    // Función para comprimir video
    async function comprimirVideo(file) {
        return new Promise((resolve, reject) => {
            // Crear un elemento de video temporal
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.src = URL.createObjectURL(file);
    
            video.onloadedmetadata = async function() {
                try {
                    // Configuración de compresión
                    const MAX_WIDTH = 1280;
                    const MAX_HEIGHT = 720;
                    const TARGET_SIZE_MB = 10; // Tamaño objetivo en MB
    
                    // Calcular dimensiones manteniendo aspecto
                    let width = video.videoWidth;
                    let height = video.videoHeight;
                    
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
    
                    // Crear canvas y contexto
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
    
                    // Crear MediaRecorder
                    const stream = canvas.captureStream();
                    const mediaRecorder = new MediaRecorder(stream, {
                        mimeType: 'video/webm;codecs=vp9',
                        videoBitsPerSecond: TARGET_SIZE_MB * 1024 * 1024 * 8 / (video.duration)
                    });
    
                    const chunks = [];
                    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
                    mediaRecorder.onstop = () => {
                        const blob = new Blob(chunks, { type: 'video/webm' });
                        resolve(blob);
                    };
    
                    // Iniciar grabación
                    mediaRecorder.start();
    
                    // Procesar frames
                    const processFrame = () => {
                        if (video.currentTime < video.duration) {
                            ctx.drawImage(video, 0, 0, width, height);
                            video.currentTime += 1/30; // 30 FPS
                            requestAnimationFrame(processFrame);
                        } else {
                            mediaRecorder.stop();
                        }
                    };
    
                    video.currentTime = 0;
                    processFrame();
    
                } catch (error) {
                    reject(error);
                }
            };
    
            video.onerror = reject;
        });
    }
    
    // Función mejorada para mostrar errores
    function showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
            showConfirmButton: true
        });
    }
    
    // Función para formatear tamaños de archivo
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    
    async function createPreviewItem(file, fileId, processedFile) {
        const preview = document.createElement('div');
        preview.className = 'media-preview-item';
        preview.id = fileId;
    
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(processedFile);
            preview.appendChild(img);
        } else if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(processedFile);
            video.controls = true;
            preview.appendChild(video);
        } else if (file.type === 'application/pdf') {
            const pdfPreview = document.createElement('div');
            pdfPreview.className = 'pdf-preview';
            pdfPreview.innerHTML = `
                <i class="fas fa-file-pdf"></i>
                <span>${file.name}</span>
            `;
            preview.appendChild(pdfPreview);
        }
    
        // Agregar badge de tipo y tamaño
        const typeBadge = document.createElement('span');
        typeBadge.className = 'media-type-badge';
        const fileSize = (processedFile.size / (1024 * 1024)).toFixed(2);
        const fileType = file.type.startsWith('image/') ? 'Imagen' : 
                        file.type.startsWith('video/') ? 'Video' : 'PDF';
        typeBadge.textContent = `${fileType} (${fileSize}MB)`;
        preview.appendChild(typeBadge);
    
        // Agregar botones de control
        const removeBtn = document.createElement('div');
        removeBtn.className = 'remove-media';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = () => removeMedia(fileId);
        preview.appendChild(removeBtn);
    
        const previewBtn = document.createElement('div');
        previewBtn.className = 'preview-media';
        previewBtn.innerHTML = '<i class="fas fa-eye"></i>';
        previewBtn.onclick = () => showMediaPreview(processedFile, file.type);
        preview.appendChild(previewBtn);
    
        mediaPreviewGrid.appendChild(preview);
    }

    function showMediaPreview(file, type) {
        const url = URL.createObjectURL(file);
        
        if (type.startsWith('image/')) {
            Swal.fire({
                imageUrl: url,
                imageAlt: 'Vista previa',
                width: '80%',
                padding: '3em',
                showConfirmButton: false,
                showCloseButton: true
            });
        } else if (type.startsWith('video/')) {
            Swal.fire({
                html: `<video src="${url}" controls style="max-width: 100%; max-height: 80vh;"></video>`,
                width: '80%',
                padding: '3em',
                showConfirmButton: false,
                showCloseButton: true
            });
        } else if (type === 'application/pdf') {
            Swal.fire({
                html: `<iframe src="${url}" style="width: 100%; height: 80vh;"></iframe>`,
                width: '80%',
                padding: '3em',
                showConfirmButton: false,
                showCloseButton: true
            });
        }
    }

    function removeMedia(fileId) {
        const element = document.getElementById(fileId);
        if (element) {
            element.remove();
            selectedFiles.delete(fileId);
            updateMediaCounter();
        }
    }

    function updateMediaCounter() {
        const count = selectedFiles.size;
        mediaCounter.textContent = `${count} archivo${count !== 1 ? 's' : ''} seleccionado${count !== 1 ? 's' : ''}`;
    }

    function showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message
        });
    }
});


function validateFile(file) {
    // Definir tipos de archivo permitidos
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const allowedPDFTypes = ['application/pdf'];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes, ...allowedPDFTypes];

    // Tamaños máximos (en bytes)
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB para imágenes
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB para videos
    const MAX_PDF_SIZE = 20 * 1024 * 1024;   // 20MB para PDFs

    // Validar tipo de archivo
    if (!allowedTypes.includes(file.type)) {
        Swal.fire({
            icon: 'error',
            title: 'Tipo de archivo no permitido',
            text: 'Solo se permiten imágenes (JPG, PNG, GIF, WEBP), videos (MP4, WEBM, MOV) y PDFs'
        });
        return false;
    }

    // Determinar el tipo y tamaño máximo
    let maxSize;
    let fileTypeName;
    if (allowedImageTypes.includes(file.type)) {
        maxSize = MAX_IMAGE_SIZE;
        fileTypeName = 'imagen';
    } else if (allowedVideoTypes.includes(file.type)) {
        maxSize = MAX_VIDEO_SIZE;
        fileTypeName = 'video';
    } else {
        maxSize = MAX_PDF_SIZE;
        fileTypeName = 'PDF';
    }

    if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024);
        Swal.fire({
            icon: 'error',
            title: 'Archivo demasiado grande',
            text: `El ${fileTypeName} no debe superar los ${maxSizeMB}MB`
        });
        return false;
    }

    return true;
}

// También puedes agregar estas funciones auxiliares para mejor manejo de archivos

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
}

function generateUniqueFileName(originalName) {
    const extension = getFileExtension(originalName);
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${randomString}.${extension}`;
}

// Función para verificar si un archivo es una imagen
function isImageFile(file) {
    return file.type.startsWith('image/');
}

// Función para verificar si un archivo es un video
function isVideoFile(file) {
    return file.type.startsWith('video/');
}

// Función para guardar referencia de medios en Firestore
async function guardarReferenciaMedia(mediaData) {
    try {
    

        // Si no hay ID de publicación, crear un array temporal
        if (!window.publicacionActualId) {
            if (!window.mediosTemporales) {
                window.mediosTemporales = [];
            }
            window.mediosTemporales.push(mediaData);
            return;
        }

        // Si hay ID, actualizar en Firestore
        const publicacionRef = firebase.firestore()
            .collection('publicaciones2')
            .doc(window.publicacionActualId);
        
        await publicacionRef.update({
            medios: firebase.firestore.FieldValue.arrayUnion(mediaData)
        });

      

    } catch (error) {
        console.error('Error al guardar referencia de medio:', error);
    }
}


async function cargarItemParaEditar(id) {
    try {
        // Mostrar loading
        Swal.fire({
            title: 'Cargando publicación',
            text: 'Por favor espere...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Obtener la publicación de Firestore
        const doc = await db.collection('publicaciones2').doc(id).get();

        if (doc.exists) {
            const data = doc.data();
            
            // Llenar el formulario con los datos
            document.getElementById('titulo').innerText = data.titulo;
            document.getElementById('categoria').value = data.categoria;
            document.getElementById('lugar').value = data.lugar;


            document.getElementById('comision-llamada').value = data.comision_llamada || '';
            document.getElementById('comision-lider').value = data.comision_lider || '';
            document.getElementById('comision-venta').value = data.comision_venta || '';
            document.getElementById('precio').value = data.precio || '';

              // Limpiar el campo de descripción después de guardar
            document.getElementById('descripcion_material').value = data.descripcion_material||''

            // Establecer el contenido en el editor
            tinymce.get('editor').setContent(data.contenido);

            // Si hay imagen destacada, mostrarla en el preview
            if (data.imagen_destacada) {
                const preview = document.getElementById('image-preview');
                preview.innerHTML = `<img src="${data.imagen_destacada}" style="max-width: 200px; max-height: 200px; object-fit: cover;">`;
            }

            // Cambiar el texto del botón
            const guardarBtn = document.getElementById('guardar-contenido');
            if (guardarBtn) {
                guardarBtn.textContent = 'Actualizar';
                guardarBtn.setAttribute('data-id', id);
            }



            // Cargar galería si existe
            if (data.galeria && data.galeria.length > 0) {
                const galeriaPreviewGrid = document.getElementById('galeria-preview-grid');
                galeriaPreviewGrid.innerHTML = ''; // Limpiar grid existente

                data.galeria.forEach((item, index) => {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'media-preview-item';
                    previewItem.id = `galeria-${index}`;

                    if (item.tipo === 'imagen' || item.tipo === 'image') {
                        previewItem.innerHTML = `
                            <img src="${item.url}" alt="${item.nombre}">
                            <span class="media-type-badge">Imagen</span>
                            <div class="remove-media" onclick="eliminarGaleria('${id}', ${index}, '${item.url}')">
                                <i class="fas fa-times"></i>
                            </div>
                            <div class="preview-media" onclick="previsualizarMedio('${item.url}', '${item.tipo}')">
                                <i class="fas fa-eye"></i>
                            </div>
                        `;
                    } else if (item.tipo === 'video') {
                        previewItem.innerHTML = `
                            <video src="${item.url}" controls></video>
                            <span class="media-type-badge">Video</span>
                            <div class="remove-media" onclick="eliminarGaleria('${id}', ${index}, '${item.url}')">
                                <i class="fas fa-times"></i>
                            </div>
                            <div class="preview-media" onclick="previsualizarMedio('${item.url}', '${item.tipo}')">
                                <i class="fas fa-eye"></i>
                            </div>
                        `;
                    }

                    galeriaPreviewGrid.appendChild(previewItem);
                });

                // Actualizar contador de galería
                const galeriaCounter = document.getElementById('galeria-count');
                if (galeriaCounter) {
                    const count = data.galeria.length;
                    galeriaCounter.textContent = `${count} archivo${count !== 1 ? 's' : ''} en galería`;
                }
            }
        

              // Dentro de la función cargarItemParaEditar, en la parte donde manejas los medios
if (data.medios && data.medios.length > 0) {
    const mediaPreviewGrid = document.getElementById('media-preview-grid');
    mediaPreviewGrid.innerHTML = ''; // Limpiar grid existente

    data.medios.forEach((medio, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'media-preview-item';
        previewItem.id = `media-${index}`;

        if (medio.tipo === 'imagen' || medio.tipo === 'image') {
            previewItem.innerHTML = `
                <img src="${medio.url}" alt="${medio.nombre}">
                <span class="media-type-badge">Imagen</span>
                <div class="remove-media" onclick="eliminarMedio('${id}', ${index}, '${medio.url}')">
                    <i class="fas fa-times"></i>
                </div>
                <div class="preview-media" onclick="previsualizarMedio('${medio.url}', '${medio.tipo}')">
                    <i class="fas fa-eye"></i>
                </div>
            `;
        } else if (medio.tipo === 'video') {
            previewItem.innerHTML = `
                <video src="${medio.url}" controls></video>
                <span class="media-type-badge">Video</span>
                <div class="remove-media" onclick="eliminarMedio('${id}', ${index}, '${medio.url}')">
                    <i class="fas fa-times"></i>
                </div>
                <div class="preview-media" onclick="previsualizarMedio('${medio.url}', '${medio.tipo}')">
                    <i class="fas fa-eye"></i>
                </div>
            `;
        } else if (medio.tipo === 'pdf' || medio.tipo === 'application/pdf') {
            previewItem.innerHTML = `
                <div class="pdf-preview">
                    <i class="fas fa-file-pdf pdf-icon"></i>
                    <span class="pdf-name">${medio.nombre || "Documento PDF"}</span>
                </div>
                <span class="media-type-badge">PDF</span>
                <div class="remove-media" onclick="eliminarMedio('${id}', ${index}, '${medio.url}')">
                    <i class="fas fa-times"></i>
                </div>
                <div class="preview-media" onclick="window.open('${medio.url}', '_blank')">
                    <i class="fas fa-eye"></i>
                </div>
            `;
        }

        mediaPreviewGrid.appendChild(previewItem);
    });

    // Actualizar contador
    const mediaCounter = document.getElementById('media-count');
    if (mediaCounter) {
        mediaCounter.textContent = `${data.medios.length} archivo${data.medios.length !== 1 ? 's' : ''} cargado${data.medios.length !== 1 ? 's' : ''}`;
    }

            }

        
            // Cerrar el loading
            Swal.close();
        } else {
            throw new Error('No se encontró la publicación');
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar el contenido para editar: ' + error.message
        });
    }
}


// Función para eliminar un medio
async function eliminarMedio(publicacionId, index, mediaUrl) {
    try {
        // Confirmar eliminación
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esta acción",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            // Mostrar loading
            Swal.fire({
                title: 'Eliminando...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Obtener referencia del documento
            const docRef = db.collection('publicaciones2').doc(publicacionId);
            const doc = await docRef.get();
            const data = doc.data();

            // Eliminar el archivo de Storage
            const storageRef = firebase.storage().refFromURL(mediaUrl);
            await storageRef.delete();

            // Eliminar la referencia de Firestore
            const mediosActualizados = data.medios.filter((_, i) => i !== index);
            await docRef.update({
                medios: mediosActualizados
            });

            // Eliminar el elemento del DOM
            document.getElementById(`media-${index}`).remove();

            // Actualizar contador
            const mediaCounter = document.getElementById('media-count');
            if (mediaCounter) {
                const count = mediosActualizados.length;
                mediaCounter.textContent = `${count} archivo${count !== 1 ? 's' : ''} cargado${count !== 1 ? 's' : ''}`;
            }

            Swal.fire(
                '¡Eliminado!',
                'El archivo ha sido eliminado.',
                'success'
            );
        }
    } catch (error) {
        console.error('Error al eliminar medio:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al eliminar el archivo: ' + error.message
        });
    }
}

// Función para previsualizar un medio
function previsualizarMedio(url, tipo) {
    if (tipo === 'imagen' || tipo === 'image') {
        Swal.fire({
            imageUrl: url,
            imageAlt: 'Vista previa',
            width: '80%',
            padding: '3em',
            showConfirmButton: false,
            showCloseButton: true
        });
    } else if (tipo === 'video') {
        Swal.fire({
            html: `<video src="${url}" controls style="max-width: 100%; max-height: 80vh;"></video>`,
            width: '80%',
            padding: '3em',
            showConfirmButton: false,
            showCloseButton: true
        });
    }
}



// Inicialización cuando el documento está listo
async function handleGuardarContenido() {
    try {
        // Obtener el contenido del editor
        tinymce.triggerSave();
        
        // Obtener todos los valores del formulario
        const contenido = tinymce.get('editor').getContent();
        const titulo = document.getElementById('titulo').innerText.trim();
        const categoria = document.getElementById('categoria').value;
        const lugar = document.getElementById('lugar').value;
        const imagenDestacada = document.getElementById('imagen-destacada').files[0];

        // Obtener los campos de comisiones y precio
        const comision_llamada = parseFloat(document.getElementById('comision-llamada').value) || 0;
        const comision_lider = parseFloat(document.getElementById('comision-lider').value) || 0;
        const comision_venta = parseFloat(document.getElementById('comision-venta').value) || 0;
        const precio = parseFloat(document.getElementById('precio').value) || 0;

            // Obtener la descripción del material
      const descripcion_material = document.getElementById('descripcion_material').value||"";
        
           

        // Validar campos requeridos
        if (!titulo || !contenido || !categoria || !lugar) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Por favor, complete todos los campos requeridos'
            });
            return;
        }

        // Mostrar loading
        Swal.fire({
            title: 'Guardando publicación...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        let imagenURL = '';
        
        // Si hay imagen nueva, subirla a Firebase Storage
        if (imagenDestacada) {
            const storageRef = firebase.storage().ref();
            const imageRef = storageRef.child(`publicaciones/${Date.now()}_${imagenDestacada.name}`);
            await imageRef.put(imagenDestacada);
            imagenURL = await imageRef.getDownloadURL();
        }

        // Obtener usuario actual
        const user = firebase.auth().currentUser;
        
        // Generar nuevo ID si es una nueva publicación
        const nuevoId = db.collection('publicaciones2').doc().id;

        // Crear objeto con los datos de la publicación
        const publicacionData = {
            id: nuevoId,
            titulo,
            contenido,
            categoria,
            lugar,
            comision_llamada,
            comision_lider,
            comision_venta,
            precio,
            fecha_actualizacion: firebase.firestore.FieldValue.serverTimestamp(),
            autor: {
                uid: user.uid,
                nombre: user.displayName || 'Usuario',
                email: user.email
            },
            descripcion_material

        };

        // Si hay una nueva imagen, actualizar el campo imagen_destacada
        if (imagenURL) {
            publicacionData.imagen_destacada = imagenURL;
        }

        // Si hay medios temporales, agregarlos
        if (window.mediosTemporales && window.mediosTemporales.length > 0) {
            publicacionData.medios = window.mediosTemporales;
        }

            // Si hay archivos de galería temporales, agregarlos
            if (window.galeriaTemporales && window.galeriaTemporales.length > 0) {
                publicacionData.galeria = window.galeriaTemporales;
            }

        let docRef;
        // Obtener el ID de la publicación si estamos editando
        const editandoId = document.getElementById('guardar-contenido').getAttribute('data-id');

        if (editandoId) {
            // Actualizar en Firestore
            docRef = db.collection('publicaciones2').doc(editandoId);
            publicacionData.id = editandoId; // Mantener el ID original en edición
            await docRef.update(publicacionData);
            window.publicacionActualId = editandoId;
        } else {
            // Crear nueva publicación
            docRef = db.collection('publicaciones2').doc(nuevoId);
            publicacionData.fecha_creacion = firebase.firestore.FieldValue.serverTimestamp();
            publicacionData.estado = 'publicado';
            await docRef.set(publicacionData);
            window.publicacionActualId = nuevoId;
        }

        // Limpiar medios temporales
        window.mediosTemporales = [];

        // Mostrar mensaje de éxito
        Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Publicación guardada correctamente',
            timer: 1500
        });

        // Redirigir a la página de administración
        setTimeout(() => {
            window.location.href = 'administrarPublicacion.html';
        }, 1500);

    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al guardar la publicación: ' + error.message
        });
    }
}




tinymce.init({
    selector: '#editor',
    height: '100%',
    plugins: 'preview importcss searchreplace autolink autosave save directionality code visualblocks visualchars fullscreen image link media template codesample table charmap pagebreak nonbreaking anchor insertdatetime advlist lists wordcount help charmap quickbars emoticons',
    menubar: 'file edit view insert format tools table help',
    toolbar: 'undo redo | fullscreen|bold italic underline strikethrough | fontfamily fontsize blocks | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist | forecolor backcolor removeformat  |pagebreak | charmap emoticons | fullscreen save print | insertfile image media template link anchor codesample | ltr rtl',
    toolbar_sticky: true,
    autosave_ask_before_unload: true,
    autosave_interval: '30s',
    autosave_prefix: '{path}{query}-{id}-',
    autosave_restore_when_empty: false,
    autosave_retention: '2m',
    image_advtab: true,
    
    // Enable file uploads
    automatic_uploads: true,
    images_upload_url: '/your-image-upload-handler',
    images_upload_base_path: '/some/basepath',
    images_upload_credentials: true,
    
    // File picker callback
    file_picker_types: 'image media',
     // Modificar esta parte
     // File picker callback
file_picker_callback: async function (callback, value, meta) {
    var input = document.createElement('input');
    input.setAttribute('type', 'file');
    
    if (meta.filetype === 'image') {
        input.setAttribute('accept', 'image/*');
    } else if (meta.filetype === 'media') {
        input.setAttribute('accept', 'video/*');
    }

    input.onchange = async function () {
        var file = this.files[0];
        
        try {
            let resultado;
            
            if (meta.filetype === 'image') {
                // Comprimir y subir imagen
                const imagenComprimida = await comprimirImagen(file);
                resultado = await subirArchivo(imagenComprimida, 'imagenes');
            } else if (meta.filetype === 'media') {
                // Subir video directamente
                resultado = await subirArchivo(file, 'videos');
            }

            // Callback con la URL del archivo (sin guardar referencia)
            callback(resultado.url, {
                title: file.name,
                width: meta.filetype === 'media' ? '100%' : '',
                height: meta.filetype === 'media' ? 'auto' : ''
            });

        } catch (error) {
            console.error('Error al subir archivo:', error);
            tinymce.activeEditor.notificationManager.open({
                text: 'Error al subir el archivo: ' + error.message,
                type: 'error',
                timeout: 3000
            });
        }
    };

    input.click();

    },

    // También agregar estas configuraciones
    automatic_uploads: true,
    images_upload_url: null, // Desactivar la subida automática
    images_reuse_filename: true,
    images_upload_credentials: true,
    media_upload_credentials: true,
    
    skin: 'oxide',
    content_css: 'default',
    content_style: `
        body {
            font-family: 'Poppins', sans-serif;
            margin: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
    `,
    
});



// Función para limpiar el formulario
function limpiarFormulario() {
    document.getElementById('titulo').innerText = '';
    document.getElementById('categoria').value = '';
    document.getElementById('lugar').value = '';
    document.getElementById('imagen-destacada').value = '';
    tinymce.activeEditor.setContent('');
    $('#image-preview').empty();
}

// Función para cargar una publicación existente
async function cargarPublicacion(id) {
    try {
        const doc = await firebase.firestore()
            .collection('publicaciones2')
            .doc(id)
            .get();

        if (doc.exists) {
            const data = doc.data();
            
            // Llenar el formulario con los datos
            document.getElementById('titulo').innerText = data.titulo;
            document.getElementById('categoria').value = data.categoria;
            document.getElementById('lugar').value = data.lugar;
            tinymce.activeEditor.setContent(data.contenido);

            // Si hay imagen destacada, mostrarla
            if (data.imagen_destacada) {
                const preview = document.getElementById('image-preview');
                preview.innerHTML = `<img src="${data.imagen_destacada}" style="max-width: 200px; max-height: 200px; object-fit: cover;">`;
            }
        }
    } catch (error) {
        console.error('Error al cargar la publicación:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar la publicación: ' + error.message
        });
    }
}

// Función para inicializar eventos
function inicializarEventos() {
    // Evento para cambio de tipo
    $('#tipo').on('change', function () {
        const tipo = $(this).val();
        const submitBtn = $('#guardar-contenido');
        submitBtn.text(tipo === 'project' ? 'Guardar Proyecto' : 'Guardar Post');
    });

    // Evento para guardar
    const guardarBtn = document.getElementById('guardar-contenido');
    if (guardarBtn) {
        guardarBtn.addEventListener('click', handleGuardarContenido);
    }
}





// Función para inicializar TinyMCE



// Función para comprimir imágenes
async function comprimirImagen(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Máximo tamaño deseado
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convertir a Blob con calidad 0.7
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, file.type, 0.7);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Función para subir archivo a Firebase Storage
async function subirArchivo(file, tipo) {
    const storageRef = firebase.storage().ref();
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const fileRef = storageRef.child(`publicaciones/${tipo}/${fileName}`);
    
    // Subir archivo
    await fileRef.put(file);
    
    // Obtener URL
    const url = await fileRef.getDownloadURL();
    
    return {
        url,
        nombre: fileName,
        tipo: file.type,
        timestamp
    };
}

// Función para previsualizar imagen
function previewImage(input) {
    const $preview = $('#image-preview');
    $preview.empty();

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            $('<img>')
                .attr('src', e.target.result)
                .css({
                    'max-width': '200px',
                    'max-height': '200px',
                    'object-fit': 'cover'
                })
                .appendTo($preview);
        };
        reader.readAsDataURL(input.files[0]);
    }
}