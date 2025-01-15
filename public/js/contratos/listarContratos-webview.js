let unsubscribe;

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAOvefpvlXLtbTx1T2hYg2Ds56eiKI3eAk",
    authDomain: "jassodb-4b8e4.firebaseapp.com",
    databaseURL: "https://jassodb-4b8e4-default-rtdb.firebaseio.com",
    projectId: "jassodb-4b8e4",
    storageBucket: "jassodb-4b8e4.appspot.com",
    messagingSenderId: "851107842246",
    appId: "1:851107842246:web:aa155261b9acdda47e6fc7",
    measurementId: "G-N18F7GL2NG"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", () => {
    const filtroSelect = document.getElementById("filtro-select");
    const filtroInput = document.getElementById("filtro-input");
    const filtrarBtn = document.getElementById("filtrar-btn");
    const filtrarContainer = document.getElementById("filtrar-container");
    const contratosLista = document.getElementById("contratos-lista");
  
    filtroSelect.addEventListener("change", () => {
        const filtro = filtroSelect.value;
  

        if (filtro === "all") {
            filtrarContainer.style.display = "none";
            cargarContratos();
            filtroInput.innerHTML = "";
        } else {
            filtrarContainer.style.display = "block";
  
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
    const urlParams = new URLSearchParams(window.location.search);
    const uidAsesor = urlParams.get('uid');
  
    const boton = document.getElementById('btn-digilenciar');
     boton.addEventListener('click', function(event) { event.preventDefault();
           console.log('El botón ha sido clicado. Redirigiendo a:', `../contratosprueba-webview/contrato.html?uid=${uidAsesor}`); 
           window.location.href = `../contratosprueba-webview/contrato.html?uid=${uidAsesor}`;
         });
    
    
    
    
        filtrarBtn.addEventListener("click", async () => {
        const filtro = filtroSelect.value;
  
        if (filtro === "evento.fecha" || filtro === "servicios.total") {
            const min = document.getElementById("filtro-min").value;
            const max = document.getElementById("filtro-max").value;
  
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
  
    unsubscribe = cargarContratos();

});
  
const loaderContainer = document.getElementById('loader');
  

function cargarContratos() {
    // Obtener uidAsesor de los parámetros de la URL
   
    const urlParams = new URLSearchParams(window.location.search);
    const uidAsesor = urlParams.get('uid');
    if (!uidAsesor) {
        console.error('Error: No se encontró el uid en los parámetros de la URL');
        return;
    }

    // Consultar la colección de usuarios para obtener el userType
    db.collection('usuarios').doc(uidAsesor).get().then(doc => {
        if (!doc.exists) {
            console.error('Error: No se encontró el usuario con el uid especificado');
            return;
        }

        const usuarioTipo = doc.data().userType;
        const contratosRef = db.collection("contratos");
        let query;

        if (usuarioTipo === "asesor") {
            query = contratosRef.where("asesor", "==", uidAsesor).orderBy("fecha", "desc");
        } else {
            query = contratosRef.orderBy("fecha", "desc");
        }

        query.onSnapshot((querySnapshot) => {
            actualizarTabla(querySnapshot, "contratos-lista");
            loaderContainer.classList.add('hidden');
        }, (error) => {
            console.error("Error al escuchar cambios en contratos:", error);
            loaderContainer.classList.add('hidden');
        });
    }).catch(error => {
        console.error('Error al consultar la colección de usuarios:', error);
        loaderContainer.classList.add('hidden');
    });
}

  
function obtenerColorPorEstado(estado) {
    switch (estado) {
        case "en revision":
            return "#ffeeba";
        case "aprobado":
            return "#d4edda";
        case "rechazado":
            return "#f8d7da";
        case "concluido":
            return "#d1ecf1";
        default:
            return "#ffffff";
    }
}
  
function obtenerBotonPorEstado(estado, docId) {
    const usuarioTipo = localStorage.getItem('userType');
    
    if (estado === "en revision" && usuarioTipo === "asesor") {
        return `<button class="btn btn-warning" disabled>En revisión</button>`;
    }
    
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
    if (unsubscribe) {
        unsubscribe();
    }
    const contratosRef = db.collection("contratos");
    const query = contratosRef.where(campo, "==", valor);
    unsubscribe = query.onSnapshot((querySnapshot) => {
        actualizarTabla(querySnapshot, "contratos-lista");
    }, (error) => {
        console.error("Error al filtrar contratos:", error);
    });
}
  
async function filtrarContratosPorRango(campo, min, max) {
    if (unsubscribe) {
        unsubscribe();
    }
    const contratosRef = db.collection("contratos");
    const query = contratosRef
        .where(campo, ">=", min)
        .where(campo, "<=", max);
    unsubscribe = query.onSnapshot((querySnapshot) => {
        actualizarTabla(querySnapshot, "contratos-lista");
    }, (error) => {
        console.error("Error al filtrar contratos por rango:", error);
    });
}
  
async function actualizarTabla(querySnapshot, tableId) {
    const tabla = document.getElementById(tableId);
    tabla.innerHTML = "";

    if (querySnapshot.empty) {
        tabla.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">No hay contratos disponibles</td>
            </tr>
        `;
        return;
    }

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

        const estado = contrato.estado || "en revisión";
        const color = obtenerColorPorEstado(estado);
        const buttonHtml = obtenerBotonPorEstado(estado, doc.id);

        const row = `
            <tr style="background-color: ${color};">
                <td>${contrato.folio}</td>
                <td>${contrato.cliente.nombre}</td>
                <td>${nombre}</td>
                <td>${fecha}</td>
                <td>${buttonHtml}</td>
            </tr>
        `;
        tabla.innerHTML += row;
    }
}
  
async function verMasInfo(docId) {
    try {
        const docRef = db.collection("contratos").doc(docId);
        const doc = await docRef.get();
  
        if (doc.exists) {
            const contrato = doc.data();
            if (contrato.pdfUrl) {
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
  
function accionEnRevision(docId) {
    window.location.href=`/contratosprueba/revision.html?id=${docId}`;
}
  
async function accionAprobado(docId) {
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
    } catch (error) {
        console.error('Error al obtener los datos del contrato:', error);
        alert('Error al enviar el enlace. Por favor, intente de nuevo.');
    }
}
  
function accionRechazado(docId) {
    window.location.href=`/contratosprueba/contratoRechazo.html?id=${docId}`;
}
  
async function accionConcluido(docId) {
    try {
        const docRef = db.collection("contratos").doc(docId);
        const doc = await docRef.get();
  
        if (doc.exists) {
            const contrato = doc.data();
            if (contrato.pdfUrl) {
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

window.addEventListener('beforeunload', () => {
    if (unsubscribe) {
        unsubscribe();
    }
});
