// Define formatearFecha in the global scope
function formatearFecha(fecha) {
  if (fecha instanceof firebase.firestore.Timestamp) {
      const date = fecha.toDate();
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  } else if (typeof fecha === "string" || typeof fecha === "number") {
      const date = new Date(fecha);
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }
  return "Fecha no disponible";
}

function mostrarModalProspecto(prospecto, id, nombreAsesor) {
    document.getElementById("modalFolio").textContent = prospecto.folio || "Sin folio";
    document.getElementById("modalFecha").textContent = formatearFecha(prospecto.fecha_create);
    document.getElementById("modalNombre").textContent = prospecto.name || "Sin nombre";
    document.getElementById("modalTelefono").textContent = prospecto.telefono_prospecto || "Sin teléfono";
    document.getElementById("modalLlamadas").textContent = prospecto.num_llamadas || "0";
    document.getElementById("modalInvitados").textContent = prospecto.invitados || "100";
    document.getElementById("modalFechaEvento").textContent = prospecto.fecha_evento ? formatearFecha(prospecto.fecha_evento) : "Sin Fecha";
    document.getElementById("modalAsesor").textContent = nombreAsesor;
    document.getElementById("modalUltimoEditor").textContent = prospecto.nombreUsuarioModificador ? prospecto.nombreUsuarioModificador[prospecto.nombreUsuarioModificador.length - 1] : "Sin editar";
    document.getElementById("modalReferencia").textContent = prospecto.referencia || "Sin referencia";
    document.getElementById("modalPreguntoPor").textContent = prospecto.pregunta_por || "No especificado";
    document.getElementById("modalTipoEvento").textContent = prospecto.tipo_evento || "No especificado";
    document.getElementById("modalCita").textContent = prospecto.cita_hora ? formatearFecha(prospecto.cita_hora) : "Sin Cita";
    document.getElementById("modalObservaciones").textContent = prospecto.observacion || "Sin observaciones";

    // Actualizar el porcentaje de seguimiento
    const btnSeguimiento = document.getElementById("btnSeguimiento");
    btnSeguimiento.textContent = `Seguimiento ${prospecto.porcentaje || 0}%`;


btnSeguimiento.onclick = () => {
    const porcentaje = prospecto.porcentaje || 0;
    pasoActual = Math.floor(porcentaje / 7.7) + 1;
      // Close the prospect modal
      const prospectoModal = bootstrap.Modal.getInstance(document.getElementById("prospectoModal"));
      prospectoModal.hide();
    mostrarPasoSeguimiento(pasoActual);
};
    const modal = new bootstrap.Modal(document.getElementById("prospectoModal"));
    modal.show();
    
}

// Agregar event listeners para los nuevos botones
document.getElementById("btnContactar").addEventListener("click", function() {
    // Aquí puedes añadir la lógica para contactar al prospecto
    console.log("Contactar al prospecto");
});

document.getElementById("btnPaquetes").addEventListener("click", function() {
    // Aquí puedes añadir la lógica para mostrar los paquetes
    console.log("Mostrar paquetes");
});



document.getElementById("btnPagos").addEven// Add this to your listarProspectos.js file

