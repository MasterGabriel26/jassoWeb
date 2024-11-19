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
  
        const row = `
          <tr>
            <td>${contrato.folio}</td>
            <td>${contrato.cliente.nombre}</td>
            <td>${nombre}</td>
            <td>${fecha}</td>
            <td>
              <button class="btn btn-primary" onclick="verMasInfo('${doc.id}')">Ver más</button>
            </td>
          </tr>
        `;
        contratosLista.innerHTML += row;
      }
    } catch (error) {
      console.error("Error al cargar contratos:", error);
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
      const row = `
        <tr>
          <td>${contrato.folio}</td>
          <td>${contrato.cliente.nombre}</td>
          <td>${contrato.asesor}</td>
          <td>${fecha}</td>
          <td>
            <button class="btn btn-primary" onclick="verMasInfo('${doc.id}')">Ver más</button>
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
      console.error("Error al obtener el contrato:", error);
    }
  }
  