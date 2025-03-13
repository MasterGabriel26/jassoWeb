function agregarEstiloSubmenuAzul() {
    const styles = `
        /* Aumentar la especificidad del selector */
        #sidebar #comisiones.sidebar-dropdown {
            background-color: #1a237e !important; /* Azul oscuro */
            margin-left: 29px;
        }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    
    // Añadir los estilos al documento
    document.head.appendChild(styleSheet);
}

// Asegúrate de que el DOM esté cargado antes de aplicar los estilos
document.addEventListener('DOMContentLoaded', () => {
    // Añadir un pequeño retardo para asegurar que todo el contenido esté cargado
    setTimeout(agregarEstiloSubmenuAzul, 500); // Aumentar el tiempo a 500ms
});

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


              <li class="sidebar-item">
                <a class="sidebar-link" href="/chat/chat.html">
                    <i class="align-middle" data-feather="message-circle"></i>
                    <span class="align-middle">Chat</span>
                </a>
            </li>
          

       <li class="sidebar-item">
            <a data-bs-target="#comisiones" data-bs-toggle="collapse" class="sidebar-link collapsed">
                <i class="align-middle" data-feather="dollar-sign"></i>
                <span class="align-middle">Comisiones</span>
            </a>
            <ul id="comisiones" class="sidebar-dropdown list-unstyled collapse" data-bs-parent="#sidebar" style="background-color: #1a237e !important;">
                <li class="sidebar-item">
                    <a class="sidebar-link" href="/vista-admin/page-comisiones-admin.html">
                        <i class="align-middle" data-feather="clock"></i>
                        Pendientes
                    </a>
                </li>
                <li class="sidebar-item">
                    <a class="sidebar-link" href="/vista-admin/page-historial-comisiones-admin.html">
                        <i class="align-middle" data-feather="check-circle"></i>
                        Historial
                    </a>
                </li>
            </ul>
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

            <li class="sidebar-item">
                <a class="sidebar-link" href="/publicaciones/administrarPublicacion.html">
                    <i class="align-middle" data-feather="edit"></i>
                    <span class="align-middle">Publicaciones</span>
                </a>
            </li>

            <li class="sidebar-item">
            <a class="sidebar-link" href="/vista-admin/page-solicitudes.html">
                <i class="align-middle" data-feather="inbox"></i>
                <span class="align-middle">Solicitudes</span>
            </a>
        </li>

       
        `;
    }

    if (userType === 'asesor' ||userType === 'lider') {
        menuItems += `
           <li class="sidebar-item">
                <a class="sidebar-link" href="/vista-admin/page-contratos.html">
                    <i class="align-middle" data-feather="file-text"></i>
                    <span class="align-middle">Contratos</span>
                </a>
            </li>

            <li class="sidebar-item">
    <a class="sidebar-link" href="/page-historial-comisiones.html">
        <i class="align-middle" data-feather="dollar-sign"></i>
        <span class="align-middle">Comisiones</span>
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
