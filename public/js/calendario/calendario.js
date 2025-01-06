const CONFIG = {
  clientId: "851107842246-t571mmtul4jvch7sh6duc5l9pte0vh4s.apps.googleusercontent.com",
  apiKey: "AIzaSyBmSEe24W6jAvPwsqNKrGka2e5kCBRg5bE",
  scope: "https://www.googleapis.com/auth/calendar",
  discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
};

let currentDate = new Date();
const errorMessageEl = document.getElementById("errorMessage");
const authorizeButton = document.getElementById("authorizeButton");
const signoutButton = document.getElementById("signoutButton");

let tokenClient;
let accessToken = null;
let isGisInitialized = false;

function initializeGIS() {
  if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CONFIG.clientId,
          scope: CONFIG.scope,
          callback: (response) => {
              if (response.error) {
                  console.error("Error obtaining token:", response.error);
                  return;
              }
              accessToken = response.access_token;
              localStorage.setItem('googleAccessToken', accessToken);
              handleSignedInState(true);
              loadEvents();
          },
      });

      google.accounts.id.initialize({
          client_id: CONFIG.clientId,
          callback: handleCredentialResponse
      });

      isGisInitialized = true;
      checkSignedInState();
  } else {
      console.error("Google Identity Services not fully loaded");
      setTimeout(initializeGIS, 500);
  }
}

function handleCredentialResponse(response) {
  console.log("Credential response received");
}

function signOut() {
  accessToken = null;
  localStorage.removeItem('googleAccessToken');

  try {
      fetch('https://oauth2.googleapis.com/revoke', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `token=${accessToken}`
      })
      .then(response => {
          console.log('Revoke response:', response);
          handleSignedInState(false);
      })
      .catch(error => {
          console.error('Error during token revocation:', error);
          handleSignedInState(false);
      });

      if (google && google.accounts && google.accounts.id) {
          google.accounts.id.disableAutoSelect();
      }
  } catch (error) {
      console.error('Sign-out error:', error);
      handleSignedInState(false);
  }
}

function forceSignOut() {
  accessToken = null;
  localStorage.removeItem('googleAccessToken');
  sessionStorage.clear();
  handleSignedInState(false);
  window.location.reload();
}

document.getElementById("signoutButton").addEventListener("click", () => {
  signOut();
  setTimeout(forceSignOut, 3000);
});

async function checkSignedInState() {
  const storedToken = localStorage.getItem('googleAccessToken');
  if (!storedToken) {
      handleSignedInState(false);
      return;
  }

  try {
      const response = await fetch(
          `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${storedToken}`
      );

      if (response.ok) {
          const tokenInfo = await response.json();
          if (tokenInfo.audience === CONFIG.clientId) {
              accessToken = storedToken;
              handleSignedInState(true);
              loadEvents();
              return;
          }
      }
  } catch (error) {
      console.error("Error al verificar el token:", error);
  }

  reauthenticateSilently();
}

function reauthenticateSilently() {
  if (!isGisInitialized) {
      console.error("Google Identity Services no está inicializado.");
      return;
  }

  tokenClient.requestAccessToken({
      prompt: '',
  });
}

function handleSignedInState(isSignedIn) {
  if (isSignedIn) {
      authorizeButton.style.display = "none";
      signoutButton.style.display = "block";
  } else {
      authorizeButton.style.display = "block";
      signoutButton.style.display = "none";
  }
}

window.onload = () => {
  initializeGIS();

  window.addEventListener('resize', () => {
      loadEvents();
  });
};

const EventType = {
    CASA_ANTIGUA: { name: "CASA_ANTIGUA", displayName: "Casa Antigua", color: "#6A0DAD" },
    MUSEO_AVES: { name: "MUSEO_AVES", displayName: "Museo de las Aves", color: "#FFFF00" },
    CAMPANARIO: { name: "CAMPANARIO", displayName: "Campanario", color: "#FFA500" },
    HUERTA_NOGAL: { name: "HUERTA_NOGAL", displayName: "Huerta el Nogal", color: "#228B22" },
    GENERAL: { name: "GENERAL", displayName: "General", color: "#FF0000" },
    EVENTOS_ESPECIALES: { name: "EVENTOS_ESPECIALES", displayName: "Eventos Especiales", color: "#FF6347" },
    CITAS: { name: "CITAS", displayName: "Citas", color: "#256905" }, // Cambiado a morado
    DEGUSTACION: { name: "DEGUSTACION", displayName: "Degustación", color: "#FF69B4" }
};



