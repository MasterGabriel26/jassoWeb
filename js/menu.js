var menu=`<div class="sidebar-content js-simplebar">
    <a class="sidebar-brand" href="index.html">
        <span class="align-middle">JASSO</span>
    </a>

    <ul class="sidebar-nav">
        <li class="sidebar-header">
            Paginas
        </li>

        <li class="sidebar-item">
            <a class="sidebar-link" href="index.html">
                <i class="align-middle" data-feather="file-text"></i>
                <span class="align-middle">Contratos</span>
            </a>
        </li>

        <li class="sidebar-item">
            <a class="sidebar-link" href="page-prospectos.html">
                <i class="align-middle" data-feather="users"></i>
                <span class="align-middle">Prospectos</span>
            </a>
        </li>

        <li class="sidebar-item">
            <a class="sidebar-link" href="page-calendario.html">
                <i class="align-middle" data-feather="calendar"></i>
                <span class="align-middle">Calendario</span>
            </a>
        </li>

        <li class="sidebar-item">
            <a class="sidebar-link" href="page-paquetes.html">
                <i class="align-middle" data-feather="package"></i>
                <span class="align-middle">Paquetes</span>
            </a>
        </li>
          <li class="sidebar-item">
            <a class="sidebar-link" href="page-usuarios.html">
                <i class="align-middle" data-feather="users"></i>
                <span class="align-middle">Usuarios</span>
            </a>
        </li>
    </ul>
</div>

`

$("#sidebar").html(menu);

// Detectar la página activa
$(document).ready(function () {
    // Obtener la ruta del archivo actual
    var currentPage = window.location.pathname.split('/').pop();

    // Recorrer los enlaces y agregar la clase 'active' al que coincide
    $('.sidebar-item').each(function () {
        var link = $(this).find('a').attr('href');
        if (link === currentPage) {
            $(this).addClass('active');
        } else {
            $(this).removeClass('active');
        }
    });
});


