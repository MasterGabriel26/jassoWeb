

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
 const storage = firebase.storage();
 const auth = firebase.auth();


 document.addEventListener('DOMContentLoaded', (event) => {
    populateSelect('lugarEvento', 'lugares', 'nombreLugar');
    populateSelect('lugarMisa', 'lugares', 'nombreLugar');
    populateSelect('tipoEvento', 'eventos', 'evento');
});

 function populateSelect(selectId, collectionName, attribute) {
    const select = document.getElementById(selectId);
    db.collection(collectionName).get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = doc.data()[attribute];
            select.appendChild(option);
        });
    }).catch((error) => {
        console.error("Error fetching data: ", error);
    })};



// Configuración del evento para mostrar la sección de misa
document.getElementById("misaCheck").addEventListener("change", function () {
    const misaDetails = document.getElementById("misaDetails");
    const lugarMisa = document.getElementById("lugarMisa");
    if (this.checked) {
      misaDetails.style.display = "block";
      lugarMisa.setAttribute("required", "");
    } else {
      misaDetails.style.display = "none";
      lugarMisa.removeAttribute("required");
    }
  });
  

  function setupModal(modalId, btnId, canvasId, saveButtonId) {
    const modal = document.getElementById(modalId);
    const btn = document.getElementById(btnId);
    const span = modal.getElementsByClassName("close")[0];
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");
    const saveBtn = document.getElementById(saveButtonId);

    btn.onclick = function () {
        modal.style.display = "block";
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    };

    span.onclick = function () {
        modal.style.display = "none";
    };

    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    function startDrawing(e) {
        isDrawing = true;
        [lastX, lastY] = getCoordinates(e);
    }

    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();

        const [x, y] = getCoordinates(e);

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();

        [lastX, lastY] = [x, y];
    }

    function stopDrawing() {
        isDrawing = false;
    }

    function getCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if (e.touches && e.touches[0]) {
            return [
                (e.touches[0].clientX - rect.left) * scaleX,
                (e.touches[0].clientY - rect.top) * scaleY
            ];
        }

        return [
            (e.clientX - rect.left) * scaleX,
            (e.clientY - rect.top) * scaleY
        ];
    }

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);

    saveBtn.onclick = function () {
        modal.style.display = "none";
    };
}

setupModal("firmaAsesorModal", "firmaAsesorBtn", "firmaAsesorCanvas", "guardarFirmaAsesor");

  document.getElementById("eventoForm").onsubmit = function (e) {
    e.preventDefault();
  
    const camposVacios = validarCampos();
    if (camposVacios.length > 0) {
      alert("Todos los campos deben estar llenos. Te falta: " + camposVacios.join(", "));
      return;
    }
  
    guardarContratoPendiente();
  };
  
  // Función para validar que todos los campos estén llenos
  function validarCampos() {
    const camposVacios = [];
    const camposObligatorios = [ "nombre", "ciudad", "domicilio", "cp", "telefono", "celular", "tipoEvento", "fecha", "lugarEvento", "horario"];
    
    const misaCheck = document.getElementById("misaCheck");
    if (misaCheck.checked) {
      camposObligatorios.push("lugarMisa", "horarioMisa", "direccionMisa", "horaCivil");
    }
  
    camposObligatorios.forEach(id => {
      const campo = document.getElementById(id);
      if (campo.value.trim() === "" && !campo.disabled) {
        camposVacios.push(id);
      }
    });
  
    return camposVacios;
  }
  
  // Función para obtener el texto seleccionado de un select
  function getSelectedText(selectElement) {
    return selectElement.options[selectElement.selectedIndex].text;
  }
  
  function generarFolio() {
    // Función para generar letras aleatorias
    const letrasAleatorias = (longitud) => {
        const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // Letras posibles
        let resultado = "";
        for (let i = 0; i < longitud; i++) {
            const indice = Math.floor(Math.random() * caracteres.length);
            resultado += caracteres[indice];
        }
        return resultado;
    };

    // Generar las partes del folio
    const letras = letrasAleatorias(4); // Generar 4 letras aleatorias
    const numeros = Math.floor(Math.random() * 99999).toString().padStart(5, '0'); // Generar un número aleatorio de 5 dígitos

    // Combinar letras y números
    return `${letras}${numeros}`;
}

let asesor; // Declarar la variable en un alcance superior
let nombre;
// Asesor
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        asesor = user.uid; // Asegúrate de usar `uid`, no `id`
        
        try {
            // Obtener el documento del asesor en Firestore
            const docU = await db.collection('usuarios').doc(asesor).get();

            if (docU.exists) {
                 nombre = docU.data().name || "Sin nombre"; // Asegúrate de que el campo es correcto
                console.log(`Asesor: ${nombre}`);

                
            } else {
                console.log("No se encontró el documento del usuario");
            }
        } catch (error) {
            console.error("Error al obtener datos del usuario:", error);
        }
    } else {
        console.log("Usuario no autenticado.");
    }
});