class CalendarEvent {
    constructor(data) {
        this.id = data.id;
        this.title = data.summary;
        this.description = data.description;
        
        // Ajustar la fecha para manejar correctamente la zona horaria
        const startDateTime = data.start.dateTime || data.start.date;
        const endDateTime = data.end.dateTime || data.end.date;
        
        // Crear fechas locales
        this.startTime = new Date(startDateTime);
        this.endTime = new Date(endDateTime);
        
        // Ajustar la fecha para el día correcto
        if (data.start.date) {  // Si es un evento de todo el día
            this.startTime = new Date(data.start.date + 'T00:00:00');
            this.endTime = new Date(data.end.date + 'T23:59:59');
        }
        
        this.type = this.determineEventType(data);
        this.color = this.type.color;
        this.clientName = this.extractClientName(data);
        this.creator = this.extractCreator(data);
    }
  
    // Método para obtener la fecha del evento en formato YYYY-MM-DD
    getDateKey() {
        const localDate = new Date(this.startTime);
        return `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
    }
  

  determineEventType(eventData) {
    // Obtener la categoría de las propiedades extendidas
    const category = eventData.extendedProperties?.shared?.category;
    
    // Verificar si la categoría existe y es válida
    if (category && EventType[category]) {
        return EventType[category];
    }
    
    // Si no hay categoría o no es válida, retornar GENERAL
    return EventType.GENERAL;
}

  extractClientName(eventData) {
      const descriptionLines = (eventData.description || '').split('\n');
      const clientLine = descriptionLines.find(line => line.startsWith('Cliente:'));
      return clientLine ? clientLine.replace('Cliente:', '').trim() : null;
  }

  extractCreator(eventData) {
      const descriptionLines = (eventData.description || '').split('\n');
      const creatorLine = descriptionLines.find(line => line.startsWith('Convocado por:'));
      return creatorLine ? creatorLine.replace('Convocado por:', '').trim() : 
             eventData.extendedProperties?.shared?.creator || 'Desconocido';
  }
}

class EventDecorator {
  constructor(calendarView) {
      this.calendarView = calendarView;
  }

  decorateDay(date, events) {
      const dayElement = this.findDayElement(date);
      if (!dayElement) return;

      const eventsContainer = dayElement.querySelector('.events');
      eventsContainer.innerHTML = '';

      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
          this.createMobileEventIndicators(eventsContainer, events);
      } else {
          this.createDesktopEventDisplay(eventsContainer, events);
      }

      if (events.length > 0) {
          dayElement.classList.add('has-events');
      } else {
          dayElement.classList.remove('has-events');
      }
  }

  createMobileEventIndicators(eventsContainer, events) {
    // Limpiar el contenedor
    eventsContainer.innerHTML = '';
    
    // Filtrar eventos únicos y ordenarlos por hora
    const uniqueEvents = events
        .reduce((acc, event) => {
            const exists = acc.find(e => e.id === event.id);
            if (!exists) {
                acc.push(event);
            }
            return acc;
        }, [])
        .sort((a, b) => a.startTime - b.startTime);

    // Tomar solo los primeros 2 eventos
    const displayEvents = uniqueEvents.slice(0, 2);

    displayEvents.forEach(event => {
        const dotEl = document.createElement('span');
        dotEl.className = 'event-dot';
        // Usar el color del EventType en lugar del SoftEventColors
        dotEl.style.backgroundColor = EventType[event.type.name]?.color || event.color;
        dotEl.title = `${event.title} - ${event.type.displayName} - ${
            event.startTime.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })
        }`;
     
           
    

        eventsContainer.appendChild(dotEl);
    });

    if (uniqueEvents.length > 2) {
        const moreEl = document.createElement('span');
        moreEl.className = 'more-events-dot';
        moreEl.textContent = `+${uniqueEvents.length - 2}`;
        moreEl.title = `${uniqueEvents.length - 2} eventos más`;
        eventsContainer.appendChild(moreEl);
    }
}

  createDesktopEventDisplay(eventsContainer, events) {
    // Limpiar el contenedor
    eventsContainer.innerHTML = '';
    
    // Filtrar eventos únicos y ordenarlos por hora
    const uniqueEvents = events
        .reduce((acc, event) => {
            const exists = acc.find(e => e.id === event.id);
            if (!exists) {
                acc.push(event);
            }
            return acc;
        }, [])
        .sort((a, b) => a.startTime - b.startTime);

    // Tomar solo los primeros 2 eventos
    const displayEvents = uniqueEvents.slice(0, 2);
    
    displayEvents.forEach(event => {
        const eventEl = document.createElement('div');
        eventEl.className = 'event';
        eventEl.style.backgroundColor = event.color;
        eventEl.style.color = this.getContrastColor(event.color);
        
        const displayText = event.type.displayName.length > 8 
            ? event.type.displayName.substring(0, 8) + '...' 
            : event.type.displayName;
        
        eventEl.textContent = displayText;
        eventEl.title = `${event.title} - ${event.startTime.toLocaleTimeString()}`;
        
        

        eventsContainer.appendChild(eventEl);
    });

    if (uniqueEvents.length > 2) {
        const moreEventsIndicator = this.createMoreEventsIndicator(uniqueEvents.length - 2);
        eventsContainer.appendChild(moreEventsIndicator);
    }
}

  findDayElement(date) {
      const dateString = this.formatDate(date);
      return document.querySelector(`.day[data-date="${dateString}"]`);
  }

  createEventElement(event) {
      const eventEl = document.createElement('div');
      eventEl.className = 'event';
      eventEl.style.backgroundColor = event.color;
      eventEl.style.color = this.getContrastColor(event.color);
      
      const displayText = event.type.displayName.length > 8 
          ? event.type.displayName.substring(0, 8) + '...' 
          : event.type.displayName;
      
      eventEl.textContent = displayText;
      
      eventEl.addEventListener('click', () => this.showEventDetails(event));

      return eventEl;
  }

  createMoreEventsIndicator(count) {
      const moreEl = document.createElement('div');
      moreEl.className = 'more-events';
      moreEl.textContent = '...';
      moreEl.title = `${count} eventos más`;
      return moreEl;
  }

  getContrastColor(hexColor) {
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 125 ? 'black' : 'white';
  }

  formatDate(date) {
      return date.toISOString().split('T')[0];
  }

 showEventDetails(event) {
    try {
        // Verificar si el modal existe
        const modal = document.getElementById('eventDetailsModal');
        if (!modal) {
            console.error('Modal no encontrado');
            return;
        }

        // Crear elementos si no existen
        const modalBody = modal.querySelector('.modal-body');
        if (!modalBody) {
            console.error('Modal body no encontrado');
            return;
        }

        // Limpiar contenido existente
        modalBody.innerHTML = `
            <div class="detail-row">
                <strong>Título:</strong>
                <span id="detailEventTitle"></span>
            </div>
            <div class="detail-row">
                <strong>Categoría:</strong>
                <span id="detailEventCategory"></span>
            </div>
            <div class="detail-row">
                <strong>Hora:</strong>
                <span id="detailEventTime"></span>
            </div>
            <div class="detail-row">
                <strong>Creador:</strong>
                <span id="detailEventCreator"></span>
            </div>
            <div class="detail-row">
                <strong>Descripción:</strong>
                <div id="detailEventDescription"></div>
            </div>
        `;

        // Obtener referencias a los elementos
        const titleEl = document.getElementById('detailEventTitle');
        const categoryEl = document.getElementById('detailEventCategory');
        const descriptionEl = document.getElementById('detailEventDescription');
        const timeEl = document.getElementById('detailEventTime');
        const creatorEl = document.getElementById('detailEventCreator');

        // Verificar que todos los elementos existan
        if (!titleEl || !categoryEl || !descriptionEl || !timeEl || !creatorEl) {
            console.error('No se pudieron crear todos los elementos necesarios');
            return;
        }

        // Establecer el contenido
        titleEl.textContent = event.title || 'Sin título';
        categoryEl.textContent = event.type.displayName || 'Sin categoría';
        descriptionEl.textContent = event.description || 'Sin descripción';
        timeEl.textContent = event.startTime.toLocaleTimeString();
        creatorEl.textContent = event.creator || 'Desconocido';

        // Añadir estilos
        const detailRows = modal.querySelectorAll('.detail-row');
        detailRows.forEach(row => {
            row.style.marginBottom = '10px';
            row.querySelector('strong').style.marginRight = '10px';
        });

        // Mostrar el modal
        openModal('eventDetailsModal');

    } catch (error) {
        console.error('Error al mostrar detalles del evento:', error);
        showError('Error al mostrar los detalles del evento');
    }
}
}

const styles = `
@media (max-width: 768px) {
  .events {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 0;
  }

  .event-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
      cursor: pointer;
  }

  .more-events-dot {
      font-size: 10px;
      color: #666;
      margin-left: 4px;
  }
}
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

