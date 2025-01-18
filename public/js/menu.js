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
                <a class="sidebar-link" href="/page-galeria.html">
                    <i class="align-middle" data-feather="image"></i>
                    <span class="align-middle">Galería</span>
                </a>
            </li>
          
    `;

    if (userType === 'admin') {
        menuItems += `
            <li class="sidebar-item">
                <a class="sidebar-link" href="/vista-admin/page-contratos-admin.html">
                    <i class="align-middle" data-feather="file-text"></i>
                    <span class="align-middle">Contratos</span>
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
                <a class="sidebar-link" href="/vista-admin/page-contratos.html">
                    <i class="align-middle" data-feather="file-text"></i>
                    <span class="align-middle">Contratos</span>
                </a>
            </li>
        `;
    }


      // Agregar el botón de limpiar caché al final del menú
      menuItems += `
      <li class="sidebar-header">
          Herramientas
      </li>
      <li class="sidebar-item">
          <a class="sidebar-link" href="#" onclick="clearCache(event)">
              <i class="align-middle" data-feather="trash-2"></i>
              <span class="align-middle">Limpiar Caché</span>
          </a>
      </li>
  `;

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


// Función para limpiar el caché
async function clearCache(event) {
    event.preventDefault();
    
    try {
        // Mostrar confirmación
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esto limpiará todos los datos almacenados en caché",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, limpiar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            // Mostrar loader
            Swal.fire({
                title: 'Limpiando caché...',
                html: 'Por favor espera...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Limpiar diferentes tipos de almacenamiento
            localStorage.clear();
            sessionStorage.clear();

            // Limpiar caché del service worker si existe
            if ('caches' in window) {
                const cacheKeys = await caches.keys();
                await Promise.all(
                    cacheKeys.map(key => caches.delete(key))
                );
            }

            // Limpiar cookies
            document.cookie.split(";").forEach(function(c) {
                document.cookie = c.replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });

            // Mostrar mensaje de éxito
            await Swal.fire({
                title: '¡Completado!',
                text: 'El caché ha sido limpiado exitosamente',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });

            // Recargar la página
            window.location.reload(true);
        }
    } catch (error) {
        console.error('Error al limpiar el caché:', error);
        Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al limpiar el caché',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}


generateMenu();
