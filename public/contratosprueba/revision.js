// Configuración de Firebase
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

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const contratoId = urlParams.get('id');

    if (contratoId) {
        cargarContrato(contratoId);
    } else {
        alert('No se proporcionó ID de contrato');
    }

    document.getElementById('aprobarBtn').addEventListener('click', () => aprobarContrato(contratoId));
    document.getElementById('rechazarBtn').addEventListener('click', () => rechazarContrato(contratoId));

   
});

async function cargarContrato(contratoId) {
    const doc = await db.collection('contratos').doc(contratoId).get();
    if (doc.exists) {
        const data = doc.data();
        mostrarPDFEnViewer(data.pdfUrl);
    } else {
        alert('No se encontró el contrato');
    }
}

function mostrarPDFEnViewer(pdfUrl) {
    const viewer = document.getElementById('pdfViewer');
    viewer.innerHTML = `<iframe src="${pdfUrl}" width="100%" height="600px"></iframe>`;
}

async function aprobarContrato(contratoId) {
  const firmaModal = document.getElementById('firmaEmpresaModal');
  firmaModal.style.display = 'block';

  document.getElementById('guardarFirmaAsesor').onclick = async () => {
      await generarContratoPDF();

      
      // Cerrar la ventana después de un pequeño retraso para que el usuario vea el mensaje
      setTimeout(() => {
        window.location.href="/vista-admin/page-contratos-admin.html";
      }, 3000); // 1000 ms = 1 segundo
  };
}