async function loadEvents() {
    try {
        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                1
            ).toISOString()}&timeMax=${new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() + 1,
                0
            ).toISOString()}&showDeleted=false&singleEvents=true&orderBy=startTime`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const events = await response.json();
        
        // Eliminar la duplicación: solo usar un método para procesar los eventos
        const calendarEvents = events.items
            .filter(item => !item.status?.includes('cancelled'))
            .map(event => new CalendarEvent(event));

        // Crear un mapa para eventos únicos por fecha
        const eventsByDay = {};
        
        calendarEvents.forEach(event => {
            const dateKey = event.getDateKey();
            if (!eventsByDay[dateKey]) {
                eventsByDay[dateKey] = new Map(); // Usar Map para garantizar eventos únicos por ID
            }
            eventsByDay[dateKey].set(event.id, event); // Sobrescribir si existe un evento con el mismo ID
        });

        // Convertir el Map a array para cada día
        const processedEventsByDay = {};
        Object.keys(eventsByDay).forEach(dateKey => {
            processedEventsByDay[dateKey] = Array.from(eventsByDay[dateKey].values());
        });

        // Debug para verificar eventos
        console.log('Eventos procesados:', {
            total: calendarEvents.length,
            byDay: processedEventsByDay
        });

        const eventDecorator = new EventDecorator(document.getElementById('calendarDays'));
        
        // Decorar cada día con sus eventos
        Object.entries(processedEventsByDay).forEach(([dateKey, dayEvents]) => {
            const date = new Date(dateKey);
            // Ordenar eventos por hora
            const sortedEvents = dayEvents.sort((a, b) => a.startTime - b.startTime);
            eventDecorator.decorateDay(date, sortedEvents);
        });

    } catch (error) {
        showError("Error al cargar eventos.");
        console.error("Error al cargar eventos:", error);
    }
}

const loaderContainer = document.getElementById('loader');

function generateCalendar(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDay = firstDay.getDay();
  const monthLength = lastDay.getDate();
  const today = new Date();

  document.getElementById("currentMonth").textContent =
      firstDay.toLocaleString("es", { month: "long", year: "numeric" });

  let calendarHTML = "";
  let dayCount = 1;

  for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 7; j++) {
          if ((i === 0 && j < startingDay) || dayCount > monthLength) {
              calendarHTML += '<div class="day"></div>';
          } else {
              const isToday =
                  dayCount === today.getDate() &&
                  month === today.getMonth() &&
                  year === today.getFullYear();
              const date = new Date(year, month, dayCount);
              const dateStr = date.toISOString().split("T")[0];
              calendarHTML += `
                  <div class="day ${isToday ? "today" : ""}" data-date="${dateStr}">
                      <span class="day-number">${dayCount}</span>
                      <div class="events"></div>
                  </div>`;
              dayCount++;
          }
      }
  }

  document.getElementById("calendarDays").innerHTML = calendarHTML;
  
  loaderContainer.classList.add('hidden');
  document.querySelectorAll('.day').forEach(day => {
    day.addEventListener('click', (e) => {
        // Solo abrir el modal del día si el clic no viene de un evento
        if (!e.target.classList.contains('event-dot') && 
            !e.target.classList.contains('event')) {
            openDayModal(day.dataset.date);
        }
    });
});



}

function showError(message) {
  errorMessageEl.textContent = message;
  errorMessageEl.style.display = "block";
  setTimeout(() => {
      errorMessageEl.style.display = "none";
  }, 5000);
}

authorizeButton.addEventListener("click", () => {
  tokenClient.requestAccessToken();
});

document.getElementById("prevMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
  loadEvents();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
  loadEvents();
});

const gisScript = document.createElement("script");
gisScript.src = "https://accounts.google.com/gsi/client";
gisScript.onload = initializeGIS;
document.body.appendChild(gisScript);

generateCalendar(currentDate.getFullYear(), currentDate.getMonth());

const SoftEventColors = {
  CASA_ANTIGUA: { background: '#F0E6FF', text: '#6A0DAD' },
  MUSEO_AVES: { background: '#FFFAE6', text: '#FFA500' },
  CAMPANARIO: { background: '#FFF0E6', text: '#FF6B35' },
  HUERTA_NOGAL: { background: '#E6FFF0', text: '#228B22' },
  GENERAL: { background: '#FFE6E6', text: '#FF4136' },
  EVENTOS_ESPECIALES: { background: '#E6F2FF', text: '#0074D9' },
  CITAS: { background: '#E6FFFA', text: '#2ECC40' },
  DEGUSTACION: { background: '#FFF0F0', text: '#FF69B4' }
};

function getSoftEventColors(event) {
  const category = event.extendedProperties?.shared?.category || 'GENERAL';
  return SoftEventColors[category] || SoftEventColors.GENERAL;
}

function openDayModal(date) {

  closeModal('eventFormModal');
  closeModal('eventDetailsModal');
  const modal = document.getElementById('dayModal');
  const modalDate = document.getElementById('modalDate');
  const eventList = document.getElementById('eventList');
  
  if (!modal || !modalDate || !eventList) {
      console.error('Elementos del modal no encontrados');
      return;
  }

  // Crear una fecha local a partir de la fecha recibida
  const localDate = new Date(date + 'T00:00:00');
  
  // Formatear la fecha para el título del modal
  modalDate.textContent = localDate.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
  });
  
  eventList.innerHTML = '';

  // Ajustar las horas para la consulta
  const startTime = new Date(date + 'T00:00:00');
  const endTime = new Date(date + 'T23:59:59');

  // Formatear las fechas para la API
  const timeMin = startTime.toISOString();
  const timeMax = endTime.toISOString();

  fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`, {
      headers: { Authorization: `Bearer ${accessToken}` }
  })
  .then(response => {
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
  })
  .then(data => {
      if (data && Array.isArray(data.items)) {
          data.items.forEach(event => {
              const eventEl = document.createElement('div');
              const colors = getSoftEventColors(event);
              
              // Crear una fecha local para el evento
              const eventDate = new Date(event.start.dateTime || event.start.date);
              
              eventEl.innerHTML = `
                  <div class="event-content" style="background-color: ${colors.background}; color: ${colors.text}; border-left: 4px solid ${colors.text}; border-radius: 4px; padding: 10px; margin-bottom: 10px;">
                      <div class="event-info">
                          <div class="event-title" style="font-weight: bold;">
                              ${event.summary || 'Sin título'}
                          </div>
                          <div class="event-time" style="opacity: 0.7; margin-bottom: 10px;">
                              <i class="far fa-clock" style="margin-right: 5px;"></i>
                              ${eventDate.toLocaleTimeString('es-ES', { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short'
                              })}
                          </div>
                          <div class="event-actions" style="display: flex; justify-content: space-between; align-items: center;">
                              <button class="action-button info-button" 
                                      onclick="viewMoreInfo('${event.id}')"
                                      title="Ver detalles"
                                      style="background: none; border: none; color: ${colors.text}; cursor: pointer;">
                                  <i class="fas fa-info"></i>
                              </button>
                              <button class="action-button edit-button" 
                                      onclick="editEvent('${event.id}', '${date}')"
                                      title="Editar"
                                      style="background: none; border: none; color: ${colors.text}; cursor: pointer;">
                                  <i class="fas fa-edit"></i>
                              </button>
                              <button class="action-button delete-button" 
                                      onclick="deleteEvent('${event.id}', '${date}')"
                                      title="Eliminar"
                                      style="background: none; border: none; color: ${colors.text}; cursor: pointer;">
                                  <i class="fas fa-trash-alt"></i>
                              </button>
                          </div>
                      </div>
                  </div>
              `;
              
          
              
              eventList.appendChild(eventEl);
          });
      }

      const closeButtons = modal.querySelectorAll('.close, [data-dismiss="modal"]');
      if (closeButtons) {
          closeButtons.forEach(closeBtn => {
              closeBtn.onclick = () => {
                  closeModal('dayModal');
              };
          });
      }
  })
  .catch(error => {
      console.error('Error fetching events:', error);
      showError('Error al cargar los eventos');
  });

  openModal('dayModal');

  const addEventBtn = document.getElementById('addEventBtn');
  if (addEventBtn) {
      addEventBtn.onclick = () => openEventForm(date);
  }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.classList.add('modal-open');
        
        // Configurar los botones de cierre
        const closeButtons = modal.querySelectorAll('.close, .close-modal');
        closeButtons.forEach(button => {
            button.onclick = () => closeModal(modalId);
        });
        
        // Cerrar al hacer clic fuera del modal
        modal.onclick = (event) => {
            if (event.target === modal) {
                closeModal(modalId);
            }
        };
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
}

