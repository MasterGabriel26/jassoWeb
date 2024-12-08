document.addEventListener("DOMContentLoaded", () => {
  const filtroSelect = document.getElementById("filtro-select");
  const filtroInput = document.getElementById("filtro-input");
  const filtrarBtn = document.getElementById("filtrar-btn");
  const filtrarContainer = document.getElementById("filtrar-container");
  const contratosLista = document.getElementById("contratos-lista");

  // Mostrar/ocultar el botón de filtrar
  filtroSelect.addEventListener("change", () => {
      const filtro = filtroSelect.value;

      if (filtro === "all") {
          filtrarContainer.style.display = "none"; // Oculta el botón de filtrar
          cargarContratos(); // Carga todos los contratos
          filtroInput.innerHTML = ""; // Limpia el input dinámico
      } else {
          filtrarContainer.style.display = "block"; // Muestra el botón de filtrar

          // Cambiar el input dinámico según el filtro seleccionado
          if (filtro === "evento.fecha") {
              filtroInput.innerHTML = `
                  <input type="date" id="filtro-min" class="form-control mb-2" placeholder="Fecha mínima">
                  <input type="date" id="filtro-max" class="form-control" placeholder="Fecha máxima">
              `;
          } else if (filtro === "servicios.total") {
              filtroInput.innerHTML = `
                  <input type="number" id="filtro-min" class="form-control mb-2" placeholder="Monto mínimo">
                  <input type="number" id="filtro-max" class="form-control" placeholder="Monto máximo">
              `;
          } else {
              filtroInput.innerHTML = `<input type="text" id="filtro-valor" class="form-control" style="margin-top:30px;" placeholder="Buscar por ${filtro}">`;
          }
      }
  });

  // Evento del botón Filtrar
  filtrarBtn.addEventListener("click", async () => {
      const filtro = filtroSelect.value;

      if (filtro === "evento.fecha" || filtro === "servicios.total") {
          const min = document.getElementById("filtro-min").value;
          const max = document.getElementById("filtro-max").value;

          // Validar rangos
          if (min && max && min > max) {
              alert("El valor mínimo no puede ser mayor que el valor máximo.");
              return;
          }
          await filtrarContratosPorRango(filtro, min || 0, max || Infinity);
      } else {
          const valor = document.getElementById("filtro-valor").value.trim();
          if (valor) {
              await filtrarContratosPorCampo(filtro, valor);
          } else {
              alert("Ingresa un valor para buscar.");
          }
      }
  });

  cargarContratos(); // Carga inicial de contratos
});

const loaderContainer = document.getElementById('loader');

// Función para cargar contratos
async function cargarContratos() {
  try {
      const contratosRef = db.collection("contratos");
      const querySnapshot = await contratosRef.orderBy("fecha", "desc").get();
      const contratosLista = document.getElementById("contratos-lista");
      contratosLista.innerHTML = ""; // Limpia la tabla

      for (const doc of querySnapshot.docs) {
          const contrato = doc.data();
          const fecha = formatearFecha(contrato.fecha);
          let nombre = "Sin nombre";

          if (contrato.asesor) {
              try {
                  const docU = await db.collection("usuarios").doc(contrato.asesor).get();
                  if (docU.exists) {
                      nombre = docU.data().name || "Sin nombre";
                  }
              } catch (error) {
                  console.error("Error al obtener datos del asesor:", error);
              }
          }

          const estado = contrato.estado || "en revisión"; // Suponiendo que el estado está en contrato
          const color = obtenerColorPorEstado(estado);
          const buttonHtml = obtenerBotonPorEstado(estado, doc.id); // Función para obtener el botón según el estado

          const row = `
              <tr style="background-color: ${color};">
                  <td>${contrato.folio}</td>
                  <td>${contrato.cliente.nombre}</td>
                  <td>${nombre}</td>
                  <td>${fecha}</td>
                  <td>
                      ${buttonHtml}
                  </td>
              </tr>
          `;
          contratosLista.innerHTML += row;
      }
  } catch (error) {
      console.error("Error al cargar contratos:", error);
  }
  loaderContainer.classList.add('hidden');
}

// Función para obtener el color según el estado
function obtenerColorPorEstado(estado) {
  switch (estado) {
      case "en revision":
          return "#ffeeba"; // Amarillo claro
      case "aprobado":
          return "#d4edda"; // Verde claro
      case "rechazado":
          return "#f8d7da"; // Rojo claro
      case "concluido":
          return "#d1ecf1"; // Azul claro
      default:
          return "#ffffff"; // Blanco por defecto
  }
}