async function guardarContratoPendiente() {
  const folio = generarFolio();
  const id = db.collection('contratos_pendientes').doc().id;

  try {
      const contratoData = {
          idContrato: id,
          folio: folio,
          fecha: Date.now(),
          asesor: asesor,
          cliente: {
              nombre: document.getElementById('nombre').value,
              domicilio: document.getElementById('domicilio').value,
              ciudad: document.getElementById('ciudad').value,
              cp: document.getElementById('cp').value,
              telefono: document.getElementById('telefono').value,
              celular: document.getElementById('celular').value
          },
          evento: {
              tipo: getSelectedText(document.getElementById('tipoEvento')),
              fecha: document.getElementById('fecha').value,
              lugar: getSelectedText(document.getElementById('lugarEvento')),
              horario: document.getElementById('horario').value
          },
          misa: document.getElementById('misaCheck').checked ? {
              lugar: getSelectedText(document.getElementById('lugarMisa')),
              horario: document.getElementById('horarioMisa').value,
              direccion: document.getElementById('direccionMisa').value,
              horaCivil: document.getElementById('horaCivil').value
          } : null,
          servicios: Array.from(document.getElementById('productosTable').getElementsByTagName('tbody')[0].rows).map(row => ({
              servicio: row.cells[0].getElementsByTagName('input')[0].value,
              cantidad: row.cells[1].getElementsByTagName('input')[0].value,
              descripcion: row.cells[2].getElementsByTagName('input')[0].value,
              precio: parseFloat(row.cells[3].getElementsByTagName('input')[0].value) || 0
          })),
          firmaAsesor: document.getElementById('firmaAsesorCanvas').toDataURL(),
          estado: 'pendiente',
          linkFirmaCliente: `https://jassocompany.com/firma-cliente.html?id=${id}`
      };

      await db.collection('contratos_pendientes').doc(id).set(contratoData);
      console.log('Contrato pendiente guardado en Firebase');

      alert(`Contrato pendiente guardado. El link para la firma del cliente es: ${contratoData.linkFirmaCliente}`);
      resetearFormulario();
  } catch (error) {
      console.error('Error al guardar el contrato pendiente en Firebase:', error);
      alert('Error al guardar el contrato pendiente. Por favor, intente de nuevo.');
  }
}


 function getSelectedText(selectElement) {
     return selectElement.options[selectElement.selectedIndex].text;
 }

 // Función para resetear el formulario
function resetearFormulario() {
    document.getElementById("eventoForm").reset();
    
    // Ocultar la sección de misa y quitar el atributo required
    document.getElementById("misaDetails").style.display = "none";
    document.getElementById("lugarMisa").removeAttribute("required");
    
    // Limpiar las firmas
    const canvasIds = ["firmaClienteCanvas", "firmaEmpresaCanvas", "firmaClienteCanvasClone", "firmaEmpresaCanvasClone"];
    canvasIds.forEach(id => {
      const canvas = document.getElementById(id);
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
  
    // Resetear la tabla de productos/servicios si existe
    const productosTable = document.getElementById("productosTable");
   
   
    if (productosTable) {
      const tbody = productosTable.getElementsByTagName("tbody")[0];
      tbody.innerHTML = `
      <td><input type="text" name="servicio[]" placeholder="Servicio"></td>
      <td><input type="number" name="cantidad[]" placeholder="Cantidad"></td>
      <td><input type="text" name="descripcion[]" placeholder="Descripción"></td>
      <td><input type="number" name="precio[]" placeholder="Precio"></td>`;// Eliminar todas las filas
      
    }
  
    console.log("Formulario reseteado");
  }
  

// Función para añadir filas en la tabla de productos/servicios
function agregarFila() {
    const table = document.getElementById("productosTable").getElementsByTagName("tbody")[0];
    const newRow = table.insertRow();
  
    newRow.innerHTML = `
      <td><input type="text" name="servicio[]" placeholder="Servicio"></td>
      <td><input type="number" name="cantidad[]" placeholder="Cantidad"></td>
      <td><input type="text" name="descripcion[]" placeholder="Descripción"></td>
      <td><input type="number" name="precio[]" placeholder="Precio"></td>
      <td><button type="button" class="deleteRow" onclick="eliminarFila(this)">-</button></td>`;
  }
  
  // Función para eliminar filas de la tabla de productos/servicios
  function eliminarFila(btn) {
    const row = btn.parentNode.parentNode;
    row.parentNode.removeChild(row);
  }