function openEventForm(date, eventId = null, readOnly = false) {
  closeModal('eventDetailsModal');
  closeModal('dayModal');
  
  const modal = document.getElementById('eventFormModal');
  const form = document.getElementById('eventForm');
  
  // Actualizar las referencias a los inputs con los IDs correctos
  const inputs = {
      title: document.getElementById('eventTitle'),
      description: document.getElementById('eventDescription'),
      place: document.getElementById('eventPlace'),
      client: document.getElementById('eventClient'),
      category: document.getElementById('eventCategory'),
      time: document.getElementById('eventTime')
  };

  if (eventId) {
      fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
      })
      .then(response => response.json())
      .then(event => {
          const eventDate = new Date(event.start.dateTime || event.start.date);
          
          inputs.title.value = event.summary || '';
          inputs.description.value = extractDescriptionOnly(event.description) || '';
          inputs.place.value = extractLocationFromDescription(event.description) || '';
          inputs.client.value = extractClientFromDescription(event.description) || '';
          inputs.category.value = event.extendedProperties?.shared?.category || 'GENERAL';
          inputs.time.value = eventDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
          
          // Establecer el ID del evento
          document.getElementById('eventId').value = eventId;

          // Manejar modo de solo lectura
          Object.values(inputs).forEach(input => {
              if (input) input.disabled = readOnly;
          });
          
          const submitButton = form.querySelector('button[type="submit"]');
          if (submitButton) {
              submitButton.style.display = readOnly ? 'none' : 'block';
          }
      })
      .catch(error => console.error('Error fetching event details:', error));
  } else {
      form.reset();
      document.getElementById('eventId').value = '';
      
      // Habilitar todos los inputs para un nuevo evento
      Object.values(inputs).forEach(input => {
          if (input) input.disabled = false;
      });
      
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
          submitButton.style.display = 'block';
      }
  }

  openModal('eventFormModal');

  // Configurar los botones de cierre
  document.querySelectorAll('.close, [data-dismiss="modal"]').forEach(closeBtn => {
      closeBtn.onclick = () => {
          closeModal('eventFormModal');
          openDayModal(date);
      };
  });

  // Configurar el envío del formulario
  form.onsubmit = (e) => {
      e.preventDefault();
      if (!readOnly) {
          saveEventEnhanced(date);
      }
  };
}