const pasosData = [
    {
        titulo: "Registrar Información del Prospecto",
        contenido: "Registra de manera minuciosa todos los datos esenciales del prospecto. Esto incluye información personal, detalles de contacto, y cualquier dato específico relevante para los servicios que se ofrecen.",
        accionesRecomendadas: [
            "Asegúrate de obtener consentimiento para el manejo de datos personales conforme a la normativa vigente.",
            "Confirma la exactitud de la información con el prospecto antes de guardarla en el sistema para evitar errores futuros."
        ],
        botones: []
    },
    {
        titulo: "Llamar para ofrecer paquetes",
        contenido: "Verifica la autenticidad y exactitud de la información proporcionada mediante una llamada telefónica. Este paso es crucial para construir una base de datos confiable y para evitar malentendidos futuros.",
        accionesRecomendadas: [
            "Prepara un guion breve para la llamada que cubra todos los puntos clave que necesitas confirmar.",
            "Guarda un registro de la confirmación para futuras referencias y como respaldo del proceso de verificación."
        ],
        botones: [
            { texto: "Adjuntar", icono: "fas fa-paperclip", clase: "btn-secondary" }
        ]
    }, {
        titulo: "Agendar Cita para dar informes",
        contenido: "Coordina una cita con el prospecto para discutir mas a fondo sus necesidades y como tus servicios pueden satisfacerlas. Esta es una oportunidad para fortalecer la relacion y avanzar en el proceso de ventas.",
        accionesRecomendadas: [
            "Utiliza el apartado de citas para evitar dobles reservas",
            "Confirma la cita via Whatsapp o Llamada proporcionando detalles como la fecha, hora y lugar del encuentro"
        ],
        botones: [
            { texto: "Agendar cita", icono: "fas fa-calendar", clase: "btn-secondary" }
        ]
    }, {
        titulo: "Confirmar cita dia u horas antes",
        contenido: "Reconfirma la cita programada paraa asegurar que el prospecto y el personal asignado esten presentes. Esto ayuda a manejar mejor el tiempo y los recursos.",
        accionesRecomendadas: [
            "Realiza una llamada o envia un mensaje el dia antes y unas horas antes de la cita como recordatorio.",
            "Documenta la confirmacion recibida y cualquier cambio o cancelacion."
        ],
        botones: [
            { texto: "Adjuntar", icono: "fas fa-paperclip", clase: "btn-secondary" }
        ]
    }
    // Añade los demás pasos aquí...
];

let pasoActual = 1;
let pasosCompletados = new Set();

function mostrarPasoSeguimiento(paso) {
    const modal = document.getElementById('seguimientoModal');
    const data = pasosData[paso - 1];
    
    // Actualizar título
    document.getElementById('pasoTitulo').textContent = `Paso ${paso}. ${data.titulo}`;
    
    // Actualizar contenido
    document.getElementById('pasoContenido').textContent = data.contenido;
    
    // Actualizar acciones recomendadas
    const accionesHTML = data.accionesRecomendadas.map(accion => `<li>${accion}</li>`).join('');
    document.getElementById('accionesRecomendadas').innerHTML = `
        <h6>Acciones recomendadas:</h6>
        <ul>${accionesHTML}</ul>
    `;
    
    // Actualizar botones de acción
    const botonesContainer = document.getElementById('botonesAccion');
    botonesContainer.innerHTML = data.botones.map(boton => `
        <button class="btn ${boton.clase} btn-action">
            <i class="${boton.icono} me-2"></i>${boton.texto}
        </button>
    `).join('');
    
    // Actualizar navegación
    document.getElementById('numeroPaso').textContent = `Paso ${paso} de 13`;
    document.getElementById('pasoAnterior').disabled = paso === 1;
    document.getElementById('pasoSiguiente').disabled = paso === 13;
    
    // Aplicar estado completado si corresponde
    const contenidoContainer = document.getElementById('pasoContenido');
    if (pasosCompletados.has(paso)) {
        contenidoContainer.classList.add('paso-completado');
    } else {
        contenidoContainer.classList.remove('paso-completado');
    }
    
    // Mostrar modal si no está visible
    if (!modal.classList.contains('show')) {
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    }
}



// Event Listeners para navegación
document.getElementById('pasoAnterior').addEventListener('click', () => {
    if (pasoActual > 1) {
        pasoActual--;
        mostrarPasoSeguimiento(pasoActual);
    }
});

document.getElementById('pasoSiguiente').addEventListener('click', () => {
    if (pasoActual < 13) {
        pasoActual++;
        mostrarPasoSeguimiento(pasoActual);
    }
});

