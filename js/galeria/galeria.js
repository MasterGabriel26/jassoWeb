const loaderContainer = document.getElementById('loader');

function cargarGaleria() {
    db.collection('galeria').get().then((querySnapshot) => {
        let categorias = {};

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const imagenes = data.imagenes;
            const categoria = data.categoriasDeImagenes;

            // Agregar imágenes a la pestaña "Todo"
            imagenes.forEach((imagen) => {
                $('#galeria-todo').append(`<div class="col-6 col-md-4 col-lg-3 mb-4"><img src="${imagen}" class="img-fluid" alt="Imagen"></div>`);
            });

            // Agregar imágenes a la categoría correspondiente
            if (!categorias[categoria]) {
                categorias[categoria] = [];
                $('#myTab').append(`<li class="nav-item" role="presentation"><a class="nav-link" id="${categoria}-tab" data-bs-toggle="tab" href="#${categoria}" role="tab" aria-controls="${categoria}" aria-selected="false">${categoria}</a></li>`);
                $('#myTabContent').append(`<div class="tab-pane fade" id="${categoria}" role="tabpanel" aria-labelledby="${categoria}-tab"><div class="row" id="galeria-${categoria}"></div></div>`);
            }
            categorias[categoria].push(imagenes);
        });

        // Insertar imágenes en las pestañas de categorías
        for (const [categoria, imagenes] of Object.entries(categorias)) {
            imagenes.forEach((imagenArray) => {
                imagenArray.forEach((imagen) => {
                    $(`#galeria-${categoria}`).append(`<div class="col-6 col-md-4 col-lg-3 mb-4"><img src="${imagen}" class="img-fluid" alt="Imagen"></div>`);
                    loaderContainer.classList.add('hidden');
                });
            });
        }
    });
}

$(document).ready(function() {
    cargarGaleria();
});