async function saveEventEnhanced(date) {
  const formData = {
      title: document.getElementById('eventTitle')?.value || '',
      description: document.getElementById('eventDescription')?.value || '',
      place: document.getElementById('eventPlace')?.value || '',
      client: document.getElementById('eventClient')?.value || '',
      category: document.getElementById('eventCategory')?.value || 'GENERAL',
      time: document.getElementById('eventTime')?.value || '',
      eventId: document.getElementById('eventId')?.value || ''
  };

  const fullDescription = buildEventDescription(
      formData.description,
      formData.client,
      formData.place,
      localStorage.getItem('userName') || 'Unknown'
  );

  const eventData = {
      summary: formData.title,
      description: fullDescription,
      start: {
          dateTime: `${date}T${formData.time}:00`,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
          dateTime: `${date}T${formData.time}:00`,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      extendedProperties: {
          shared: {
              category: formData.category,
              creator: localStorage.getItem('userName') || 'Unknown'
          }
      }
  };

  try {
      const isValid = await validateEventCreation(eventData.start.dateTime, formData.category);
      
      if (!isValid) {
          showError('Ya existe un evento similar en esta fecha');
          return;
      }

      if (formData.eventId) {
          await updateEvent(formData.eventId, eventData);
      } else {
          await createEvent(eventData);
      }

      closeModal('eventFormModal');
      loadEvents();
      openDayModal(date);
  } catch (error) {
      console.error('Error saving event:', error);
      showError('Error al guardar el evento');
  }
}

function buildEventDescription(description, client, location, creator) {
  return `${description}\nCliente: ${client}\nLugar: ${location}\nConvocado por: ${creator}`;
}

function extractCreatorFromDescription(description) {
  if (!description) return null;
  const match = description.match(/Convocado por:\s*([^\n]+)/);
  return match ? match[1].trim() : null;
}

function extractDescriptionOnly(fullDescription) {
  if (!fullDescription) return '';
  return fullDescription.split('\n')
      .filter(line => !line.startsWith('Cliente:') && 
                     !line.startsWith('Lugar:') && 
                     !line.startsWith('Convocado por:'))
      .join('\n')
      .trim();
}

function extractLocationFromDescription(description) {
  if (!description) return null;
  const match = description.match(/Lugar:\s*([^\n]+)/);
  return match ? match[1].trim() : null;
}

function extractClientFromDescription(description) {
  if (!description) return null;
  const match = description.match(/Cliente:\s*([^\n]+)/);
  return match ? match[1].trim() : null;
}


// Reemplaza el ExtensionContextHandler y ConnectionManager con esta versión simplificada
const AppManager = {
    initialized: false,

    initialize: function() {
        if (this.initialized) return;

        // Configurar manejadores de eventos globales
        this.setupErrorHandling();
        this.setupModalHandling();
        
        // Inicializar el calendario
        this.initializeCalendar();

        this.initialized = true;
    },

    setupErrorHandling: function() {
        window.addEventListener('error', (event) => {
            console.error('Error en la aplicación:', event.error);
            if (event.error && event.error.message.includes('Extension context invalidated')) {
                this.handleError('Error de contexto de extensión');
            }
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promesa no manejada:', event.reason);
            this.handleError('Error en operación asíncrona');
        });
    },

    setupModalHandling: function() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
    },

    initializeCalendar: function() {
        // Inicializar el calendario y cargar eventos
        generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
        if (accessToken) {
            loadEvents();
        }
    },

    handleError: function(message) {
        showError(message);
    },

    closeModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    }
};

