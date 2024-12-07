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
  document.getElementById("modalNombre").textContent = prospecto.name || "Sin nombre";
  document.getElementById("modalTelefono").textContent = prospecto.telefono_prospecto || "Sin teléfono";
  document.getElementById("modalLugar").textContent = prospecto.pregunta_por || "No especificado";
  document.getElementById("modalEvento").textContent = prospecto.tipo_evento || "No especificado";
  document.getElementById("modalFecha").textContent = formatearFecha(prospecto.fecha_create);

  const editarBtn = document.getElementById("editarProspectoBtn");
  editarBtn.href = `formularioProspecto/editar-prospecto.html?id=${id}`;

  const modal = new bootstrap.Modal(document.getElementById("prospectoModal"));
  modal.show();
}

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
