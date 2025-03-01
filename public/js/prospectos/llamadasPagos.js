// Primero, el HTML del botón debe ser así
const btnContactar = document.getElementById("btnContactar");
btnContactar.innerHTML = `
    <button type="button" class="btn dropdown-toggle" data-bs-toggle="dropdown">
        Contactar
    </button>
    <ul class="dropdown-menu">
        <li><a class="dropdown-item" id="btnLlamada"><i class="fas fa-phone"></i> Llamada</a></li>
        <li><a class="dropdown-item" id="btnWhatsapp"><i class="fab fa-whatsapp"></i> WhatsApp</a></li>
    </ul>
`;

// La función de inicialización se mantiene igual
function inicializarBotonesContacto(prospecto, id) {
  const btnLlamada = document.getElementById("btnLlamada");
  const btnWhatsapp = document.getElementById("btnWhatsapp");

  if (btnLlamada && btnWhatsapp) {
      const telefono = prospecto.telefono_prospecto;

      // Función para mostrar alerta cuando no hay teléfono
      const mostrarAlertaTelefono = () => {
          Swal.fire({
              icon: 'warning',
              title: 'Teléfono no registrado',
              text: 'Este prospecto no tiene un número de teléfono registrado',
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#3085d6'
          });
      };

      // Si no hay teléfono, deshabilitar botones y mostrar alerta al hacer clic
      if (!telefono || telefono.trim() === '') {
          btnLlamada.classList.add('disabled');
          btnWhatsapp.classList.add('disabled');
          btnLlamada.onclick = mostrarAlertaTelefono;
          btnWhatsapp.onclick = mostrarAlertaTelefono;
          return;
      }

      const numeroLimpio = telefono.replace(/[^\d+]/g, '');

      btnLlamada.onclick = () => {
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          if (isMobile) {
              window.location.href = `tel:${numeroLimpio}`;
              registrarLlamada(id, prospecto);
          } else {
              mostrarModalLlamada(numeroLimpio);
          }
      };

      const nombreAsesorMen = localStorage.getItem('userName');
      btnWhatsapp.onclick = () => {
          const mensaje = `Hola, te habla tu asesor: ${nombreAsesorMen}`;
          const mensajeCodificado = encodeURIComponent(mensaje);
          const whatsappUrl = `https://wa.me/${numeroLimpio}?text=${mensajeCodificado}`;
          window.open(whatsappUrl, '_blank');
      };
  }
}

// Y simplificamos los estilos CSS significativamente
const styles3 = `
#btnContactar {
    height: 40px; /* Reducido de 45px a 40px */
}

#btnContactar button {
    width: 100%;
    height: 100%;
    background: #2d3142;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center; /* Centra el texto horizontalmente */
    padding: 8px 16px;
}

#btnContactar button::after {
    display: none;
}

#btnContactar .dropdown-menu {
    min-width: 160px;
    margin-top: 5px;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    border: 1px solid rgba(0,0,0,0.1);
}

#btnContactar .dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    font-size: 14px;
}

#btnContactar .dropdown-item i {
    width: 16px;
    text-align: center;
}

#btnContactar .dropdown-item:hover {
    background-color: #f8f9fa;
}

#btnContactar .dropdown-item#btnWhatsapp i {
    color: #25D366;
}
`;

// Agregar los estilos
const styleSheet = document.createElement("style");
styleSheet.textContent = styles3;
document.head.appendChild(styleSheet);