// Modificar la función de inicialización principal
document.addEventListener('DOMContentLoaded', () => {
    AppManager.initialize();
});



async function handleEventAction(action, ...args) {
    try {
        switch (action) {
            case 'create':
                return await createEvent(...args);
            case 'update':
                return await updateEvent(...args);
            case 'delete':
                return await deleteEvent(...args);
            default:
                throw new Error(`Acción desconocida: ${action}`);
        }
    } catch (error) {
        console.error(`Error en acción ${action}:`, error);
        AppManager.handleError(`Error al procesar el evento`);
        return null;
    }
}




function populateEventDetailsModal(event) {
    try {
        // First check if the modal and content container exist
        const modalContent = document.getElementById('eventDetailsContent');
        if (!modalContent) {
            console.error('Modal content container not found');
            return;
        }

        const eventDate = new Date(event.start.dateTime || event.start.date);
        const formattedDate = eventDate.toISOString().split('T')[0];

        // Close other modals
        closeModal('dayModal');
        closeModal('eventFormModal');

        // Extract event information
        const description = extractDescriptionOnly(event.description);
        const client = extractClientFromDescription(event.description);
        const location = extractLocationFromDescription(event.description);
        const creator = event.extendedProperties?.shared?.creator || 
                       event.extendedProperties?.shared?.lastModifiedBy || 
                       extractCreatorFromDescription(event.description) ||
                       'Desconocido';
        const category = event.extendedProperties?.shared?.category || 'GENERAL';

        const colors = getSoftEventColors(event);

        // Create modal content
        modalContent.innerHTML = `
            <div style="background-color: ${colors.background}; padding: 20px; border-radius: 8px; border-left: 4px solid ${colors.text};">
                <div class="event-detail-row">
                    <strong>Título:</strong>
                    <span style="color: ${colors.text}">${event.summary || 'Sin título'}</span>
                </div>
                <div class="event-detail-row">
                    <strong>Fecha:</strong>
                    <span>${eventDate.toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric'
                    })}</span>
                </div>
                <div class="event-detail-row">
                    <strong>Hora:</strong>
                    <span>${eventDate.toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit'
                    })}</span>
                </div>
                <div class="event-detail-row">
                    <strong>Categoría:</strong>
                    <span style="color: ${colors.text}">${EventType[category]?.displayName || category}</span>
                </div>
                <div class="event-detail-row">
                    <strong>Cliente:</strong>
                    <span>${client || 'No especificado'}</span>
                </div>
                <div class="event-detail-row">
                    <strong>Lugar:</strong>
                    <span>${location || 'No especificado'}</span>
                </div>
                <div class="event-detail-row">
                    <strong>Creado por:</strong>
                    <span>${creator}</span>
                </div>
                ${description ? `
                    <div class="event-detail-row">
                        <strong>Descripción:</strong>
                        <p style="margin-top: 8px;">${description}</p>
                    </div>
                ` : ''}
            </div>
        `;

        // Open the modal
        openModal('eventDetailsModal');

        // Set up edit button if it exists
        const editBtn = document.getElementById('editEventBtn');
        if (editBtn) {
            editBtn.onclick = () => {
                closeModal('eventDetailsModal');
                openEventForm(formattedDate, event.id);
            };
        }

        // Set up close buttons
        const closeButtons = document.querySelectorAll('.close, [data-dismiss="modal"]');
        closeButtons.forEach(closeBtn => {
            closeBtn.onclick = () => {
                closeModal('eventDetailsModal');
                openDayModal(formattedDate);
            };
        });

    } catch (error) {
        console.error('Error populating event details:', error);
        showError('Error al mostrar los detalles del evento');
    }
}

