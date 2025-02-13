// Variables globales
//const API_BASE_URL = 'http://localhost:8000/api/v1';

// Inicialización
$(async  function () {
    alert("eeee")
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    const itemType = urlParams.get('type');
console.log(itemId)
    // await iniciarTiny();

    // if (itemId) {
    //     // Esperar un momento para asegurarnos de que TinyMCE está listo
    //     setTimeout(async () => {
    //         await cargarItemParaEditar(itemId, itemType);
    //     }, 500);
    // }

    
    // inicializarEventos();
    // cargarCategorias();
});
//
function iniciarTiny() {
 
    return tinymce.init({
        content_style: `
        .mce-content-body pre[class*="language-"] {
            background: #282c34;
            color: #abb2bf;
            padding: 1em;
            border-radius: 4px;
            overflow-x: auto;
        }
        .mce-content-body code[class*="language-"] {
            font-family: 'Consolas', 'Monaco', 'Andale Mono', 'Ubuntu Mono', monospace;
            font-size: 14px;
            line-height: 1.5;
        }
    `,
        selector: 'textarea',
        plugins: [
            'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'image', 'link', 'lists',
            'media', 'searchreplace', 'table', 'visualblocks', 'wordcount', 'codesample', 'code',
        ],
        toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright | image media customYoutube',
        codesample_languages: [
            { text: 'JavaScript', value: 'javascript' },
            { text: 'TypeScript', value: 'typescript' },
            { text: 'Python', value: 'python' },
            { text: 'Java', value: 'java' },
            { text: 'Kotlin', value: 'kotlin' },
            { text: 'Dart', value: 'dart' },
            { text: 'Swift', value: 'swift' },
            { text: 'PHP', value: 'php' },
            { text: 'C#', value: 'csharp' },
            { text: 'C++', value: 'cpp' },
            { text: 'Ruby', value: 'ruby' },
            { text: 'Go', value: 'go' },
            { text: 'Rust', value: 'rust' },
            { text: 'HTML/XML', value: 'markup' },
            { text: 'CSS', value: 'css' },
            { text: 'SCSS', value: 'scss' },
            { text: 'SQL', value: 'sql' },
            { text: 'JSON', value: 'json' },
            { text: 'YAML', value: 'yaml' },
            { text: 'Bash', value: 'bash' },
            { text: 'Shell', value: 'shell' },
            { text: 'Docker', value: 'dockerfile' },
            { text: 'GraphQL', value: 'graphql' },
            { text: 'Markdown', value: 'markdown' },
            { text: 'R', value: 'r' },
            { text: 'MATLAB', value: 'matlab' }
        ],
        images_upload_handler: async function (blobInfo) {
            try {
                const formData = new FormData();
                formData.append('file', blobInfo.blob(), blobInfo.filename());

                const response = await fetch(`${API_BASE_URL}/upload-image`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('HTTP Error: ' + response.status);
                }

                const data = await response.json();
                if (!data || !data.location) {
                    throw new Error('Invalid response from server');
                }

                return data.location;
            } catch (error) {
                console.error('Error:', error);
                throw error;
            }
        },
        automatic_uploads: true,
        images_reuse_filename: true,
        file_picker_types: 'image'
    });
}


