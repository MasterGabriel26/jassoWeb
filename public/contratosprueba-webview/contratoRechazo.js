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
    const urlParams = new URLSearchParams(window.location.search);
    const contratoId = urlParams.get('id');
    console.log(contratoId)
    if (contratoId) {
      console.log(contratoId)
        cargarDatosContrato(contratoId);
    }
});




async function cargarOpciones(selectId, coleccion, campoNombre, valorActual) {
  const select = document.getElementById(selectId);
  select.innerHTML = ''; // Limpiar opciones existentes
  
  const querySnapshot = await db.collection(coleccion).get();
  
  querySnapshot.forEach((doc) => {
      const option = document.createElement('option');
      option.value = doc.data()[campoNombre];
      option.textContent = doc.data()[campoNombre];
      if (doc.data()[campoNombre] === valorActual) {
          option.selected = true;
      }
      select.appendChild(option);
  });

  // Si el valor actual no está en la lista, añadirlo como una opción
  if (!Array.from(select.options).some(option => option.value === valorActual)) {
      const option = document.createElement('option');
      option.value = valorActual;
      option.textContent = valorActual;
      option.selected = true;
      select.appendChild(option);
  }
}

let firmaCliente;
let firmaAsesor;


function showRejectionModal(reason) {
  const modal = document.getElementById('rejectionModal');
  const reasonElement = document.getElementById('rejectionReason');
  const okButton = document.getElementById('okButton');

  reasonElement.textContent = reason;
  modal.style.display = 'block';

  okButton.onclick = function() {
    modal.style.display = 'none';
  };

  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  };
}


