


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
  
  // Inicializar Google Identity Services
  // Improved authentication and sign-out handling
function initializeGIS() {
  // Ensure Google Identity Services is fully loaded before setting up
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

      // Initialize sign-out functionality
      google.accounts.id.initialize({
          client_id: CONFIG.clientId,
          callback: handleCredentialResponse
      });

      isGisInitialized = true;
      checkSignedInState();
  } else {
      console.error("Google Identity Services not fully loaded");
      // Retry initialization after a short delay
      setTimeout(initializeGIS, 500);
  }
}

function handleCredentialResponse(response) {
  // Handle credential response if needed
  console.log("Credential response received");
}


function signOut() {
  // Clear local storage first
  accessToken = null;
  localStorage.removeItem('googleAccessToken');

  // Try to revoke token
  try {
      // Attempt to revoke token through Google's API
      fetch('https://oauth2.googleapis.com/revoke', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `token=${accessToken}`
      })
      .then(response => {
          console.log('Revoke response:', response);
          // Force sign-out regardless of revoke result
          handleSignedInState(false);
      })
      .catch(error => {
          console.error('Error during token revocation:', error);
          handleSignedInState(false);
      });

      // Additional sign-out methods
      if (google && google.accounts && google.accounts.id) {
          google.accounts.id.disableAutoSelect();
      }
  } catch (error) {
      console.error('Sign-out error:', error);
      handleSignedInState(false);
  }
}

// Alternative sign-out method if primary method fails
function forceSignOut() {
  // Clear all authentication-related data
  accessToken = null;
  localStorage.removeItem('googleAccessToken');
  sessionStorage.clear();

  // Reset UI state
  handleSignedInState(false);

  // Reload page to reset all states
  window.location.reload();
}