function viewMoreInfo(eventId) {
  fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
  })
  .then(response => response.json())
  .then(event => {
      const eventDate = new Date(event.start.dateTime || event.start.date);
      const formattedDate = eventDate.toISOString().split('T')[0];

      closeModal('dayModal');
      closeModal('eventFormModal');

      populateEventDetailsModal(event);

      document.getElementById('editEventBtn').onclick = () => {
          closeModal('eventDetailsModal');
          openEventForm(formattedDate, event.id);
      };
  })
  .catch(error => {
      console.error('Error fetching event details:', error);
      showError('No se pudieron cargar los detalles del evento');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.close, [data-dismiss="modal"]').forEach(closeBtn => {
      closeBtn.addEventListener('click', (e) => {
          const modal = closeBtn.closest('.modal');
          if (modal) {
              closeModal(modal.id);
          }
      });
  });

  document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
          if (e.target === modal) {
              closeModal(modal.id);
          }
      });
  });
});

function deleteEvent(eventId, date) {
  if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` }
      })
      .then(() => {
          console.log('Event deleted');
          loadEvents();
          openDayModal(date);
      })
      .catch(error => console.error('Error deleting event:', error));
  }
}

function editEvent(eventId, date) {
  openEventForm(date, eventId);
}

async function createEvent(eventData) {
  try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              ...eventData,
              extendedProperties: {
                  shared: {
                      category: eventData.category || 'GENERAL',
                      creator: localStorage.getItem('userName') || 'Unknown'
                  }
              }
          })
      });

      if (!response.ok) {
          throw new Error('Failed to create event');
      }

      const createdEvent = await response.json();
      
      await sendEventNotification(createdEvent);

      return createdEvent;
  } catch (error) {
      console.error('Event creation error:', error);
      showError('No se pudo crear el evento');
      return null;
  }
}

async function updateEvent(eventId, eventData) {
  try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
          method: 'PATCH',
          headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              ...eventData,
              extendedProperties: {
                  shared: {
                      category: eventData.category || 'GENERAL',
                      lastModifiedBy: localStorage.getItem('userName') || 'Unknown'
                  }
              }
          })
      });

      if (!response.ok) {
          throw new Error('Failed to update event');
      }

      const updatedEvent = await response.json();
      
      await sendEventNotification(updatedEvent, 'updated');

      return updatedEvent;
  } catch (error) {
      console.error('Event update error:', error);
      showError('No se pudo actualizar el evento');
      return null;
  }
}

async function validateEventCreation(startTime, category) {
  try {
      const startDate = new Date(startTime);
      const dayStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const dayEnd = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 1);

      const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${dayStart.toISOString()}&timeMax=${dayEnd.toISOString()}&singleEvents=true`,
          {
              headers: { Authorization: `Bearer ${accessToken}` }
          }
      );

      const events = await response.json();

      const conflictingEvents = events.items.filter(event => {
          const eventCategory = event.extendedProperties?.shared?.category || 'GENERAL';
          return eventCategory === category;
      });

      return conflictingEvents.length === 0;
  } catch (error) {
      console.error('Event validation error:', error);
      return false;
  }
}

