document.addEventListener("DOMContentLoaded", () => {
    const filtroSelect = document.getElementById("filtro-select");
    const filtroInput = document.getElementById("filtro-input");
    const filtrarBtn = document.getElementById("filtrar-btn");
    const contratosLista = document.getElementById("contratos-lista");
    const contratosPendientesLista = document.getElementById("contratos-pendientes-lista");

    filtroSelect.addEventListener("change", () => {
        const filtro = filtroSelect.value;

        if (filtro === "all") {
            filtrarBtn.style.display = "none";
            cargarContratos();
            cargarContratosPendientes();
            filtroInput.innerHTML = "";
        } else {
            filtrarBtn.style.display = "block";

            if (filtro === "fecha") {
                filtroInput.innerHTML = `
                    <label for="filtro-min" class="form-label">Fecha mínima</label>
                    <input type="date" id="filtro-min" class="form-control mb-2">
                    <label for="filtro-max" class="form-label">Fecha máxima</label>
                    <input type="date" id="filtro-max" class="form-control">
                `;
            } else {
                filtroInput.innerHTML = `
                    <label for="filtro-valor" class="form-label">Buscar por ${filtro}</label>
                    <input type="text" id="filtro-valor" class="form-control">
                `;
            }
        }
    });

    filtrarBtn.addEventListener("click", async () => {
        const filtro = filtroSelect.value;

        if (filtro === "fecha") {
            const min = document.getElementById("filtro-min").value;
            const max = document.getElementById("filtro-max").value;

            if (min && max && min > max) {
                alert("La fecha mínima no puede ser mayor que la fecha máxima.");
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

    cargarContratos();
    cargarContratosPendientes();
});

const loaderContainer = document.getElementById('loader');

async function cargarContratos() {
    try {
        const contratosRef = db.collection("contratos");
        const querySnapshot = await contratosRef.orderBy("fecha", "desc").get();
        actualizarTabla(querySnapshot, "contratos-lista");
    } catch (error) {
        console.error("Error al cargar contratos firmados:", error);
    }
}

async function cargarContratosPendientes() {
    try {
        const contratosRef = db.collection("contratos_pendientes");
        const querySnapshot = await contratosRef.orderBy("fecha", "desc").get();
        actualizarTabla(querySnapshot, "contratos-pendientes-lista");
    } catch (error) {
        console.error("Error al cargar contratos pendientes:", error);
    }
    loaderContainer.classList.add('hidden');
}

function formatearFecha(fecha) {
    if (fecha instanceof firebase.firestore.Timestamp) {
        return fecha.toDate().toLocaleDateString();
    } else if (typeof fecha === "string" || typeof fecha === "number") {
        return new Date(fecha).toLocaleDateString();
    } else {
        return "Fecha no disponible";
    }
}

async function filtrarContratosPorCampo(campo, valor) {
    try {
        const contratosRef = db.collection("contratos");
        const contratosPendientesRef = db.collection("contratos_pendientes");
        
        const querySnapshotContratos = await contratosRef.where(campo, "==", valor).get();
        const querySnapshotPendientes = await contratosPendientesRef.where(campo, "==", valor).get();
        
        actualizarTabla(querySnapshotContratos, "contratos-lista");
        actualizarTabla(querySnapshotPendientes, "contratos-pendientes-lista");
    } catch (error) {
        console.error("Error al filtrar contratos:", error);
    }
}

async function filtrarContratosPorRango(campo, min, max) {
    try {
        const contratosRef = db.collection("contratos");
        const contratosPendientesRef = db.collection("contratos_pendientes");
        
        const querySnapshotContratos = await contratosRef
            .where(campo, ">=", min)
            .where(campo, "<=", max)
            .get();
        
        const querySnapshotPendientes = await contratosPendientesRef
            .where(campo, ">=", min)
            .where(campo, "<=", max)
            .get();
        
        actualizarTabla(querySnapshotContratos, "contratos-lista");
        actualizarTabla(querySnapshotPendientes, "contratos-pendientes-lista");
    } catch (error) {
        console.error("Error al filtrar contratos por rango:", error);
    }
}

async function actualizarTabla(querySnapshot, tableId) {
    const tabla = document.getElementById(tableId);
    tabla.innerHTML = "";

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
                    <button class="btn btn-primary btn-sm" onclick="verMasInfo('${doc.id}', '${tableId === 'contratos-lista' ? 'contratos' : 'contratos_pendientes'}')">Ver más</button>
                </td>
            </tr>
        `;
        tabla.innerHTML += row;
    }
}

async function verMasInfo(docId, coleccion) {
    try {
        const docRef = db.collection(coleccion).doc(docId);
        const doc = await docRef.get();

        if (doc.exists) {
            const contrato = doc.data();
            if (coleccion === 'contratos_pendientes') {
                // Redirect to the form with the contract ID
                window.location.href = `../formularioContrato/formulario-contrato-admin.html?id=${docId}`;
            } else if (contrato.pdfUrl) {
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