let asesor;
async function cargarDatosContrato(contratoId) {
    try {
        const doc = await db.collection('contratos').doc(contratoId).get();
        if (doc.exists) {
            const data = doc.data();

             // Show rejection reason modal
      if (data.estado === 'rechazado' && data.razonRechazo) {
        showRejectionModal(data.razonRechazo);
      }
            document.getElementById('nombre').value = data.cliente.nombre;
            document.getElementById('ciudad').value = data.cliente.ciudad;
            document.getElementById('domicilio').value = data.cliente.domicilio;
            document.getElementById('cp').value = data.cliente.cp;
            document.getElementById('telefono').value = data.cliente.telefono;
            document.getElementById('celular').value = data.cliente.celular.replace('+52', '');
            asesor=data.asesor
            document.getElementById('fecha').value = data.evento.fecha;
          
            document.getElementById('horario').value = data.evento.horario;

            firmaCliente= data.firmaAsesor
            firmaAsesor=data.firmaAsesor
              // Cargar opciones para los selects
              
              await cargarOpciones('lugarEvento', 'lugares', 'nombreLugar', data.evento.lugar);
              await cargarOpciones('tipoEvento', 'eventos', 'evento', data.evento.tipo);
            if (data.misa) {
                document.getElementById('misaCheck').checked = true;
                document.getElementById('misaDetails').style.display = 'block';
                document.getElementById('lugarMisa').value = data.misa.lugar;
                document.getElementById('direccionMisa').value = data.misa.direccion;
                document.getElementById('horarioMisa').value = data.misa.horario;
                document.getElementById('horaCivil').value = data.misa.horaCivil;
            }

            const tbody = document.getElementById('productosTable').getElementsByTagName('tbody')[0];
            tbody.innerHTML = '';
            data.servicios.forEach(servicio => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td><input type="text" name="servicio[]" value="${servicio.servicio}" placeholder="Servicio"></td>
                    <td><input type="number" name="cantidad[]" value="${servicio.cantidad}" placeholder="Cantidad"></td>
                    <td><input type="text" name="descripcion[]" value="${servicio.descripcion}" placeholder="Descripción"></td>
                    <td><input type="number" name="precio[]" value="${servicio.precio}" placeholder="Precio"></td>
                    <td><button type="button" class="deleteRow" onclick="eliminarFila(this)">-</button></td>`;
            });

            if (data.firmaCliente) {
                const firmaClienteCanvas = document.getElementById('firmaClienteCanvasClone');
                const ctx = firmaClienteCanvas.getContext('2d');
                const img = new Image();
                img.onload = function() {
                    ctx.drawImage(img, 0, 0);
                }
                img.src = data.firmaCliente;
            }

            if (data.firmaEmpresa) {
                const firmaEmpresaCanvas = document.getElementById('firmaEmpresaCanvasClone');
                const ctx = firmaEmpresaCanvas.getContext('2d');
                const img = new Image();
                img.onload = function() {
                    ctx.drawImage(img, 0, 0);
                }
                img.src = data.firmaEmpresa;
            }
        } else {
            console.log("No se encontró el contrato");
        }
    } catch (error) {
        console.error("Error al cargar los datos del contrato:", error);
    }
}

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
  
// Modifica la función setupModal
function setupModal(modalId, btnId, canvasId, saveButtonId, cloneCanvasId) {
  const modal = document.getElementById(modalId);
  const btn = document.getElementById(btnId);
  const span = modal.getElementsByClassName("close")[0];
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  const saveBtn = document.getElementById(saveButtonId);
  const cloneCanvas = document.getElementById(cloneCanvasId);
  const cloneCtx = cloneCanvas.getContext("2d");

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
    cloneCtx.clearRect(0, 0, cloneCanvas.width, cloneCanvas.height);
    cloneCtx.drawImage(canvas, 0, 0);
    console.log("Firma guardada y clonada en el contenedor externo.");
    modal.style.display = "none";
  };
}


  setupModal("firmaAsesorModal", "firmaAsesorBtn", "firmaAsesorCanvas", "guardarFirmaAsesor", "firmaAsesorCanvasClone");

  document.getElementById("eventoForm").onsubmit = function (e) {
    e.preventDefault();
  
    const camposVacios = validarCampos();
    if (camposVacios.length > 0) {
      alert("Todos los campos deben estar llenos. Te falta: " + camposVacios.join(", "));
      return;
    }
  
    generarContratoPDF();
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






 function getSelectedText(selectElement) {
     return selectElement.options[selectElement.selectedIndex].text;
 }


 async function obtenerFirmaDesdeFirestore(collection, contratoId, campoFirma) {
  try {
      const doc = await db.collection(collection).doc(contratoId).get();
      if (doc.exists) {
          const data = doc.data();
          return data[campoFirma]; // Retorna la firma en formato base64
      } else {
          console.error("No se encontró el documento.");
          return null;
      }
  } catch (error) {
      console.error("Error al obtener la firma:", error);
      return null;
  }
}

 // Función para resetear el formulario
function resetearFormulario() {
    document.getElementById("eventoForm").reset();
    
    // Ocultar la sección de misa y quitar el atributo required
    document.getElementById("misaDetails").style.display = "none";
    document.getElementById("lugarMisa").removeAttribute("required");
    
    // Limpiar las firmas
    const canvasIds = ["firmaClienteCanvas", "firmaEmpresaCanvas", "firmaClienteCanvasClone", "firmaEmpresaCanvasClone", "firmaAsesorCanvas", "firmaAsesorCanvasClone"];
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



  let nombre;
  // Asesor
  firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        
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

  const urlParams = new URLSearchParams(window.location.search);
  const uidAsesor = urlParams.get('uid');

  const boton = document.getElementById('btn-atras');
   boton.addEventListener('click', function(event) { event.preventDefault();
         console.log('El botón ha sido clicado. Redirigiendo a:', `../vista-admin/page-contratos-webview.html?uid=${uidAsesor}`); 
         window.location.href = `../vista-admin/page-contratos-webview.html?uid=${uidAsesor}`;
       });
  

async function generarContratoPDF() {
 
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 10;
  let y = margin;

  function addLightGrayBackground(y, height) {
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, pageWidth - 2 * margin, height, 'F');
  }

  // Logo pequeño en la parte superior
  const logoImg = new Image();
  logoImg.src = 'logo.png';
  await new Promise((resolve) => {
    logoImg.onload = resolve;
  });
  doc.addImage(logoImg, 'PNG', margin, y, 15, 15);
  y += 20;


  
  // Encabezado
  doc.setFillColor(70, 70, 70);
  doc.rect(margin, y, pageWidth - 2 * margin, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("CONTRATO DE SERVICIOS", pageWidth / 2, y + 5, { align: "center" });
  doc.setFontSize(8);
  const folio = generarFolio();
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, margin + 2, y + 11);
  doc.text(`Folio: N° ${folio}`, pageWidth - margin - 30, y + 11);
  y += 19;


  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.text(`Asesor: ${nombre}`, margin, y);
  y += 6;

  // Datos del Cliente
  doc.setFillColor(100, 100, 100);
  doc.rect(margin, y, pageWidth - 2 * margin, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('Datos del Cliente', margin + 2, y + 4);
  y += 10;

  const telefonoIngresado= document.getElementById('celular').value;
  const telefonoConPrefijo = `+52${telefonoIngresado}`;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  const clienteData = [
    ['Nombre:', document.getElementById('nombre').value],
    ['Domicilio:', document.getElementById('domicilio').value],
    ['Ciudad:', document.getElementById('ciudad').value, 'C.P.:', document.getElementById('cp').value],
    ['Teléfono:', document.getElementById('telefono').value, 'Celular:',telefonoIngresado]
  ];

  clienteData.forEach((row, index) => {
    doc.text(row[0], margin, y);
    doc.text(row[1], margin + 20, y);
    if (row[2]) {
      doc.text(row[2], pageWidth / 2, y);
      doc.text(row[3], pageWidth / 2 + 15, y);
    }
    y += 5;
  });
  y += 2;

  // Datos del Evento
  doc.setFillColor(100, 100, 100);
  doc.rect(margin, y,  ((pageWidth - 2 * margin)-3)/2, 6, 'F');
  doc.rect(margin+( ((pageWidth - 2 * margin)-3)/2)+3, y, ((pageWidth - 2 * margin)-3)/2, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('Datos del Evento', margin + 2, y + 4);
  doc.text('Misa', pageWidth / 2 + 4, y + 4);
  y += 10;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  const eventoData = [
    ['Tipo de Evento:', getSelectedText(document.getElementById('tipoEvento'))],
    ['Fecha:', document.getElementById('fecha').value],
    ['Lugar:', getSelectedText(document.getElementById('lugarEvento'))],
    ['Horario:', document.getElementById('horario').value]
  ];

  const misaData = document.getElementById('misaCheck').checked ? [
    ['Lugar:', getSelectedText(document.getElementById('lugarMisa'))],
    ['Horario:', document.getElementById('horarioMisa').value],
    ['Dirección:', document.getElementById('direccionMisa').value],
    ['Hora Civil:', document.getElementById('horaCivil').value]
  ] : [];

  const maxLength = Math.max(eventoData.length, misaData.length);
  for (let i = 0; i < maxLength; i++) {
    if (eventoData[i]) {
      doc.text(`${eventoData[i][0]} ${eventoData[i][1]}`, margin, y);
    }
    if (misaData[i]) {
      doc.text(`${misaData[i][0]} ${misaData[i][1]}`, pageWidth / 2 + 2, y);
    }
    y += 7;
  }
  y += 2;

  // Tabla de Productos/Servicios
  doc.setFillColor(100, 100, 100);
  doc.rect(margin, y, pageWidth - 2 * margin, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('Productos y/o Servicios Contratados', margin + 2, y + 4);
  y += 7;

  const columns = ['Servicios', 'Cant.', 'Descripción', 'Precio'];
  const columnWidths = [35, 15, pageWidth - 90, 30];
  let x = margin;
  
  doc.setFillColor(200, 200, 200);
  doc.rect(margin, y, pageWidth - 2 * margin, 6, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  columns.forEach((col, i) => {
    doc.text(col, x, y + 4);
    x += columnWidths[i];
  });
  y += 7;

  const table = document.getElementById('productosTable').getElementsByTagName('tbody')[0];
  let subtotal = 0;

  Array.from(table.rows).forEach((row, index) => {
    x = margin;
    const cells = row.getElementsByTagName('input');
    
    if (index % 2 === 0) {
      addLightGrayBackground(y - 1, 6);
    }
    
    doc.text(cells[0].value, x + 1, y + 3); // Servicio
    x += columnWidths[0];
    
    doc.text(cells[1].value, x + 1, y + 3); // Cantidad
    x += columnWidths[1];
    
    doc.text(cells[2].value, x + 1, y + 3); // Descripción
    x += columnWidths[2];
    
    const precio = parseFloat(cells[3].value) || 0;
    doc.text(`$${precio.toFixed(2)}`,( x + columnWidths[3] - doc.getTextWidth(`$${precio.toFixed(2)}`))-20, y + 3); // Precio
    subtotal += precio;
    
    y += 6;
  });

  // Totales
  y += 2;
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;
  
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  doc.text(`Sub Total: $${subtotal.toFixed(2)}`, pageWidth - margin - 40, y);
  y += 5;
  doc.text(`IVA: $${iva.toFixed(2)}`, pageWidth - margin - 40, y);
  y += 5;
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text(`TOTAL: $${total.toFixed(2)}`, pageWidth - margin - 40, y);
  doc.setFont(undefined, 'normal');
  y += 7;

  // Términos y condiciones
  doc.setFontSize(6);
  const terms = [
    '* MOVE EVENTOS no se hace responsable de las alteraciones y resultados de proveedores externos',
    '* Para proceder con cualquier servicio se debe cubrir la cantidad de $5,000.00',
    '* El Cliente debe cubrir el 50% del total del contrato ya 30 días posteriores a la firma.',
    '* El Cliente debe quedar liquidado 30 días antes del evento.',
    '* Todo trato verbal o escrito debe quedar plasmado en este documento, MOVE EVENTOS no se hace responsable con términos o peticiones impartidas en redes sociales.',
    '* MOVE EVENTOS se compromete a brindar los servicios contratados en este documento.',
    '* Se debe firmar el reglamento de uso de instalaciones al llegar con el lugar contratado.',
    '* Si debe Firmar el Reglamento interno de MOVE EVENTOS, caso contrario, MOVE EVENTOS no se hará Responsable del evento contratado.'
  ];

  terms.forEach(term => {
    doc.text(term, margin, y);
    y += 4;
  });

  // Firmas
y += 20;

// Líneas de firma
doc.line(margin, y, margin + 60, y); // Línea para la firma del asesor
doc.line(pageWidth - margin - 60, y, pageWidth - margin, y); // Línea para la firma de la empresa
doc.line(pageWidth / 2 - 30, y + 30, pageWidth / 2 + 30, y + 30); // Línea para la firma del cliente

const urlParams = new URLSearchParams(window.location.search);
const contratoId = urlParams.get('id');

// Obtener las firmas desde Firestore
const firmaAsesorData =document.getElementById('firmaAsesorCanvas').toDataURL();


if (
firmaAsesorData === document.createElement('canvas').toDataURL() 
) {
alert("Se requieren todas la firma de el asesor para enviar a revision.");
return;
}

// Añadir las firmas al documento PDF
if (firmaAsesorData !== document.createElement('canvas').toDataURL()) {
doc.addImage(firmaAsesorData, 'PNG', margin, y - 20, 60, 20);
} else {
alert("Se requiere la firma del asesor para generar el PDF.");
return;
}




// Añadir el texto de las firmas debajo de las líneas
y += 5;
doc.setFontSize(8);
doc.text('Firma del Asesor', margin, y);
doc.text('Firma de la Empresa', pageWidth - margin - 60, y);
doc.text('Firma del Cliente', pageWidth / 2, y + 35, { align: 'center' });

  try {
    
    const contratoDoc = await db.collection('contratos').doc(contratoId).get();
    if (!contratoDoc.exists) {
        console.error('No se encontró el contrato');
        return;
    }
    const contratoData = contratoDoc.data();
    
    
  // Generar el PDF como Blob
  const pdfBlob = doc.output('blob');
      
  // Subir el PDF a Firebase Storage
  const storageRef = storage.ref(`contratos/Contrato_MOVE_${contratoData.folio}.pdf`);
  await storageRef.put(pdfBlob);
  
  console.log(contratoId)
  console.log('PDF subido a Firebase Storage');

  // Obtener la URL de descarga del PDF
  const downloadURL = await storageRef.getDownloadURL();
  
    console.log(contratoId)

    await db.collection('contratos').doc(contratoId).set(
      {
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
        misa: document.getElementById('misaCheck').checked
          ? {
              lugar: getSelectedText(document.getElementById('lugarMisa')),
              horario: document.getElementById('horarioMisa').value,
              direccion: document.getElementById('direccionMisa').value,
              horaCivil: document.getElementById('horaCivil').value
            }
          : null,
        servicios: Array.from(
          document.getElementById('productosTable').getElementsByTagName('tbody')[0].rows
        ).map(row => ({
          servicio: row.cells[0].getElementsByTagName('input')[0].value,
          cantidad: row.cells[1].getElementsByTagName('input')[0].value,
          descripcion: row.cells[2].getElementsByTagName('input')[0].value,
          precio: parseFloat(row.cells[3].getElementsByTagName('input')[0].value) || 0
        })),
        estado: "en revision",
        subtotal:subtotal,
        iva: iva,
        firmaAsesor: document.getElementById('firmaAsesorCanvas').toDataURL(),
        total:total,
        pdfUrl: downloadURL
      },
      { merge: true } // <- Esto asegura que no se sobrescriba todo el documento
    );
    
    
    console.log('URL del PDF guardada en Firestore');

    console.log(contratoId)
    console.log({
      cliente: {
          nombre: document.getElementById('nombre').value,
          domicilio: document.getElementById('domicilio').value,
          ciudad: document.getElementById('ciudad').value,
          cp: document.getElementById('cp').value,
          telefono: document.getElementById('telefono').value,
          celular: telefonoIngresado
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
      subtotal,
      iva,
      total,
      pdfUrl: downloadURL
  });
  
 
  } catch (error) {
    console.error('Error al guardar el contrato en Firebase:', error.message || error);
  }
  



  // Resetear el formulario después de generar el contrato
  resetearFormulario();

  // Mostrar un mensaje de éxito
  alert("El contrato se ha enviado a revision nuevamente");
  setTimeout(() => {
    window.location.href=`/vista-admin/page-contratos.html${uidAsesor}`;
  }, 1000);
}



