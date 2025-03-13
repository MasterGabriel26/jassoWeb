 // Función para formatear fechas
 function formatTimestamp(timestamp) {
    if (!timestamp) return 'Fecha desconocida';
    const date = new Date(timestamp);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  }

  // Función para cargar los clientes desde Firebase
  async function loadClientsFromFirebase() {
    const clientsContainer = document.getElementById('revisionesPendientes');

    try {
      const usuariosSnapshot = await db.collection("usuarios")
        .where("userType", "==", "cliente")
        .get();
      const usuarios = [];
      const eventosPromises = [];

      usuariosSnapshot.forEach(function(doc) {
        const userData = doc.data();
        if (userData) {
          usuarios.push({ id: doc.id, ...userData });

          const eventosPromise = db.collection("invitadosGrupos")
            .where("uid", "==", doc.id)
            .get();
          eventosPromises.push(eventosPromise);
        }
      });

      const eventosResults = await Promise.all(eventosPromises);

      const clientsWithEvents = usuarios.map(function(user, index) {
        const eventosSnapshot = eventosResults[index];
        const eventos = [];

        eventosSnapshot.forEach(function(doc) {
          eventos.push({ id: doc.id, ...doc.data() });
        });

        return {
          ...user,
          eventos: eventos
        };
      });

      clientsContainer.innerHTML = '';

      if (clientsWithEvents.length === 0) {
        clientsContainer.innerHTML = `
          <div class="no-data">
            <div class="no-data-icon"><i class="fas fa-users-slash"></i></div>
            <h3>No se encontraron clientes</h3>
            <p>No hay clientes registrados en el sistema.</p>
          </div>
        `;
        return;
      }

      clientsWithEvents.forEach(function(client) {
        const formattedDate = formatTimestamp(client.timestamp);

        const clientElement = document.createElement('a');
        clientElement.href = '#';
        clientElement.className = 'client-card';
        clientElement.onclick = function() {
          openModal(client.eventos);
        };

        const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(client.name || 'Usuario') + '&background=2c4167&color=fff';

        clientElement.innerHTML = `
          <div class="client-avatar">
            <img src="${client.imageProfile || defaultAvatar}" alt="${client.name || 'Usuario'}" onerror="this.src='${defaultAvatar}'">
            <span class="status-indicator ${client.onLine ? 'online' : 'offline'}"></span>
          </div>
          <div class="client-info">
            <h3 class="client-name">${client.name || 'Usuario sin nombre'}</h3>
            <p class="client-email">${client.email || 'Sin correo electrónico'}</p>
            <div class="client-details">
              <span class="client-type ${client.userType === 'admin' ? 'admin' : 'user'}">${(client.userType || 'usuario').toUpperCase()}</span>
              <span class="client-date">Desde: ${formattedDate}</span>
              ${client.eventos.length > 0 ? `<span class="events-badge"><span class="event-dot"></span>${client.eventos.length} evento${client.eventos.length !== 1 ? 's' : ''}</span>` : ''}
            </div>
          </div>
        `;

        clientsContainer.appendChild(clientElement);
      });

    } catch (error) {
      console.error("Error al cargar clientes:", error);
      clientsContainer.innerHTML = `
        <div class="no-data">
          <div class="no-data-icon"><i class="fas fa-exclamation-triangle"></i></div>
          <h3>Error al cargar datos</h3>
          <p>No se pudieron cargar los clientes. Por favor, intenta de nuevo más tarde.</p>
        </div>
      `;
    }
  }


// Variable global para almacenar el cliente actual
let currentClientId = null;

// Función modificada para abrir modal de eventos
function openModal(eventos) {
  const modal = document.getElementById('eventModal');
  const modalContent = modal.querySelector('.modal-content');
  const eventList = document.getElementById('eventList');
  
  // Guardar el ID del cliente seleccionado (el primero de la lista de eventos)
  if (eventos && eventos.length > 0) {
    currentClientId = eventos[0].uid;
  }
  
  eventList.innerHTML = '';

 
  eventos.forEach(function(evento) {
    const eventItem = document.createElement('li');
    eventItem.className = 'event-item';
    eventItem.innerHTML = `
      <div class="event-item-content">
        <div class="event-header">
          <div class="event-main-info">
            <i class="fas fa-calendar-alt event-icon"></i>
            <div class="event-details">
              <div class="event-name">${evento.nombre}</div>
              <div class="event-date">${formatTimestamp(evento.fechaEvento)}</div>
              ${evento.password ? `<div class="event-password">Contraseña: ${evento.password}</div>` : ''}
            </div>
          </div>
          <div class="event-quick-actions">
            <button class="event-edit-btn" onclick="editEvent('${evento.id}')">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        </div>
        
        <div class="event-send-link-container">
          <button class="event-send-link-btn" onclick="sendEventLinkToClient('${evento.id}', '${evento.nombre}')">
            <i class="fas fa-paper-plane"></i> Enviar link al cliente
          </button>
        </div>
      </div>
    `;
    eventList.appendChild(eventItem);
  });

  // Añadir el botón de crear evento si no existe
  let addEventContainer = modal.querySelector('.add-event-container');
  if (!addEventContainer) {
    addEventContainer = document.createElement('div');
    addEventContainer.className = 'add-event-container';
    addEventContainer.innerHTML = `
      <button id="addEventBtn" class="add-event-btn" onclick="createNewEvent()">
        <i class="fas fa-plus"></i> Crear nuevo evento
      </button>
    `;
    modalContent.appendChild(addEventContainer);
  }

  modal.style.display = 'flex';
  setTimeout(() => {
    modalContent.classList.add('show');
  }, 50);
}