async function cargarItemParaEditar(id, type) {
    try {
        const endpoint = type === 'post' ? 'posts' : 'projects';
        const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`);
        if (!response.ok) {
            throw new Error('Error al cargar el contenido');
        }

        const item = await response.json();
        console.log('Contenido recibido:', item); // Para debug

        // Llenar el formulario con los datos
        document.getElementById('titulo').innerText = item.title;
        document.getElementById('categoria').value = item.category_id;

        // Establecer el contenido en el editor
        tinymce.activeEditor.setContent(item.content);

        // Si hay imagen destacada, mostrarla en el preview
        if (item.featured_image) {
            const preview = document.getElementById('image-preview');
            preview.innerHTML = `<img src="${item.featured_image}" style="max-width: 200px; max-height: 200px; object-fit: cover;">`;
        }

        // Cambiar el texto del botón
        const guardarBtn = document.getElementById('guardar-contenido');
        if (guardarBtn) {
            guardarBtn.textContent = 'Actualizar';
            guardarBtn.setAttribute('data-id', id);
            guardarBtn.setAttribute('data-type', type);
        }

    } catch (error) {
        console.error('Error:', error);
        alertify.error('Error al cargar el contenido para editar');
    }
}

// Inicialización cuando el documento está listo
async function handleGuardarContenido() {
    try {
        tinymce.triggerSave();
        
        const contenido = tinymce.activeEditor.getContent();
        const titulo = document.getElementById('titulo').innerText.trim();
        const categoria = document.getElementById('categoria').value;
        const imagenDestacada = document.getElementById('imagen-destacada').files[0];
        const itemId = document.getElementById('guardar-contenido').getAttribute('data-id');
        const itemType = document.getElementById('guardar-contenido').getAttribute('data-type') || 'post';

        if (!titulo || !contenido || !categoria) {
            alertify.error('Por favor, complete todos los campos requeridos');
            return;
        }

        const formData = new FormData();
        formData.append('contenido', contenido);
        formData.append('titulo', titulo);
        formData.append('categoria', categoria);
        formData.append('type', itemType);
        if (imagenDestacada) {
            formData.append('imagen_destacada', imagenDestacada);
        }

        const endpoint = itemType === 'post' ? 'posts' : 'projects';
        let url = `${API_BASE_URL}/${endpoint}`;
        let method = 'POST';

        // Si hay ID, es una actualización
        if (itemId) {
            url = `${API_BASE_URL}/${endpoint}/${itemId}`;
            method = 'POST'; // Seguimos usando POST pero con _method: PUT
            formData.append('_method', 'PUT');
        }

        console.log('Enviando datos:', {
            url,
            method,
            titulo,
            categoria,
            tieneImagen: !!imagenDestacada,
            esActualizacion: !!itemId
        });

        const response = await fetch(url, {
            method: method,
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.errors) {
                const errorMessages = Object.values(data.errors).flat().join('\n');
                throw new Error(errorMessages);
            }
            throw new Error(data.message || 'Error en el servidor');
        }

        alertify.success(itemId ? 'Contenido actualizado exitosamente' : 'Contenido creado exitosamente');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        console.error('Error completo:', error);
        alertify.error('Error al ' + (itemId ? 'actualizar' : 'crear') + ': ' + error.message);
    }
}

function limpiarFormulario() {
    document.getElementById('titulo').innerText = '';
    document.getElementById('categoria').value = '';
    document.getElementById('imagen-destacada').value = '';
    document.getElementById('tipo').value = 'post'; // Reset al tipo por defecto
    tinymce.activeEditor.setContent('');
    $('#image-preview').empty();
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



// Función para cargar categorías
async function cargarCategorias() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (!response.ok) {
            throw new Error('Error al obtener categorías');
        }

        const categorias = await response.json();
        const $select = $('#categoria');

        $select.empty().append('<option value="">Seleccione una categoría</option>');

        categorias.forEach(categoria => {
            $select.append(`<option value="${categoria.id}">${categoria.name}</option>`);
        });
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        alertify.error('Error al cargar categorías: ' + error.message);
    }
}

// Función para inicializar TinyMCE
function iniciarTiny() {
    tinymce.init({
        selector: 'textarea',
        plugins: [
            'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'image', 'link', 'lists',
            'media', 'searchreplace', 'table', 'visualblocks', 'wordcount'
        ],
        toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
        images_upload_handler: async function (blobInfo) {
            try {
                const formData = new FormData();
                formData.append('file', blobInfo.blob(), blobInfo.filename());

                const response = await fetch(`${API_BASE_URL}/upload-image`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('HTTP Error: ' + response.status);
                }

                const data = await response.json();
                if (!data || !data.location) {
                    throw new Error('Invalid response from server');
                }

                return data.location;
            } catch (error) {
                console.error('Error:', error);
                throw error;
            }
        },
        automatic_uploads: true,
        images_reuse_filename: true,
        file_picker_types: 'image'
    });
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