async function rechazarContrato(contratoId) {
  const razon = prompt('Por favor, ingrese la razón del rechazo:');
  if (razon) {
      await db.collection('contratos').doc(contratoId).update({
          estado: 'rechazado',
          razonRechazo: razon,
          fechaRechazo: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert('Contrato rechazado');

      // Cerrar la ventana después de un pequeño retraso para que el usuario vea el mensaje
      setTimeout(() => {
          window.location.href="/vista-admin/page-contratos-admin.html";
      }, 1000); // 1000 ms = 1 segundo
  }
}


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
  
  
    setupModal("firmaEmpresaModal", "aprobarBtn", "firmaAsesorCanvas", "guardarFirmaAsesor", "firmaAsesorCanvasClone");
  

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
      
        const urlParams = new URLSearchParams(window.location.search);
        const contratoId = urlParams.get('id');
        
        // Fetch contract data from Firestore
        const contratoDoc = await db.collection('contratos').doc(contratoId).get();
        if (!contratoDoc.exists) {
            console.error('No se encontró el contrato');
            return;
        }
        const contratoData = contratoDoc.data();
      
        let asesor;
        let nombre;
        // Asesor
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                asesor = contratoData.asesor; // Asegúrate de usar `uid`, no `id`
                
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
        doc.text(`Fecha: ${new Date(contratoData.fecha).toLocaleDateString()}`, margin + 2, y + 11);
        doc.text(`Folio: N° ${contratoData.folio}`, pageWidth - margin - 30, y + 11);
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
      
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        const clienteData = [
          ['Nombre:', contratoData.cliente.nombre],
          ['Domicilio:', contratoData.cliente.domicilio],
          ['Ciudad:', contratoData.cliente.ciudad, 'C.P.:', contratoData.cliente.cp],
          ['Teléfono:', contratoData.cliente.telefono, 'Celular:', contratoData.cliente.celular]
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
          ['Tipo de Evento:', contratoData.evento.tipo],
          ['Fecha:', contratoData.evento.fecha],
          ['Lugar:', contratoData.evento.lugar],
          ['Horario:', contratoData.evento.horario]
        ];
      
        const misaData = contratoData.misa ? [
          ['Lugar:', contratoData.misa.lugar],
          ['Horario:', contratoData.misa.horario],
          ['Dirección:', contratoData.misa.direccion],
          ['Hora Civil:', contratoData.misa.horaCivil]
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
      
        contratoData.servicios.forEach((servicio, index) => {
          x = margin;
          
          if (index % 2 === 0) {
            addLightGrayBackground(y - 1, 6);
          }
          
          doc.text(servicio.servicio, x + 1, y + 3);
          x += columnWidths[0];
          
          doc.text(servicio.cantidad.toString(), x + 1, y + 3);
          x += columnWidths[1];
          
          doc.text(servicio.descripcion, x + 1, y + 3);
          x += columnWidths[2];
          
          doc.text(`$${servicio.precio.toFixed(2)}`, (x + columnWidths[3] - doc.getTextWidth(`$${servicio.precio.toFixed(2)}`))-20, y + 3);
          
          y += 6;
        });
      
        // Totales
        y += 2;
        doc.line(margin, y, pageWidth - margin, y);
        y += 4;
        
        doc.text(`Sub Total: $${contratoData.subtotal.toFixed(2)}`, pageWidth - margin - 40, y);
        y += 5;
        doc.text(`IVA: $${contratoData.iva.toFixed(2)}`, pageWidth - margin - 40, y);
        y += 5;
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text(`TOTAL: $${contratoData.total.toFixed(2)}`, pageWidth - margin - 40, y);
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
    
        const firmaAsesorData = contratoData.firmaAsesor;
        
        const firmaEmpresaCanvas = document.getElementById('firmaAsesorCanvas');
        
        if (firmaEmpresaCanvas.toDataURL() === document.createElement('canvas').toDataURL() ||
            !firmaAsesorData) {
          alert("Se requieren todas la firma de el asesor para generar el PDF.");
          return;
        }
        
        // Añadir las firmas al documento PDF
        if (firmaAsesorData) {
          doc.addImage(firmaAsesorData, 'PNG', margin, y - 20, 60, 20);
        } else {
          alert("Se requiere la firma del asesor para generar el PDF.");
          return;
        }
        
        if (firmaEmpresaCanvas.toDataURL() !== document.createElement('canvas').toDataURL()) {
          const firmaEmpresaData = firmaEmpresaCanvas.toDataURL('image/png');
          doc.addImage(firmaEmpresaData, 'PNG', pageWidth - margin - 60, y - 20, 60, 20);
        } else {
          alert("Se requiere la firma de la empresa para generar el PDF.");
          return;
        }
        
        // Añadir el texto de las firmas debajo de las líneas
        y += 5;
        doc.setFontSize(8);
        doc.text('Firma del Asesor', margin, y);
        doc.text('Firma de la Empresa', pageWidth - margin - 60, y);
        doc.text('Firma del Cliente', pageWidth / 2, y + 35, { align: 'center' });
        
        try {
          // Generar el PDF como Blob
          const pdfBlob = doc.output('blob');
      
          // Subir el PDF a Firebase Storage
          const storageRef = storage.ref(`contratos/Contrato_MOVE_${contratoData.folio}.pdf`);
          await storageRef.put(pdfBlob);
          console.log('PDF subido a Firebase Storage');
      
          // Obtener la URL de descarga del PDF
          const downloadURL = await storageRef.getDownloadURL();
          
          // Actualizar el documento en Firestore con la URL del PDF
          await db.collection('contratos').doc(contratoId).update({ 
            pdfUrl: downloadURL,
            firmaEmpresa: firmaEmpresaCanvas.toDataURL()
          });
          console.log('URL del PDF guardada en Firestore');
    
          
          const firmaJefe = document.getElementById('firmaAsesorCanvas').toDataURL();
          await db.collection('contratos').doc(contratoId).update({
              estado: 'aprobado',
              firmaEmpresa: firmaJefe,
              fechaAprobacion: firebase.firestore.FieldValue.serverTimestamp()
             
          });




          // Mostrar un mensaje de éxito
          alert('Contrato aprobado y firmado');

        } catch (error) {
          console.error('Error al guardar el contrato en Firebase:', error);
          alert("Error al generar el contrato. Por favor, intente de nuevo.");
        }
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