async function sendEventNotification(event, type = 'created') {
  try {
      const notificationData = {
          eventId: event.id,
          eventTitle: event.summary,
          eventDate: event.start.dateTime || event.start.date,
          type: type,
          createdBy: localStorage.getItem('userName')
      };

      await fetch('/api/notifications', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(notificationData)
      });
  } catch (error) {
      console.error('Notification error:', error);
  }
}

function saveEvent(date) {
  const title = document.getElementById('eventTitle').value;
  const time = document.getElementById('eventTime').value;
  const description = document.getElementById('eventDescription').value;
  const eventId = document.getElementById('eventId').value;
  const category = document.getElementById('eventCategory').value;

  const eventData = {
      summary: title,
      description: description,
      category: category,
      start: {
          dateTime: `${date}T${time}:00`,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
          dateTime: `${date}T${time}:00`,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
  };

  validateEventCreation(eventData.start.dateTime, category)
      .then(isValid => {
          if (isValid) {
              if (eventId) {
                  updateEvent(eventId, eventData)
                      .then(() => {
                          closeModal('eventFormModal');
                          loadEvents();
                          openDayModal(date);
                      });
              } else {
                  createEvent(eventData)
                      .then(() => {
                          closeModal('eventFormModal');
                          loadEvents();
                          openDayModal(date);
                      });
              }
          } else {
              showError('Ya existe un evento similar en esta fecha');
          }
      });
}