document.getElementById('marcarCompletado').addEventListener('click', async () => {
    pasosCompletados.add(pasoActual);
    const porcentaje = pasoActual * 7.7;
    
    try {
        // Actualizar en Firebase
        await db.collection("prospectos").doc(prospectoActualId).update({
            porcentaje: Math.round(porcentaje)
        });
        
        // Actualizar UI
        mostrarPasoSeguimiento(pasoActual);
        
        // Mostrar notificación
        alert(`Paso ${pasoActual} completado exitosamente`);
    } catch (error) {
        console.error("Error al actualizar el progreso:", error);
        alert("Error al actualizar el progreso");
    }
})



document.addEventListener("DOMContentLoaded", () => {
  const filtroSelect = document.getElementById("filtro-select");
  const filtroInput = document.getElementById("filtro-input");
  const filtrarBtn = document.getElementById("filtrar-btn");
  const filtrarContainer = document.getElementById("filtrar-container");
  const prospectosLista = document.getElementById("prospectos-lista");

  let lastVisible = null;
  const pageSize = 20;
  let isLoading = false;
  let currentQuery = null;

  filtroSelect.addEventListener("change", () => {
      const filtro = filtroSelect.value;
      if (filtro === "all") {
          filtrarContainer.style.display = "none";
          filtroInput.innerHTML = "";
          resetAndLoadProspectos();
      } else {
          filtrarContainer.style.display = "block";
          setupFilterInput(filtro);
      }
  });

  filtrarBtn.addEventListener("click", () => {
      const filtro = filtroSelect.value;
      const valor = getFilterValue(filtro);
      if (valor !== null) {
          filtrarProspectos(filtro, valor);
      } else {
          alert("Por favor, ingrese un valor para filtrar.");
      }
  });

  // Evento de scroll en el contenedor de la tabla
  const tableBody = document.querySelector('.table-responsive');
  tableBody.addEventListener("scroll", () => {
      if (tableBody.scrollTop + tableBody.clientHeight >= tableBody.scrollHeight - 100) {
          cargarMasProspectos(); // Llama a la función para cargar más prospectos
      }
  });

  resetAndLoadProspectos();

  function setupFilterInput(filtro) {
      switch (filtro) {
          case "fecha_create":
              filtroInput.innerHTML = `
                  <input type="date" id="filtro-min" class="form-control mb-2" placeholder="Fecha mínima">
                  <input type="date" id="filtro-max" class="form-control" placeholder="Fecha máxima">
              `;
              break;
          case "telefono_prospecto":
              filtroInput.innerHTML = `<input type="tel" id="filtro-valor" class="form-control" style="margin-top:30px;" placeholder="Teléfono (con o sin prefijo)">`;
              break;
          default:
              filtroInput.innerHTML = `<input type="text" id="filtro-valor" class="form-control" style="margin-top:30px;" placeholder="Buscar por ${filtro}">`;
      }
  }

  async function filtrarProspectos(filtro, valor) {
      prospectosLista.innerHTML = "";
      lastVisible = null;
      let query = db.collection("prospectos");

      if (filtro === "fecha_create") {
          const maxDate = new Date(valor.max);
          maxDate.setDate(maxDate.getDate() + 1);

          query = query
              .where("fecha_create", ">=", valor.min.getTime())
              .where("fecha_create", "<", maxDate.getTime())
              .orderBy("fecha_create", "desc");
      } else if (filtro === "telefono_prospecto") {
          query = query.where(filtro, "==", valor);
      } else if (filtro === "asesor") {
          const asesoresSnapshot = await db
              .collection("usuarios")
              .where("name", ">=", valor)
              .where("name", "<=", valor + "\uf8ff")
              .get();

          if (!asesoresSnapshot.empty) {
              const asesorIds = asesoresSnapshot.docs.map((doc) => doc.id);
              query = query
                  .where("asesor", "in", asesorIds)
                  .orderBy("fecha_create", "desc");
          } else {
              alert("No se encontraron asesores que coincidan con la búsqueda.");
              return;
          }
      } else if (
          filtro === "folio" ||
          filtro === "name" ||
          filtro === "pregunta_por" ||
          filtro === "tipo_evento"
      ) {
          query = query
              .orderBy(filtro)
              .orderBy("fecha_create", "desc")
              .startAt(valor)
              .endAt(valor + "\uf8ff");
      }

      currentQuery = query;
      cargarProspectos(query);
  }

  function getFilterValue(filtro) {
      if (filtro === "fecha_create") {
          const min = document.getElementById("filtro-min").value;
          const max = document.getElementById("filtro-max").value;
          return min && max ? { min: new Date(min), max: new Date(max) } : null;
      } else {
          return document.getElementById("filtro-valor").value.trim() || null;
      }
  }

  const loaderContainer = document.getElementById('loader');
  async function cargarProspectos(query) {
      isLoading = true;
      try {
          const querySnapshot = await query.limit(pageSize).get();
          if (querySnapshot.empty) {
              prospectosLista.innerHTML =
                  "<tr><td colspan='8'>No se encontraron prospectos.</td></tr>";
          } else {
              actualizarTabla(querySnapshot.docs);
              lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
          }
      } catch (error) {
          console.error("Error al cargar prospectos:", error);
          prospectosLista.innerHTML =
              "<tr><td colspan='8'>Error al cargar prospectos. Por favor, intente de nuevo.</td></tr>";
      } finally {
          isLoading = false;
          loaderContainer.classList.add('hidden');
      }
  }

  async function cargarMasProspectos() {
      if (!lastVisible || !currentQuery || isLoading) return;

      isLoading = true;
      try {
          const querySnapshot = await currentQuery
              .startAfter(lastVisible)
              .limit(pageSize)
              .get();

          if (!querySnapshot.empty) {
              actualizarTabla(querySnapshot.docs, true);
              lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
          }
      } catch (error) {
          console.error("Error al cargar más prospectos:", error);
      } finally {
          isLoading = false;
      }
  }

  function actualizarTabla(docs, append = false) {
      if (!append) {
          prospectosLista.innerHTML = "";
      }

      docs.forEach(async (doc) => {
          const prospecto = doc.data();
          const nombreAsesor = await obtenerNombreAsesor(prospecto.asesor);
          const row = crearFilaProspecto(prospecto, doc.id, nombreAsesor);
          prospectosLista.appendChild(row);
      });
  }

  async function obtenerNombreAsesor(asesorId) {
      if (!asesorId) return "Sin asesor";
      try {
          const doc = await db.collection("usuarios").doc(asesorId).get();
          return doc.exists ? doc.data().name || "Sin nombre" : "Sin asesor";
      } catch (error) {
          console.error("Error al obtener el nombre del asesor:", error);
          return "Error al obtener asesor";
      }
  }

  function crearFilaProspecto(prospecto, id, nombreAsesor) {
      const row = document.createElement("tr");
      row.style.cursor = "pointer";
      row.addEventListener("click", () => mostrarModalProspecto(prospecto, id, nombreAsesor));
      row.innerHTML = `
          <td>${prospecto.folio || "Sin folio"}</td>
          <td>${prospecto.name || "Sin nombre"}</td>
          <td>${prospecto.telefono_prospecto || "Sin teléfono"}</td>
          <td>${prospecto.pregunta_por || "No especificado"}</td>
          <td>${prospecto.tipo_evento || "No especificado"}</td>
          <td>${nombreAsesor}</td>
          <td>${formatearFecha(prospecto.fecha_create)}</td>
      `;
      return row;
  }

  function resetAndLoadProspectos() {
      prospectosLista.innerHTML = "";
      lastVisible = null;
      currentQuery = db.collection("prospectos").orderBy("fecha_create", "desc");
      cargarProspectos(currentQuery);
  }
});