// Event listeners
document.getElementById("signoutButton").addEventListener("click", () => {
  signOut();
  // Fallback to force sign-out if primary method fails
  setTimeout(forceSignOut, 3000);
});
 
  // Verifica si el usuario ya inició sesión
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
  
      // Si el token no es válido, solicita uno nuevo silenciosamente
      reauthenticateSilently();
  }
  
  // Solicitar un nuevo token sin intervención del usuario
  function reauthenticateSilently() {
      if (!isGisInitialized) {
          console.error("Google Identity Services no está inicializado.");
          return;
      }
  
      tokenClient.requestAccessToken({
          prompt: '', // Evita mostrar la ventana emergente
      });
  }
  
  // Manejo del estado de la sesión
  function handleSignedInState(isSignedIn) {
      if (isSignedIn) {
          authorizeButton.style.display = "none";
          signoutButton.style.display = "block";
      } else {
          authorizeButton.style.display = "block";
          signoutButton.style.display = "none";
      }
  }

  
  // Inicializa GIS al cargar la página
  window.onload = () => {
      initializeGIS();
  };
  
  
  
  // Load Calendar Events
  async function loadEvents() {
    if (!accessToken) {
      showError("No se ha iniciado sesión.");
      return;
    }
  
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
      displayEvents(events.items || []);
    } catch (error) {
      showError("Error al cargar eventos.");
      console.error("Error al cargar eventos:", error);
    }
  }
  
  // Display Events on Calendar
  function displayEvents(events) {
    const dayElements = document.querySelectorAll(".day");
  
    if (dayElements.length === 0) {
      console.error("No hay elementos '.day' para pintar eventos.");
      return;
    }
  
    dayElements.forEach((dayEl) => {
      const dateStr = dayEl.dataset.date;
      const dayEvents = events.filter((event) => {
        const eventDate = event.start.dateTime
          ? new Date(event.start.dateTime)
          : new Date(event.start.date);
        return eventDate.toISOString().split("T")[0] === dateStr;
      });
  
      const eventsContainer = dayEl.querySelector(".events");
      if (!eventsContainer) {
        console.warn(`No se encontró contenedor de eventos para la fecha: ${dateStr}`);
        return;
      }
  
      eventsContainer.innerHTML = "";
  
      dayEvents.forEach((event) => {
        const eventEl = document.createElement("div");
        eventEl.className = "event";
        eventEl.textContent = event.summary || "Sin título";
        eventEl.addEventListener("click", (e) => {
          e.stopPropagation();
          openEventModal(event, dateStr);
        });
        eventsContainer.appendChild(eventEl);
      });
    });
  }
  const loaderContainer = document.getElementById('loader');
  
  // Generate Calendar
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
    // Add click event listeners to days
    document.querySelectorAll('.day').forEach(day => {
      day.addEventListener('click', () => openDayModal(day.dataset.date));
    });
  }
  
  // Show Error Messages
  function showError(message) {
    errorMessageEl.textContent = message;
    errorMessageEl.style.display = "block";
    setTimeout(() => {
      errorMessageEl.style.display = "none";
    }, 5000);
  }
  
  // Event Listeners
  authorizeButton.addEventListener("click", () => {
    tokenClient.requestAccessToken();
  });
  
 signoutButton.addEventListener("click", () => {
    if (typeof google === "undefined" || !google.accounts || !google.accounts.id) {
        console.error("Google Identity Services no está disponible.");
        return;
    }

    if (!isGisInitialized) {
        console.error("Google Identity Services no está inicializado.");
        return;
    }

    if (!accessToken) {
        console.error("No hay un token de acceso para revocar.");
        return;
    }

    google.accounts.id.revoke(accessToken, () => {
        accessToken = null;
        localStorage.removeItem('googleAccessToken');
        handleSignedInState(false);
        console.log("Sesión cerrada correctamente.");
    });
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
  
  // Initialize Google Identity Services
  const gisScript = document.createElement("script");
  gisScript.src = "https://accounts.google.com/gsi/client";
  gisScript.onload = initializeGIS;
  document.body.appendChild(gisScript);
  
  // Generate the initial calendar
  generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
  
  // New functions for event management
  
  function openDayModal(date) {
    const modal = document.getElementById('dayModal');
    const modalDate = document.getElementById('modalDate');
    const eventList = document.getElementById('eventList');
    
    modalDate.textContent = new Date(date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    eventList.innerHTML = '';
  
    // Fetch events for the selected date
    fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${date}T00:00:00Z&timeMax=${date}T23:59:59Z&singleEvents=true`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    .then(response => response.json())
    .then(data => {
      data.items.forEach(event => {
        const eventEl = document.createElement('div');
        eventEl.innerHTML = `
          <strong>${event.summary}</strong> - ${new Date(event.start.dateTime || event.start.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          <button onclick="viewMoreInfo('${event.id}')">Ver más información</button>
          <button class="edit-btn" onclick="editEvent('${event.id}', '${date}')">Editar</button>
          <button class="delete-btn" onclick="deleteEvent('${event.id}', '${date}')">Eliminar</button>
        `;
        
        // Ocultar botones si el usuario es asesor
        if (localStorage.getItem('userType') === 'asesor') {
          eventEl.querySelector('.edit-btn').style.display = 'none';
          eventEl.querySelector('.delete-btn').style.display = 'none';
        }
        
        eventList.appendChild(eventEl);
      });
    })
    .catch(error => console.error('Error fetching events:', error));
  
    modal.style.display = 'block';
    document.getElementById('addEventBtn').onclick = () => openEventForm(date);
}



  function revokeToken() {
    if (!tokenClient || !accessToken) {
        console.error("No se puede revocar el token: cliente o token no inicializado.");
        return;
    }
    google.accounts.id.revoke(accessToken, () => {
        accessToken = null;
        localStorage.removeItem('googleAccessToken');
        handleSignedInState(false);
        console.log("Sesión cerrada correctamente.");
    });
}

  
function openEventForm(date, eventId = null, readOnly = false) {
  const modal = document.getElementById('eventFormModal');
  const form = document.getElementById('eventForm');
  const titleInput = document.getElementById('eventTitle');
  const timeInput = document.getElementById('eventTime');
  const descriptionInput = document.getElementById('eventDescription');

  if (eventId) {
      // Fetch event details if editing
      fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
      })
      .then(response => response.json())
      .then(event => {
          titleInput.value = event.summary;
          timeInput.value = new Date(event.start.dateTime || event.start.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
          descriptionInput.value = event.description || '';
          document.getElementById('eventId').value = eventId;

          // Si es solo lectura, inhabilitar los inputs
          if (readOnly) {
              titleInput.disabled = true;
              timeInput.disabled = true;
              descriptionInput.disabled = true;
              form.querySelector('button[type="submit"]').style.display = 'none'; // Ocultar botón de guardar
          } else {
              titleInput.disabled = false;
              timeInput.disabled = false;
              descriptionInput.disabled = false;
              form.querySelector('button[type="submit"]').style.display = 'block'; // Mostrar botón de guardar
          }
      })
      .catch(error => console.error('Error fetching event details:', error));
  } else {
      form.reset();
      document.getElementById('eventId').value = '';
      titleInput.disabled = false;
      timeInput.disabled = false;
      descriptionInput.disabled = false;
      form.querySelector('button[type="submit"]').style.display = 'block'; // Mostrar botón de guardar
  }

  modal.style.display = 'block';

  form.onsubmit = (e) => {
      e.preventDefault();
      if (!readOnly) {
          saveEvent(date);
      }
  };
}

// Nueva función para ver más información del evento
function viewMoreInfo(eventId) {
  openEventForm(null, eventId, true); // Abrir en modo solo lectura
}

  
  function saveEvent(date) {
    const title = document.getElementById('eventTitle').value;
    const time = document.getElementById('eventTime').value;
    const description = document.getElementById('eventDescription').value;
    const eventId = document.getElementById('eventId').value;
  
    const event = {
      summary: title,
      description: description,
      start: {
        dateTime: `${date}T${time}:00`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: `${date}T${time}:00`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
  
    const method = eventId ? 'PATCH' : 'POST';
    const url = eventId 
      ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`
      : 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  
    fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    })
    .then(response => response.json())
    .then(data => {
      console.log('Event saved:', data);
      closeModal('eventFormModal');
      loadEvents();
      openDayModal(date);
    })
    .catch(error => console.error('Error saving event:', error));
  }
  
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
  
  function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
  }
  
  // Add event listeners for closing modals
  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.onclick = () => closeModal(closeBtn.closest('.modal').id);
  });
  
  window.onclick = (event) => {
    if (event.target.classList.contains('modal')) {
      closeModal(event.target.id);
    }
  };

  