// Función para obtener el botón según el estado
function obtenerBotonPorEstado(estado, docId) {
  switch (estado) {
      case "en revision":
          return `<button class="btn btn-warning" onclick="accionEnRevision('${docId}')">En revisión</button>`;
      case "aprobado":
          return `<button class="btn btn-success" onclick="accionAprobado('${docId}')">Aprobado</button>`;
      case "rechazado":
          return `<button class="btn btn-danger" onclick="accionRechazado('${docId}')">Rechazado</button>`;
      case "concluido":
          return `<button class="btn btn-info" onclick="accionConcluido('${docId}')">Concluido</button>`;
      default:
          return `<button class="btn btn-secondary" onclick="verMasInfo('${docId}')">Ver más</button>`;
  }
}

// Función para formatear fechas
function formatearFecha(fecha) {
  if (fecha instanceof firebase.firestore.Timestamp) {
      return fecha.toDate().toLocaleDateString();
  } else if (typeof fecha === "string" || typeof fecha === "number") {
      return new Date(fecha).toLocaleDateString();
  } else {
      return "Fecha no disponible";
  }
}

// Función para filtrar contratos por campo
async function filtrarContratosPorCampo(campo, valor) {
  try {
      const contratosRef = db.collection("contratos");
      const querySnapshot = await contratosRef.where(campo, "==", valor).get();
      actualizarTabla(querySnapshot);
  } catch (error) {
      console.error("Error al filtrar contratos:", error);
  }
}

// Función para filtrar contratos por rango
async function filtrarContratosPorRango(campo, min, max) {
  try {
      const contratosRef = db.collection("contratos");
      const querySnapshot = await contratosRef
          .where(campo, ">=", min)
          .where(campo, "<=", max)
          .get();
      actualizarTabla(querySnapshot);
  } catch (error) {
      console.error("Error al filtrar contratos por rango:", error);
  }
}

// Función para actualizar la tabla con los resultados
function actualizarTabla(querySnapshot) {
  const contratosLista = document.getElementById("contratos-lista");
  contratosLista.innerHTML = "";

  querySnapshot.forEach((doc) => {
      const contrato = doc.data();
      const fecha = formatearFecha(contrato.fecha);
      const estado = contrato.estado || "en revisión"; // Suponiendo que el estado está en contrato
      const color = obtenerColorPorEstado(estado);
      const buttonHtml = obtenerBotonPorEstado(estado, doc.id); // Función para obtener el botón según el estado

      const row = `
          <tr style="background-color: ${color};">
              <td>${contrato.folio}</td>
              <td>${contrato.cliente.nombre}</td>
              <td>${contrato.asesor}</td>
              <td>${fecha}</td>
              <td>
                  ${buttonHtml}
              </td>
          </tr>
      `;
      contratosLista.innerHTML += row;
  });
}

// Función para ver más información de un contrato
async function verMasInfo(docId) {
  try {
      const docRef = db.collection("contratos").doc(docId);
      const doc = await docRef.get();

      if (doc.exists) {
          const contrato = doc.data();
          if (contrato.pdfUrl) {
              // Abrir el PDF en una nueva pestaña
              window.open(contrato.pdfUrl, "_blank");
          } else {
              alert("No se encontró el PDF para este contrato.");
          }
      } else {
          console.log("No se encontró el documento");
      }
  } catch (error) {
      console.error("Error al obtener más información:", error);
  }
}

// Aquí puedes definir las funciones para manejar las acciones según el estado
function accionEnRevision(docId) {
  // Implementa la lógica para contratos en revisión
  window.location.href=`/public/contratosprueba/revision.html?id=${docId}`;
}

 async function accionAprobado(docId) {
  // Implementa la lógica para contratos aprobados

  try {
    const doc = await db.collection('contratos').doc(docId).get();
    if (doc.exists) {
        const data = doc.data();
        const telefono = data.cliente.celular;
        const mensaje = encodeURIComponent(`Hola ${data.cliente.nombre}, aquí está el enlace para firmar tu contrato: https://jassocompany.com/contratosprueba/firmaCliente.html?id=${docId}`);
        window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
    } else {
        alert('No se encontró el contrato');
    }
} catch (error) {w
    console.error('Error al obtener los datos del contrato:', error);
    alert('Error al enviar el enlace. Por favor, intente de nuevo.');
}

}

function accionRechazado(docId) {
  // Implementa la lógica para contratos rechazados
  console.log("Acción para contrato rechazado:", docId);
}

async function accionConcluido(docId) {
  try {
    const docRef = db.collection("contratos").doc(docId);
    const doc = await docRef.get();

    if (doc.exists) {
        const contrato = doc.data();
        if (contrato.pdfUrl) {
            // Abrir el PDF en una nueva pestaña
            window.open(contrato.pdfUrl, "_blank");
        } else {
            alert("No se encontró el PDF para este contrato.");
        }
    } else {
        console.log("No se encontró el documento");
    }
} catch (error) {
    console.error("Error al obtener más información:", error);
}
}