// Función para mostrar modal en desktop
function mostrarModalLlamada(numero) {
  const modalHTML = `
    <div class="modal fade" id="llamadaModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Información de contacto</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p>Número de teléfono:</p>
            <h3 class="text-center">${numero}</h3>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Añadir el modal al DOM
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Mostrar el modal
  const modal = new bootstrap.Modal(document.getElementById('llamadaModal'));
  modal.show();

  // Eliminar el modal del DOM cuando se cierre
  document.getElementById('llamadaModal').addEventListener('hidden.bs.modal', function () {
    this.remove();
  });
}

// Función para registrar la llamada en la base de datos
async function registrarLlamada(prospectoId, prospecto) {
  try {
    // Incrementar el contador de llamadas
    const numLlamadas = (prospecto.num_llamadas || 0) + 1;

    // Actualizar el documento del prospecto
    await db.collection("prospectos2").doc(prospectoId).update({
      num_llamadas: numLlamadas
    });

  

  } catch (error) {
    console.error("Error al registrar la llamada:", error);
    mostrarAlerta('Error al registrar la llamada', 'danger');
  }
}

// Función principal para mostrar el modal de pagos
// Función principal para mostrar el modal de pagos
async function mostrarModalPagos(prospecto) {
  prospectoActual=prospecto
  const modalHTML = `
    <div class="modal fade" id="pagosModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Registro de Pagos</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="table-container">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Monto</th>
                  
                  </tr>
                </thead>
                <tbody id="tablaPagos">
                  <!-- Aquí se cargarán los pagos dinámicamente -->
                </tbody>
              </table>
            </div>
          </div> 
          <div class="action-buttons">
  <button class="btn-share" onclick="compartirPorWhatsApp()">
    <i class="fab fa-whatsapp"></i>
    Compartir
  </button>
  <button class="btn-add-payment" onclick="mostrarFormularioPago()">
    <i class="fas fa-plus"></i>
  </button>
</div>
        </div>
      </div>
    </div>

    <!-- Modal para nuevo pago -->
    <div class="modal fade" id="nuevoPagoModal" tabindex="-1">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Nuevo Pago</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="formNuevoPago">
              <div class="mb-3">
                <label for="fechaPago" class="form-label">Fecha</label>
                <input type="date" class="form-control" id="fechaPago" required>
              </div>
              <div class="mb-3">
                <label for="montoPago" class="form-label">Monto</label>
                <input type="number" class="form-control" id="montoPago" required>
              </div>
              <button type="submit" class="btn btn-primary w-100">Guardar Pago</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remover modales existentes si los hay
  const modalExistente = document.getElementById('pagosModal');
  const nuevoPagoModalExistente = document.getElementById('nuevoPagoModal');
  if (modalExistente) modalExistente.remove();
  if (nuevoPagoModalExistente) nuevoPagoModalExistente.remove();

  // Agregar los modales al DOM
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Inicializar el modal principal
  const modal = new bootstrap.Modal(document.getElementById('pagosModal'));
  
  // Cargar los pagos
  cargarPagos(prospecto.registro_de_pagos || []);
  
  // Inicializar el formulario de nuevo pago
  inicializarFormularioPago(prospecto);

  modal.show();
}

// Función para cargar los pagos en la tabla
function cargarPagos(pagos) {
  const tablaPagos = document.getElementById('tablaPagos');
  tablaPagos.innerHTML = '';

  if (!pagos || pagos.length === 0) {
    tablaPagos.innerHTML = `
      <tr>
        <td colspan="3">
          <div class="no-payments">
            <i class="fas fa-file-invoice-dollar mb-2" style="font-size: 24px; color: #6c757d;"></i>
            <p class="mb-0">Aún no hay pagos registrados</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  // Ordenar pagos por fecha (más reciente primero)
  const pagosOrdenados = [...pagos].sort((a, b) => {
    return new Date(b.fecha.split('/').reverse().join('-')) - 
           new Date(a.fecha.split('/').reverse().join('-'));
  });

  pagosOrdenados.forEach((pago, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${pago.fecha}</td>
      <td>$${parseFloat(pago.monto).toLocaleString('es-MX')}</td>
    `;
    tablaPagos.appendChild(tr);
  });
}

// Función para mostrar el formulario de nuevo pago
function mostrarFormularioPago() {
  const nuevoPagoModal = new bootstrap.Modal(document.getElementById('nuevoPagoModal'));
  nuevoPagoModal.show();
}

