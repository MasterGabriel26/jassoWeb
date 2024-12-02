function generateMenu() {
    const userType = localStorage.getItem('userType');
    let menuItems = `
        <li class="sidebar-item">
            <a class="sidebar-link" href="/index.html">
                <i class="align-middle" data-feather="home"></i>
                <span class="align-middle">Inicio</span>
            </a>
        </li>
        <li class="sidebar-item">
            <a class="sidebar-link" href="/page-calendario.html">
                <i class="align-middle" data-feather="calendar"></i>
                <span class="align-middle">Calendario</span>
            </a>
        </li>
        <li class="sidebar-item">
            <a class="sidebar-link" href="/page-prospectos.html">
                <i class="align-middle" data-feather="users"></i>
                <span class="align-middle">Prospectos</span>
            </a>
        </li>
        <li class="sidebar-item">
            <a class="sidebar-link" href="/page-chat.html">
                <i class="align-middle" data-feather="message-square"></i>
                <span class="align-middle">Chat</span>
            </a>
        </li>
    `;

    if (userType === 'admin') {
        menuItems += `
            <li class="sidebar-item">
                <a class="sidebar-link" href="/vista-admin/page-contratos.html">
                    <i class="align-middle" data-feather="file-text"></i>
                    <span class="align-middle">Contratos</span>
                </a>
            </li>
            <li class="sidebar-item">
                <a class="sidebar-link" href="/vista-admin/page-paquetes.html">
                    <i class="align-middle" data-feather="package"></i>
                    <span class="align-middle">Paquetes</span>
                </a>
            </li>
            <li class="sidebar-item">
                <a class="sidebar-link" href="/vista-admin/page-usuarios.html">
                    <i class="align-middle" data-feather="users"></i>
                    <span class="align-middle">Usuarios</span>
                </a>
            </li>
        `;
    }

    if (userType === 'asesor') {
        menuItems += `
            <li class="sidebar-item">
                <a class="sidebar-link" href="/page-galeria.html">
                    <i class="align-middle" data-feather="image"></i>
                    <span class="align-middle">Galería</span>
                </a>
            </li>
            <li class="sidebar-item">
                <a class="sidebar-link" href="/page-usuarios.html">
                    <i class="align-middle" data-feather="user-plus"></i>
                    <span class="align-middle">Invitados del Cliente</span>
                </a>
            </li>
        `;
    }

    const menu = `
    <div class="sidebar-content js-simplebar">
        <a class="sidebar-brand" href="/index.html">
            <span class="align-middle">JASSO</span>
        </a>

        <ul class="sidebar-nav">
            <li class="sidebar-header">
                Páginas
            </li>
            ${menuItems}
        </ul>
    </div>
    `;

    $("#sidebar").html(menu);

    // Detect active page
    $(document).ready(function () {
        var currentPage = window.location.pathname;
        $('.sidebar-item').each(function () {
            var link = $(this).find('a').attr('href');
            if (link === currentPage) {
                $(this).addClass('active');
            } else {
                $(this).removeClass('active');
            }
        });
    });
}

generateMenu();
