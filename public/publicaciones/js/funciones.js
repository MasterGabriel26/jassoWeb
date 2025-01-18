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
                
                await guardarReferenciaMedia({
                    tipo: 'imagen',
                    url: resultado.url,
                    nombre: resultado.nombre,
                    timestamp: resultado.timestamp
                });

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
            
            // Configurar tipos de archivo permitidos
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
                    
                    await guardarReferenciaMedia({
                        tipo: meta.filetype,
                        url: resultado.url,
                        nombre: resultado.nombre,
                        timestamp: resultado.timestamp
                    });

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
        images_upload_url: '/upload-handler',
        images_upload_credentials: true,
        images_reuse_filename: true,
        media_upload_url: '/upload-handler',
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
                editor.save(); // Guardar cambios al textarea
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

// Añade estos estilos CSS



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


            // Llenar los nuevos campos
            if (data.comisiones) {
                document.getElementById('comision-llamada').value = data.comisiones.llamada || '';
                document.getElementById('comision-lider').value = data.comisiones.lider || '';
                document.getElementById('comision-venta').value = data.comisiones.venta || '';
            }
            document.getElementById('precio').value = data.precio || '';

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
            }
        };

        // Si hay una nueva imagen, actualizar el campo imagen_destacada
        if (imagenURL) {
            publicacionData.imagen_destacada = imagenURL;
        }

        // Si hay medios temporales, agregarlos
        if (window.mediosTemporales && window.mediosTemporales.length > 0) {
            publicacionData.medios = window.mediosTemporales;
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

                // Guardar referencia en Firestore
                await guardarReferenciaMedia({
                    tipo: meta.filetype,
                    url: resultado.url,
                    nombre: resultado.nombre,
                    timestamp: resultado.timestamp
                });

                // Callback con la URL del archivo
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