function inicializarFormularioPago(prospecto) {
  const form = document.getElementById('formNuevoPago');
  if (!form) return; // Validación adicional
  
  form.onsubmit = async (e) => {
    e.preventDefault();
    
    const fecha = document.getElementById('fechaPago').value;
    const monto = document.getElementById('montoPago').value;

    // Formatear fecha a DD/MM/YYYY
    const fechaFormateada = new Date(fecha).toLocaleDateString('es-MX');

    const nuevoPago = {
      fecha: fechaFormateada,
      monto: monto
    };

    try {
      // Actualizar el array de pagos
      const nuevosPagos = [...(prospecto.registro_de_pagos || []), nuevoPago];
      
      // Actualizar en Firestore
      await db.collection('prospectos2').doc(prospectoActualId).update({
        registro_de_pagos: nuevosPagos
      });

      // Actualizar la tabla
      cargarPagos(nuevosPagos);
      
      // Cerrar el modal de nuevo pago
      const nuevoPagoModal = bootstrap.Modal.getInstance(document.getElementById('nuevoPagoModal'));
      nuevoPagoModal.hide();
      
      // Limpiar el formulario
      form.reset();
      
      // Mostrar confirmación
      mostrarAlerta('Pago registrado correctamente', 'success');
      
    } catch (error) {
      console.error("Error al registrar el pago:", error);
      mostrarAlerta('Error al registrar el pago', 'error');
    }
  };
}

// Función para generar el mensaje formateado
function generarMensajePagos(prospecto) {
  const fecha = new Date().toLocaleDateString('es-MX');
  const hora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  let mensaje = `REGISTRO DE PAGOS\n`;
  mensaje += `------------------\n\n`;
  mensaje += `Fecha: ${fecha}\n`;
  mensaje += `Hora: ${hora}\n`;
  mensaje += `Cliente: ${prospecto.name}\n\n`;
  mensaje += `DETALLE DE PAGOS:\n`;
  mensaje += `------------------\n\n`;
  
  if (!prospecto.registro_de_pagos || prospecto.registro_de_pagos.length === 0) {
    mensaje += "No hay pagos registrados\n";
    return mensaje;
  }

  // Ordenar pagos por fecha (más reciente primero)
  const pagosOrdenados = [...prospecto.registro_de_pagos].sort((a, b) => {
    return new Date(b.fecha.split('/').reverse().join('-')) - 
           new Date(a.fecha.split('/').reverse().join('-'));
  });

  let total = 0;
  pagosOrdenados.forEach((pago, index) => {
    mensaje += `Fecha: ${pago.fecha}\n`;
    mensaje += `Monto: $${parseFloat(pago.monto).toLocaleString('es-MX')}\n`;
    mensaje += `------------------\n`;
    total += parseFloat(pago.monto);
  });

  mensaje += `\nRESUMEN:\n`;
  mensaje += `------------------\n`;
  mensaje += `Total de pagos: ${pagosOrdenados.length}\n`;
  mensaje += `Monto total: $${total.toLocaleString('es-MX')}\n\n`;
  mensaje += `------------------\n`;
  mensaje += `Este es un registro automático de pagos.\n`;
  mensaje += `Gracias por su preferencia.`;

  return mensaje;
}

// Función para compartir por WhatsApp
function compartirPorWhatsApp() {
  const mensaje = generarMensajePagos(prospectoActual);
  const mensajeCodificado = encodeURIComponent(mensaje);
  const urlWhatsApp = `https://wa.me/?text=${mensajeCodificado}`;
  window.open(urlWhatsApp, '_blank');
}

// Modificar la función mostrarModalPagos para guardar el prospecto actual
let prospectoActual = null;


// Función para eliminar un pago
async function eliminarPago(index) {
  if (!confirm('¿Está seguro de eliminar este pago?')) return;

  try {
    const prospectoDoc = await db.collection('prospectos2').doc(prospectoActualId).get();
    const prospecto = prospectoDoc.data();
    
    const nuevosPagos = [...prospecto.registro_de_pagos];
    nuevosPagos.splice(index, 1);
    
    await db.collection('prospectos2').doc(prospectoActualId).update({
      registro_de_pagos: nuevosPagos
    });

    cargarPagos(nuevosPagos);
    mostrarAlerta('Pago eliminado correctamente', 'success');
    
  } catch (error) {
    console.error("Error al eliminar el pago:", error);
    mostrarAlerta('Error al eliminar el pago', 'error');
  }
}