// Función para crear un nuevo evento
function createNewEvent() {
  // Cerrar el modal de eventos
  closeModal();
  
  // Configurar el campo oculto del UID del cliente
  document.getElementById('eventoClienteId').value = currentClientId;
  
  // Establecer la fecha actual como valor por defecto
  const now = new Date();
  const formattedDate = now.toISOString().slice(0, 16); // Formato: YYYY-MM-DDTHH:MM
  document.getElementById('eventoFecha').value = formattedDate;
  
  // Mostrar el modal de crear evento
  const modal = document.getElementById('createEventModal');
  const modalContent = modal.querySelector('.modal-content');
  
  modal.style.display = 'flex';
  setTimeout(() => {
    modalContent.classList.add('show');
  }, 50);
}


function editEvent(eventId) {
  // Redirige a la página de edición con el ID del evento en la URL
  window.location.href = `page-administrar-invitados.html?uid=${eventId}&tp9ju=asxawesafax`;
}

// Función para actualizar la lista de eventos después de crear uno nuevo
function actualizarListaEventos() {
  if (!currentClientId) return;
  
  // Recargamos los eventos del cliente actual
  cargarEventosCliente(currentClientId);
}

// Función para cargar eventos de un cliente específico
async function cargarEventosCliente(clienteId) {
  try {
    const eventosSnapshot = await db.collection("invitadosGrupos")
      .where("uid", "==", clienteId)
      .get();
    
    const eventos = [];
    eventosSnapshot.forEach(function(doc) {
      eventos.push({ id: doc.id, ...doc.data() });
    });
    
    // Reabrir el modal con los eventos actualizados
    openModal(eventos);
    
  } catch (error) {
    console.error("Error al cargar eventos:", error);
    mostrarNotificacion('Error al cargar los eventos', 'error');
  }
}


function closeCreateEventModal() {
  const modal = document.getElementById('createEventModal');
  const modalContent = modal.querySelector('.modal-content');
  
  modalContent.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
}


  function closeModal() {
    const modal = document.getElementById('eventModal');
    const modalContent = modal.querySelector('.modal-content');
    
    modalContent.classList.remove('show');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }

  
 // Función para generar una contraseña aleatoria
function generarContrasenaAleatoria(longitud = 8) {
  const caracteresPermitidos = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let contrasena = '';
  for (let i = 0; i < longitud; i++) {
    const indiceAleatorio = Math.floor(Math.random() * caracteresPermitidos.length);
    contrasena += caracteresPermitidos.charAt(indiceAleatorio);
  }
  return contrasena;
}

// Función modificada para enviar link al cliente con generación de contraseña
async function sendEventLinkToClient(eventoId, eventoNombre) {
  try {
    // Referencia al documento del evento
    const eventoRef = db.collection("invitadosGrupos").doc(eventoId);
    
    // Obtener el documento del evento
    const eventoDoc = await eventoRef.get();
    
    // Verificar si el documento existe
    if (!eventoDoc.exists) {
      mostrarNotificacion('Evento no encontrado', 'error');
      return;
    }
    
    // Obtener los datos del evento
    const eventoData = eventoDoc.data();
    
    // Verificar si ya existe una contraseña
    let contrasena = eventoData.password;
    
    // Si no existe contraseña, generar una nueva
    if (!contrasena) {
      contrasena = generarContrasenaAleatoria();
      
      // Actualizar el documento con la nueva contraseña
      await eventoRef.update({
        password: contrasena
      });
    }
    
    // URL de tu página de eventos con el uid como parámetro
    const eventUrl = `https://jassocompany.com/invitadosCliente/page-administrar-invitados.html?uid=${eventoId}&tp9ju=${contrasena}`;
    
    // Construir el mensaje con formato
    const mensaje = `Hola, tu asesor te está invitando a conocer más sobre la lista de invitados de tu evento "${eventoNombre}".

Contraseña de acceso: ${contrasena}
    
Link de acceso:
${eventUrl}`;
    
    // Codificar el mensaje para URL
    const mensajeCodificado = encodeURIComponent(mensaje);
    
    // Crear el enlace de WhatsApp
    const whatsappUrl = `https://api.whatsapp.com/send?text=${mensajeCodificado}`;
    
    // Abrir WhatsApp en una nueva ventana/pestaña
    window.open(whatsappUrl, '_blank');
    
    // Mostrar notificación de éxito
    mostrarNotificacion('Link generado exitosamente', 'success');
    
  } catch (error) {
    console.error('Error al generar link:', error);
    mostrarNotificacion('Error al generar link', 'error');
  }
}

  // Cargar los clientes cuando se cargue la página
  document.addEventListener('DOMContentLoaded', loadClientsFromFirebase);







  