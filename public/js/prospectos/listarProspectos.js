let isLoading = false;
let attachmentSuccess = false;
let archivoAdjunto = null;
let pasoActual = 0; // Cambia este valor dependiendo del paso en el que estés


// Define formatearFecha in the global scope
let pasosCompletados = new Set();
function formatearFecha(fecha) {
  if (fecha instanceof firebase.firestore.Timestamp) {
    const date = fecha.toDate();
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  } else if (typeof fecha === "string" || typeof fecha === "number") {
    const date = new Date(fecha);
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  }
  return "Fecha no disponible";
}


// Función para mostrar alertas
function mostrarAlerta(mensaje, tipo = 'info') {
  // Si estás usando Bootstrap
  const alertPlaceholder = document.getElementById('alertPlaceholder') || document.body;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
      ${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
  alertPlaceholder.appendChild(wrapper);

  // Remover la alerta después de 3 segundos
  setTimeout(() => {
    wrapper.remove();
  }, 3000);
}


async function mostrarModalPaquetes(telefonoProspecto) {
  const modalHTML = `
      <div class="modal fade" id="paquetesModal" tabindex="-1">
          <div class="modal-dialog modal-lg modal-dialog-scrollable">
              <div class="modal-content">
                  <div class="modal-header">
                      <h5 class="modal-title">Catálogo de Publicaciones</h5>
                      <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                  </div>
                  <div class="modal-body">
                      <div class="publicaciones-grid" id="paquetesContainer">
                          <!-- Aquí se cargarán las publicaciones dinámicamente -->
                      </div>
                  </div>
              </div>
          </div>
      </div>
  `;

  // Eliminar modal anterior si existe
  const modalAnterior = document.getElementById('paquetesModal');
  if (modalAnterior) {
      modalAnterior.remove();
  }

  // Agregar el modal al DOM
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Agregar estilos
  addStyles();

  try {
      // Mostrar loading
      const paquetesContainer = document.getElementById('paquetesContainer');
      paquetesContainer.innerHTML = `
          <div class="loading-container">
              <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Cargando...</span>
              </div>
          </div>
      `;

      // Obtener las publicaciones
      const querySnapshot = await db.collection("publicaciones2").get();

      if (querySnapshot.empty) {
          paquetesContainer.innerHTML = `
              <div class="no-results">
                  <i class="fas fa-inbox fa-2x"></i>
                  <p>No hay publicaciones disponibles</p>
              </div>
          `;
      } else {
          paquetesContainer.innerHTML = '';
          querySnapshot.forEach(doc => {
              const publicacion = doc.data();
              const card = createPublicacionCard(publicacion, doc.id, telefonoProspecto);
              paquetesContainer.appendChild(card);
          });
      }

      // Mostrar modal
      const modal = new bootstrap.Modal(document.getElementById('paquetesModal'));
      modal.show();

  } catch (error) {
      console.error("Error al cargar las publicaciones:", error);
      Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las publicaciones'
      });
  }
}

function createPublicacionCard(publicacion, publicacionId, telefonoProspecto) {
  const card = document.createElement('div');
  card.className = 'publicacion-card';
  
  card.innerHTML = `
      <div class="card-image">
          <img src="${publicacion.imagen_destacada || 'ruta/imagen-default.jpg'}" 
               alt="${publicacion.titulo || 'Sin título'}"
               onerror="this.src='ruta/imagen-default.jpg'">
      </div>
      <div class="card-content">
          <h3 class="card-title">${publicacion.titulo || 'Sin título'}</h3>
          <div class="card-details">
              <span class="category">
                  <i class="fas fa-tag"></i> ${publicacion.categoria || 'Sin categoría'}
              </span>
              <span class="location">
                  <i class="fas fa-map-marker-alt"></i> ${publicacion.lugar || 'Sin ubicación'}
              </span>
          </div>
          <button class="share-button" onclick="enviarPaqueteWhatsApp('${publicacionId}', '${telefonoProspecto}')">
              <i class="fab fa-whatsapp"></i> Compartir
          </button>
      </div>
  `;

  return card;
}

function addStyles() {
  const styles = `
      .publicaciones-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          padding: 1.5rem;
      }

      .publicacion-card {
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: transform 0.2s, box-shadow 0.2s;
      }

      .publicacion-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      }

      .card-image {
          position: relative;
          padding-top: 66.67%;
          overflow: hidden;
      }

      .card-image img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
      }

      .publicacion-card:hover .card-image img {
          transform: scale(1.05);
      }

      .card-content {
          padding: 1.25rem;
      }

      .card-title {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.75rem 0;
          color: #2c3e50;
          line-height: 1.4;
      }

      .card-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
      }

      .card-details span {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #64748b;
      }

      .share-button {
          width: 100%;
          padding: 0.75rem;
          border: none;
          border-radius: 6px;
          background: #25D366;
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: background-color 0.2s;
      }

      .share-button:hover {
          background: #128C7E;
      }

      .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 200px;
      }

      .no-results {
          text-align: center;
          padding: 2rem;
          color: #64748b;
      }
  `;

  if (!document.getElementById('publicaciones-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'publicaciones-styles';
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
  }
}

async function enviarPaqueteWhatsApp(publicacionId, telefonoProspecto) {
  try {
      const aseName = localStorage.getItem('userName');
      const telefono = telefonoProspecto.replace('+', '');
      
      const message = encodeURIComponent(
          `Hola, tu asesor: ${aseName}, te está invitando a que conozcas más información de esta publicación: https://jassocompany.com/publicaciones/casaAntiguaAteaga.html?id=${publicacionId}&tipo=cliente`
      );
      
      window.open(`https://api.whatsapp.com/send?phone=${telefono}&text=${message}`, '_blank');
      
      const modal = bootstrap.Modal.getInstance(document.getElementById('paquetesModal'));
      modal.hide();
      
      Swal.fire({
          icon: 'success',
          title: 'Compartido',
          text: 'La publicación se compartirá por WhatsApp',
          timer: 2000,
          showConfirmButton: false
      });
      
  } catch (error) {
      console.error("Error al compartir:", error);
      Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo compartir la publicación'
      });
  }
}



function calcularPasoInicial(seguimientoData) {
  // Check each step in order
  if (!seguimientoData.paso1_CrearProspecto) return 1;
  if (
    !seguimientoData.paso2_llamarInformacion &&
    !seguimientoData.paso2_adjuntarEvidenciaURL?.length
  )
    return 2;
  if (!seguimientoData.paso3_agendarCita) return 3;
  if (
    !seguimientoData.paso4_llamarConfirmarCita &&
    !seguimientoData.paso4_adjuntarEvidenciaURL?.length
  )
    return 4;
  if (
    !seguimientoData.paso5_adjuntarCotizacionURL?.length &&
    !seguimientoData.paso5_idsPublicaciones?.length &&
    !seguimientoData.paso5_descripcion
  )
    return 5;
  if (!seguimientoData.paso6_fechaCitaAtendida) return 6;
  if (
    !seguimientoData.paso7_adjuntarRecibosAnticipoURL?.length ||
    !seguimientoData.paso7_revision
  )
    return 7;
  if (!seguimientoData.paso8_agendarCitaParaFirmar) return 8;
  if (!seguimientoData.paso9_confirmacionCita) return 9;
  if (
    !seguimientoData.paso10_firmaContratoEvidendiasURL?.length ||
    !seguimientoData.paso10_revision
  )
    return 10;
  if (!seguimientoData.paso11_agendarCitaParaEntregaPorcentaje) return 11;
  if (
    !seguimientoData.paso12_atencionCitaEvidenciaRecibosURL?.length &&
    !seguimientoData.paso12_revision
  )
    return 12;
  if (!seguimientoData.paso13_asignacionUsuario) return 13;

  // If all steps are completed, return the last step
  return 13;
}

let tempStep5Data = {
  file: null,
  description: "",
};



// Función auxiliar para obtener las opciones de lugares
async function obtenerLugaresOptions() {
  const lugaresSnapshot = await db.collection("lugares").get();
  return lugaresSnapshot.docs
    .map((doc) => {
      const data = doc.data();
      return `<option value="${data.nombreLugar}">${data.nombreLugar}</option>`;
    })
    .join("");
}

function updateProgress(progress, text, subtext = '') {
    Swal.update({
      title: 'Generando credenciales',
      html: `
        <div class="progress-container">
          <div class="progress-status">
            <div class="progress-text">${text}</div>
            ${subtext ? `<div class="progress-subtext">${subtext}</div>` : ''}
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="progress-percentage">${progress}%</div>
          </div>
        </div>
      `
    });
  }


async function guardarConfirmacionCita() {
  const mensajeWhatsApp = document
    .getElementById("mensajeWhatsApp")
    .value.trim();

  if (!mensajeWhatsApp) {
    Swal.fire({
      icon: "warning",
      title: "Campo requerido",
      text: "Por favor, ingrese el mensaje que envió por WhatsApp.",
      confirmButtonText: "Entendido",
    });
    return;
  }

  try {
    // Mostrar loading
    Swal.fire({
      title: "Guardando confirmación",
      html: `
                <div class="confirmation-progress">
                    <div class="confirmation-icon">
                        <i class="fab fa-whatsapp"></i>
                    </div>
                    <div class="confirmation-text">
                        Registrando confirmación de cita...
                    </div>
                </div>
            `,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Guardar en Firestore
    await db.collection("seguimientoProspectos2").doc(prospectoActualId).update({
      paso9_confirmacionCita: mensajeWhatsApp,
    });

    // Actualizar porcentaje
    const porcentaje = calcularPorcentaje(9);
    await db.collection("prospectos2").doc(prospectoActualId).update({
      porcentaje: porcentaje,
    });

    // Mostrar mensaje de éxito
    await Swal.fire({
      icon: "success",
      title: "¡Confirmación guardada!",
      html: `
                <div class="success-confirmation">
                    <div class="success-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="message-preview">
                        <p class="preview-label">Mensaje registrado:</p>
                        <div class="message-content">
                            ${mensajeWhatsApp}
                        </div>
                    </div>
                </div>
            `,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });

    mostrarPasoSeguimiento(9);
  } catch (error) {
    console.error("Error al guardar la confirmación:", error);

    Swal.fire({
      icon: "error",
      title: "Error al guardar",
      text: "Hubo un problema al guardar la confirmación: " + error.message,
      confirmButtonText: "Entendido",
    });
  }
}

let modalAnteriorAbierto;

function abrirModalMasInformacion() {
  modalAnteriorAbierto = bootstrap.Modal.getInstance(
    document.getElementById("seguimientoModal")
  );
  modalAnteriorAbierto.hide();

  const modalMasInformacion = new bootstrap.Modal(
    document.getElementById("modalMasInformacion"),
    {
      backdrop: "static",
      keyboard: false,
    }
  );
  modalMasInformacion.show();

  cargarArchivosAdjuntos();
}

function cerrarModalMasInformacion() {
  const modalMasInformacion = bootstrap.Modal.getInstance(
    document.getElementById("modalMasInformacion")
  );
  modalMasInformacion.hide();

  if (modalAnteriorAbierto) {
    modalAnteriorAbierto.show();
  }
}

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js";

async function cargarArchivosAdjuntos() {
  try {
    const seguimientoDoc = await db
      .collection("seguimientoProspectos2")
      .doc(prospectoActualId)
      .get();

    if (!seguimientoDoc.exists) {
      mostrarMensajeVacio("No hay archivos adjuntos disponibles.");
      return;
    }

    const seguimientoData = seguimientoDoc.data();
    let archivos = obtenerArchivosPorPaso(seguimientoData, pasoActual);
    archivos = archivos.filter((url) => url);

    if (archivos.length === 0) {
      mostrarMensajeVacio("No hay archivos adjuntos para este paso.");
      return;
    }

    const thumbnailsHTML = await Promise.all(
      archivos.map(async (archivoURL, index) => {
        try {
          // Obtener la URL de descarga real de Firebase Storage
          const storageRef = firebase.storage().refFromURL(archivoURL);
          const url = await storageRef.getDownloadURL();
          const nombreArchivo = storageRef.name; // Obtener el nombre del archivo
          const extension = nombreArchivo.split(".").pop().toLowerCase();

          return generarThumbnail(url, extension, index);
        } catch (error) {
          console.error(`Error al procesar archivo ${index + 1}:`, error);
          return "";
        }
      })
    );

    mostrarGaleriaArchivos(thumbnailsHTML);
  } catch (error) {
    console.error("Error al cargar archivos:", error);
    mostrarError();
  }
}

function generarThumbnail(url, extension, index) {
  const esImagen = ["jpg", "jpeg", "png", "gif"].includes(extension);
  const esPDF = extension === "pdf";

  let contenidoThumbnail;
  if (esImagen) {
    contenidoThumbnail = `
            <div class="image-preview">
                <img src="${url}" alt="Archivo ${
      index + 1
    }" class="thumbnail-image">
            </div>`;
  } else if (esPDF) {
    contenidoThumbnail = `
            <div class="pdf-preview">
                <i class="fas fa-file-pdf"></i>
                <span>PDF</span>
            </div>`;
  } else {
    contenidoThumbnail = `
            <div class="file-preview">
                <i class="fas fa-file"></i>
                <span>${extension.toUpperCase()}</span>
            </div>`;
  }

  return `
        <div class="thumbnail-wrapper">
            <a href="${url}" target="_blank" class="thumbnail-link" data-type="${extension}">
                <div class="thumbnail-image-container ${
                  !esImagen ? "file-container" : ""
                }">
                    ${contenidoThumbnail}
                </div>
                <div class="thumbnail-info">
                    <span class="thumbnail-name">Archivo ${index + 1}</span>
                    <span class="thumbnail-type">${extension.toUpperCase()}</span>
                </div>
            </a>
        </div>
    `;
}

// Actualiza los estilos CSS
const styles = `
.thumbnails-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 15px;
    padding: 15px;
}

.thumbnail-wrapper {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s ease;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.thumbnail-wrapper:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.thumbnail-link {
    text-decoration: none;
    color: inherit;
}

.thumbnail-image-container {
    width: 100%;
    aspect-ratio: 1;
    position: relative;
    background: #f8fafc;
}

.image-preview {
    width: 100%;
    height: 100%;
}

.thumbnail-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.pdf-preview, .file-preview {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #f8fafc;
    color: #64748b;
    gap: 8px;
}

.pdf-preview i {
    font-size: 24px;
    color: #ef4444;
}

.file-preview i {
    font-size: 24px;
    color: #64748b;
}

.thumbnail-info {
    padding: 8px;
    background: white;
    border-top: 1px solid #e2e8f0;
}

.thumbnail-name {
    display: block;
    font-size: 0.75rem;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.thumbnail-type {
    display: block;
    font-size: 0.7rem;
    color: #64748b;
    margin-top: 2px;
}

.empty-state {
    text-align: center;
    padding: 30px;
    color: #64748b;
}

.empty-state i {
    font-size: 32px;
    margin-bottom: 10px;
}

@media (max-width: 768px) {
    .thumbnails-container {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 10px;
        padding: 10px;
    }
}
`;

// Agregar los estilos
if (!document.getElementById("thumbnails-styles")) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "thumbnails-styles";
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
// Funciones auxiliares
function obtenerArchivosPorPaso(seguimientoData, paso) {
  const mapaPasos = {
    12: "paso12_atencionCitaEvidenciaRecibosURL",
    10: "paso10_firmaContratoEvidendiasURL",
    7: "paso7_adjuntarRecibosAnticipoURL",
    5: "paso5_adjuntarCotizacionURL",
    4: "paso4_adjuntarEvidenciaURL",
    2: "paso2_adjuntarEvidenciaURL",
  };

  const campo = mapaPasos[paso];
  return campo
    ? Array.isArray(seguimientoData[campo])
      ? seguimientoData[campo]
      : [seguimientoData[campo]]
    : [];
}

function obtenerExtension(url) {
  return url.split(".").pop().toLowerCase();
}

async function obtenerURLDescarga(archivoURL) {
  const storageRef = firebase.storage().refFromURL(archivoURL);
  return await storageRef.getDownloadURL();
}

function mostrarGaleriaArchivos(thumbnails) {
  document.getElementById("archivosAdjuntos").innerHTML = `
        <div class="thumbnails-container">
            ${thumbnails.join("")}
        </div>
    `;
}

function mostrarMensajeVacio(mensaje) {
  document.getElementById("archivosAdjuntos").innerHTML = `
        <div class="empty-state">
            <i class="fas fa-folder-open"></i>
            <p>${mensaje}</p>
        </div>
    `;
}

function mostrarError() {
  document.getElementById("archivosAdjuntos").innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-circle"></i>
            <p>Error al cargar los archivos adjuntos.</p>
        </div>
    `;
}



// Función para adjuntar archivo
// Función para comprimir imagen
async function comprimirImagen(file) {
  const options = {
    maxSizeMB: 1, // Tamaño máximo de 1MB
    maxWidthOrHeight: 1920, // Máximo 1920px de ancho o alto
    useWebWorker: true,
    fileType: file.type,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error("Error al comprimir imagen:", error);
    throw error;
  }
}

// Función para procesar archivo según su tipo
async function procesarArchivo(file) {
  const tiposImagen = ["image/jpeg", "image/png", "image/jpg"];

  if (tiposImagen.includes(file.type)) {
    // Comprimir imagen
    return await comprimirImagen(file);
  } else if (file.type === "application/pdf") {
    // Si el PDF es mayor a 2MB, mostrar advertencia
    if (file.size > 2 * 1024 * 1024) {
      await Swal.fire({
        icon: "warning",
        title: "Archivo PDF grande",
        text: "El PDF supera los 2MB. Considera comprimirlo antes de subirlo.",
        showCancelButton: true,
        confirmButtonText: "Subir de todos modos",
        cancelButtonText: "Cancelar",
      });
    }
    return file;
  } else {
    return file;
  }
}

async function adjuntarArchivo(paso) {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.accept = ".jpg,.jpeg,.png,.pdf";
  const button = document.querySelector(`button[data-paso="${paso}"]`);

  input.onchange = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length > 0) {
      try {
        // Validar tamaño total
        const totalSize = files.reduce((acc, file) => acc + file.size, 0);
        const maxSize = 25 * 1024 * 1024; // 25MB

        if (totalSize > maxSize) {
          throw new Error(
            `El tamaño total de los archivos excede el límite de ${(
              maxSize /
              1024 /
              1024
            ).toFixed(0)}MB`
          );
        }

        // Mostrar loading inicial
        Swal.fire({
          title: "Preparando archivos",
          html: `
                        <div class="upload-progress">
                            <div class="upload-progress-text">Procesando ${
                              files.length
                            } archivo(s)...</div>
                            <div class="upload-files-preview">
                                ${files
                                  .map(
                                    (file) => `
                                    <div class="file-item">
                                        <i class="fas ${
                                          file.type.includes("pdf")
                                            ? "fa-file-pdf"
                                            : "fa-file-image"
                                        }"></i>
                                        <span>${file.name}</span>
                                    </div>
                                `
                                  )
                                  .join("")}
                            </div>
                        </div>
                    `,
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        // Procesar archivos
        const processedFiles = await Promise.all(
          files.map(async (file) => {
            try {
              return await procesarArchivo(file);
            } catch (error) {
              throw new Error(
                `Error al procesar ${file.name}: ${error.message}`
              );
            }
          })
        );

        // Iniciar carga
        let totalProgress = 0;
        const uploadPromises = processedFiles.map(async (file, index) => {
          const timestamp = Date.now();
          const fileName = `${timestamp}_${files[index].name}`;
          const storageRef = firebase
            .storage()
            .ref(`prospectos/${prospectoActualId}/paso${paso}/${fileName}`);

          const uploadTask = storageRef.put(file);

          // Mostrar progreso
          uploadTask.on("state_changed", (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            totalProgress = (index * 100 + progress) / files.length;

            Swal.update({
              title: "Subiendo archivos",
              html: `
                                    <div class="upload-progress">
                                        <div class="upload-progress-text">
                                            Subiendo archivo ${index + 1} de ${
                files.length
              }
                                        </div>
                                        <div class="progress-bar">
                                            <div class="progress" style="width: ${totalProgress}%"></div>
                                        </div>
                                        <div class="progress-text">${Math.round(
                                          totalProgress
                                        )}%</div>
                                    </div>
                                `,
            });
          });

          await uploadTask;
          return storageRef.getDownloadURL();
        });

        const downloadURLs = await Promise.all(uploadPromises);

        // Actualizar Firestore
        const updateData = {
          [`paso${paso}_${
            paso === 10
              ? "firmaContratoEvidendiasURL"
              : paso === 12
              ? "atencionCitaEvidenciaRecibosURL"
              : "adjuntarEvidenciaURL"
          }`]: firebase.firestore.FieldValue.arrayUnion(...downloadURLs),
        };

        await db
          .collection("seguimientoProspectos2")
          .doc(prospectoActualId)
          .update(updateData);

        // Actualizar porcentaje
        const porcentaje = calcularPorcentaje(paso);
        await db.collection("prospectos2").doc(prospectoActualId).update({
          porcentaje: porcentaje,
        });


        if ([7, 10, 12].includes(paso)) {
            // Mensaje especial para pasos que requieren revisión
            await Swal.fire({
                icon: 'info',
                title: 'Enviado a revisión',
                html: `
                    <div class="review-status">
                        <div class="review-icon">
                            <i class="fas fa-clock-rotate-left"></i>
                        </div>
                        <div class="review-message">
                            <p>La información ha sido enviada para revisión.</p>
                            <div class="review-steps">
                                <div class="step-item">
                                    <i class="fas fa-paper-plane"></i>
                                    <span>Información enviada</span>
                                </div>
                                <div class="step-item current">
                                    <i class="fas fa-magnifying-glass"></i>
                                    <span>En revisión</span>
                                </div>
                                <div class="step-item">
                                    <i class="fas fa-check-circle"></i>
                                    <span>Pendiente de aprobación</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                showConfirmButton: true,
                confirmButtonText: 'Entendido',
                allowOutsideClick: false,
                customClass: {
                    popup: 'review-popup'
                }
            });}else{
        // Mostrar éxito
        Swal.fire({
          icon: "success",
          title: "¡Archivos subidos!",
          html: `
                        <div class="success-message">
                            <div class="success-icon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="success-text">
                                Se subieron ${
                                  files.length
                                } archivo(s) correctamente
                            </div>
                            <div class="files-summary">
                                ${files
                                  .map(
                                    (file) => `
                                    <div class="file-item success">
                                        <i class="fas ${
                                          file.type.includes("pdf")
                                            ? "fa-file-pdf"
                                            : "fa-file-image"
                                        }"></i>
                                        <span>${file.name}</span>
                                    </div>
                                `
                                  )
                                  .join("")}
                            </div>
                        </div>
                    `,
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
            }

        mostrarPasoSeguimiento(paso);
      } catch (error) {
        console.error("Error:", error);
        Swal.fire({
          icon: "error",
          title: "Error al subir archivos",
          html: `
                        <div class="error-message">
                            <div class="error-icon">
                                <i class="fas fa-exclamation-circle"></i>
                            </div>
                            <div class="error-text">
                                ${error.message}
                            </div>
                        </div>
                    `,
          confirmButtonText: "Entender",
        });
      } finally {
        button.innerHTML = '<i class="fas fa-paperclip me-2"></i>Adjuntar';
        button.disabled = false;
      }
    }
  };
  input.click();
}

// En la función donde muestras el mensaje de éxito (por ejemplo, después de guardar)
async function showSuccessMessage(paso) {
    if ([7, 10, 12].includes(paso)) {
        // Mensaje especial para pasos que requieren revisión
        await Swal.fire({
            icon: 'info',
            title: 'Enviado a revisión',
            html: `
                <div class="review-status">
                    <div class="review-icon">
                        <i class="fas fa-clock-rotate-left"></i>
                    </div>
                    <div class="review-message">
                        <p>La información ha sido enviada para revisión.</p>
                        <div class="review-steps">
                            <div class="step-item">
                                <i class="fas fa-paper-plane"></i>
                                <span>Información enviada</span>
                            </div>
                            <div class="step-item current">
                                <i class="fas fa-magnifying-glass"></i>
                                <span>En revisión</span>
                            </div>
                            <div class="step-item">
                                <i class="fas fa-check-circle"></i>
                                <span>Pendiente de aprobación</span>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            showConfirmButton: true,
            confirmButtonText: 'Entendido',
            allowOutsideClick: false,
            customClass: {
                popup: 'review-popup'
            }
        });
    } else {
        // Mensaje normal para otros pasos
        await Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'La información se guardó correctamente',
            showConfirmButton: false,
            timer: 2000
        });
    }

    window.location.reload();
}


function calcularPorcentaje(paso) {
  return Math.round(paso * 7.69); // Redondear el porcentaje
}

// Función para agendar cita
let fechaCitaSeleccionada = null;

async function agendarCita(paso) {
  // Configuración de Google Calendar API
  const CLIENT_ID = '851107842246-t571mmtul4jvch7sh6duc5l9pte0vh4s.apps.googleusercontent.com';
  const API_KEY = 'AIzaSyBmSEe24W6jAvPwsqNKrGka2e5kCBRg5bE';
  const SCOPES = 'https://www.googleapis.com/auth/calendar';

  // Función para verificar el estado de autenticación
  const checkGoogleAuth = () => {
    return new Promise((resolve) => {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.error) {
            resolve(false);
          } else {
            localStorage.setItem('googleAccessToken', response.access_token);
            resolve(true);
          }
        },
      });

      // Verificar si hay un token guardado
      const savedToken = localStorage.getItem('googleAccessToken');
      if (savedToken) {
        // Verificar si el token es válido
        fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${savedToken}`)
          .then(response => {
            if (response.ok) {
              resolve(true);
            } else {
              tokenClient.requestAccessToken({ prompt: 'consent' });
            }
          })
          .catch(() => {
            tokenClient.requestAccessToken({ prompt: 'consent' });
          });
      } else {
        tokenClient.requestAccessToken({ prompt: 'consent' });
      }
    });
  };

  try {
    // Mostrar loading mientras se verifica la autenticación
    Swal.fire({
      title: 'Verificando acceso',
      html: `
        <div class="auth-progress">
          <div class="auth-icon">
            <i class="fab fa-google fa-spin"></i>
          </div>
          <div class="auth-text">
            Verificando acceso a Google Calendar...
          </div>
        </div>
      `,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Verificar autenticación
    const isAuthenticated = await checkGoogleAuth();
    
    // Cerrar el loading
    Swal.close();

    if (!isAuthenticated) {
      Swal.fire({
        icon: 'error',
        title: 'Acceso denegado',
        text: 'Necesitas iniciar sesión con Google para agendar citas.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Si está autenticado, mostrar el modal del formulario
    const modal = new bootstrap.Modal(document.getElementById('calendarModal'));
    modal.show();

    
    document.getElementById("guardarCita").onclick = async function () {
      // Obtener el token de acceso
      const accessToken = localStorage.getItem('googleAccessToken');
      if (!accessToken) {
          Swal.fire({
              icon: 'error',
              title: 'Error de autenticación',
              text: 'No se encontró el token de acceso. Por favor, inicie sesión nuevamente.',
              confirmButtonText: 'Entendido'
          });
          return;
      }
  
      const formData = {
          titulo: document.getElementById('titulo').value,
          descripcion: document.getElementById('descripcion').value,
          lugarCita: document.getElementById('lugarCita').value,
          nombreCliente: document.getElementById('nombreCliente').value,
          categoria: document.getElementById('categoria').value,
          fecha: document.getElementById('fecha').value,
          hora: document.getElementById('hora').value
      };
  
      // Validar campos requeridos
      if (!formData.titulo || !formData.lugarCita || !formData.nombreCliente || 
          !formData.categoria || !formData.fecha || !formData.hora) {
          Swal.fire({
              icon: "warning",
              title: "Campos requeridos",
              text: "Por favor, complete todos los campos requeridos.",
              confirmButtonText: "Entendido",
          });
          return;
      }
  
      try {
          // Verificar si el token sigue siendo válido
          const tokenCheck = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
          
          if (!tokenCheck.ok) {
              // Si el token no es válido, solicitar uno nuevo
              const tokenClient = google.accounts.oauth2.initTokenClient({
                  client_id: CLIENT_ID,
                  scope: SCOPES,
                  callback: async (response) => {
                      if (response.error) {
                          throw new Error('Error al renovar el token de acceso');
                      }
                      localStorage.setItem('googleAccessToken', response.access_token);
                      // Reintentar la operación con el nuevo token
                      await createCalendarEvent(response.access_token);
                  }
              });
              tokenClient.requestAccessToken({ prompt: 'consent' });
              return;
          }
  
          // Si el token es válido, continuar con la creación del evento
          await createCalendarEvent(accessToken);
  
      } catch (error) {
          console.error("Error al agendar cita:", error);
          Swal.fire({
              icon: "error",
              title: "Error al agendar la cita",
              text: error.message,
              confirmButtonText: "Entendido",
          });
      }
  
      // Función para crear el evento en el calendario
      async function createCalendarEvent(token) {
          // Mostrar loading...
          Swal.fire({
              title: "Agendando cita",
              html: `
                  <div class="scheduling-progress">
                      <div class="scheduling-icon">
                          <i class="fas fa-calendar-check"></i>
                      </div>
                      <div class="scheduling-text">
                          Guardando información de la cita...
                      </div>
                  </div>
              `,
              allowOutsideClick: false,
              showConfirmButton: false,
              didOpen: () => {
                  Swal.showLoading();
              },
          });
  
          // Crear evento en Google Calendar
          const event = {
            summary: formData.titulo,
            description: buildEventDescription(
                formData.descripcion,
                formData.nombreCliente,
                formData.lugarCita,
                localStorage.getItem('userName') || 'Unknown'
            ),
            location: formData.lugarCita,
            start: {
                dateTime: `${formData.fecha}T${formData.hora}:00`,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
                dateTime: `${formData.fecha}T${formData.hora}:00`,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            extendedProperties: {
                shared: {
                    category: formData.categoria,
                    creator: localStorage.getItem('userName') || 'Unknown',
               
                }
            }
        };
  
          const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(event)
          });
  
          if (!response.ok) {
              throw new Error('Error al crear evento en Google Calendar');
          }
  
          // Actualizar en Firestore
          const fecha = new Date(`${formData.fecha}T${formData.hora}`).getTime();
          const updateData = {};
  
          switch (paso) {
              case 6:
                  updateData.paso6_fechaCitaAtendida = fecha;
                  break;
              case 8:
                  updateData.paso8_agendarCitaParaFirmar = fecha;
                  break;
              case 11:
                  updateData.paso11_agendarCitaParaEntregaPorcentaje = fecha;
                  break;
              default:
                  updateData[`paso${paso}_agendarCita`] = fecha;
          }
  
          updateData.categoria = formData.categoria;
  
          await db.collection("seguimientoProspectos2")
              .doc(prospectoActualId)
              .update(updateData);
  
          const porcentaje = calcularPorcentaje(paso);
          await db.collection("prospectos2")
              .doc(prospectoActualId)
              .update({
                  porcentaje: porcentaje,
              });
  
          // Mostrar mensaje de éxito
          await Swal.fire({
              icon: "success",
              title: "¡Cita agendada!",
              html: `
                  <div class="success-schedule">
                      <div class="success-icon">
                          <i class="fas fa-calendar-check"></i>
                      </div>
                      <div class="success-details">
                          <p>La cita se ha agendado para:</p>
                          <strong>${new Date(fecha).toLocaleString("es-ES", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                          })}</strong>
                          <p class="mt-2">
                              <i class="fab fa-google text-primary"></i>
                              Evento agregado a Google Calendar
                          </p>
                      </div>
                  </div>
              `,
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
          });
  
          modal.hide();
          mostrarPasoSeguimiento(paso);
      }
  };

  } catch (error) {
    console.error("Error en la autenticación:", error);
    Swal.fire({
      icon: "error",
      title: "Error de autenticación",
      text: "No se pudo verificar el acceso a Google Calendar.",
      confirmButtonText: "Entendido",
    });
  }
}


function buildEventDescription(description, client, location, creator) {
  return `${description}\nCliente: ${client}\nLugar: ${location}\nConvocado por: ${creator}`;
}

function calcularPorcentaje(paso) {
  return Math.round(paso * 7.69); // Redondear el porcentaje
}

function adjuntarArchivoPaso(paso) {
  const inputFile = document.createElement("input");
  inputFile.type = "file";
  inputFile.accept = ".pdf,.jpg,.jpeg,.png";
  inputFile.multiple = true;

  inputFile.onchange = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      archivoAdjunto = Array.from(files);
      console.log(
        "Archivos seleccionados en adjuntarArchivoPaso:",
        archivoAdjunto
      );

      // Actualizar el botón para indicar que se adjuntaron correctamente
      const botonAdjuntar = document.querySelector(
        `button[data-paso="${paso}"]`
      );
      if (botonAdjuntar) {
        botonAdjuntar.innerHTML = `<i class="fas fa-check me-2"></i>${archivoAdjunto.length} archivo(s) adjuntado(s)`;
        botonAdjuntar.classList.remove("btn-secondary");
        botonAdjuntar.classList.add("btn-success");
      }
    } else {
      archivoAdjunto = [];
      alert("No se seleccionó ningún archivo.");
    }
  };

  inputFile.click(); // Abrir el selector de archivos
}

// Primero, necesitamos una variable global para almacenar los archivos



function initializeFlatpickr() {
  flatpickr("#fecha-cita", {
    enableTime: true,
    dateFormat: "Y-m-d H:i",
    minDate: "today",
    locale: Spanish,
    time_24hr: true,
    onChange: function (selectedDates, dateStr, instance) {
      fechaCitaSeleccionada = selectedDates[0];
    },
  });
}

function mostrarCalendario(paso) {
  pasoActual = paso;
  const calendarModal = new bootstrap.Modal(
    document.getElementById("calendarModal")
  );
  calendarModal.show();
  //initializeFlatpickr(); //No longer needed, Flatpickr is initialized within agendarCita
  agendarCita(paso);
}


// Actualizar los datos de los pasos
const pasosData = [
    {
      titulo: "Crear Prospecto",
      contenido: "Captura inicial de datos del prospecto en el sistema.",
      accionesRecomendadas: [
        "Registrar información básica",
        "Verificar datos ingresados",
      ],
      botones: [],
      campoCompletado: "paso1_CrearProspecto",
    },
    {
      titulo: "Llamar para ofrecer paquetes",
      contenido: "Primer contacto telefónico para presentación de servicios.",
      accionesRecomendadas: [
        "Preparar presentación de paquetes",
        "Documentar respuesta del cliente",
      ],
      botones: [{ texto: "Adjuntar evidencia", icono: "fas fa-paperclip", clase: "btn-secondary", accion: "adjuntarArchivo(2)" }],
      campoCompletado: "paso2_llamarInformacion",
    },
    {
      titulo: "Agendar Cita",
      contenido: "Coordinar reunión presencial para presentación detallada.",
      accionesRecomendadas: [
        "Definir fecha y hora conveniente",
        "Confirmar lugar de reunión",
      ],
      botones: [{ texto: "Agendar cita", icono: "fas fa-calendar", clase: "btn-secondary", accion: "agendarCita(3)" }],
      campoCompletado: "paso3_agendarCita",
    },
    {
      titulo: "Confirmar cita dia o horas antes",
      contenido: "Verificación previa de asistencia a la reunión programada.",
      accionesRecomendadas: [
        "Enviar recordatorio 24h antes",
        "Confirmar asistencia el mismo día",
      ],
      botones: [{ texto: "Adjuntar evidencia", icono: "fas fa-paperclip", clase: "btn-secondary", accion: "adjuntarArchivo(4)" }],
      campoCompletado: "paso4_llamarConfirmarCita",
    },
    {
      titulo: "Subir evidencia de paquetes ofrecidos",
      contenido: "Documentación de propuesta comercial presentada.",
      accionesRecomendadas: [
        "Detallar servicios presentados",
        "Registrar cotización formal",
        "Documentar condiciones especiales",
      ],
      botones: [],
      campoCompletado: "paso5_completado",
    },
    {
      titulo: "Que fecha se atendio",
      contenido: "Registro de reunión presencial realizada.",
      accionesRecomendadas: [
        "Documentar puntos tratados y acuerdos alcanzados",
      ],
      botones: [{ texto: "Agendar cita", icono: "fas fa-calendar", clase: "btn-secondary", accion: "agendarCita(6)" }],
      campoCompletado: "paso6_fechaCitaAtendida",
    },
    {
      titulo: "Anticipo",
      contenido: "Gestión del pago inicial y documentación.",
      accionesRecomendadas: [
        "Verificar monto recibido",
        "Emitir comprobante oficial",
      ],
      botones: [],
      campoCompletado: "paso7_adjuntarRecibosAnticipoURL",
    },
    {
      titulo: "Agendar Cita para firmar contrato",
      contenido: "Programación de firma de documentos oficiales.",
      accionesRecomendadas: [
        "Preparar documentación completa",
        "Confirmar disponibilidad de todas las partes",
      ],
      botones: [{ texto: "Agendar cita", icono: "fas fa-calendar", clase: "btn-secondary", accion: "agendarCita(8)" }],
      campoCompletado: "paso8_agendarCitaParaFirmar",
    },
    {
      titulo: "Confirmar cita",
      contenido: "Verificación final para firma de contrato.",
      accionesRecomendadas: [
        "Confirmar horario y ubicación",
        "Verificar documentación necesaria",
      ],
      botones: [{ texto: "Registrar confirmación", icono: "fab fa-whatsapp", clase: "btn-secondary", accion: "adjuntarArchivo(9)" }],
      campoCompletado: "paso9_confirmacionCita",
    },
    {
      titulo: "Subir evidencia del contrato",
      contenido: "Documentación del proceso de firma de contrato.",
      accionesRecomendadas: [
        "Verificar firmas completas",
        "Digitalizar documentación",
      ],
      botones: [{ texto: "Adjuntar evidencia", icono: "fas fa-paperclip", clase: "btn-secondary", accion: "adjuntarArchivo(10)" }],
      campoCompletado: "paso10_firmaContratoEvidendiasURL",
    },
    {
      titulo: "Agendar Cita para recibir el pago",
      contenido: "Coordinación para recepción del segundo pago (30%).",
      accionesRecomendadas: [
        "Confirmar método de pago",
        "Programar fecha de recepción",
      ],
      botones: [{ texto: "Agendar cita", icono: "fas fa-calendar", clase: "btn-secondary", accion: "agendarCita(11)" }],
      campoCompletado: "paso11_agendarCitaParaEntregaPorcentaje",
    },
    {
      titulo: "Adjuntar recibo",
      contenido: "Registro y documentación del pago recibido.",
      accionesRecomendadas: [
        "Verificar monto completo",
        "Emitir documentación correspondiente",
      ],
      botones: [{ texto: "Adjuntar evidencia", icono: "fas fa-paperclip", clase: "btn-secondary", accion: "adjuntarArchivo(12)" }],
      campoCompletado: "paso12_atencionCitaEvidenciaRecibosURL",
    },
    {
      titulo: "Asignación de usuario y contraseña",
      contenido: "Creación de accesos para el cliente.",
      accionesRecomendadas: [
        "Generar credenciales únicas",
        "Enviar información de acceso",
      ],
      botones: [{ texto: "Generar Credenciales", icono: "fas fa-user-plus", clase: "btn-primary", accion: "generarCredenciales()" }],
      campoCompletado: "paso13_asignacionUsuario",
    },
  ];

async function cargarDatosAnticipo() {
  try {
    // Obtener el documento del prospecto
    const prospectoDoc = await db
      .collection("prospectos2")
      .doc(prospectoActualId)
      .get();

    if (!prospectoDoc.exists) {
      console.error("No se encontró el prospecto con el ID proporcionado.");
      alert("No se encontraron datos para este prospecto.");
      return;
    }

    const prospectoData = prospectoDoc.data();

    // Asignar valores a los campos
    if (prospectoData.fecha_evento) {
      const fecha = new Date(prospectoData.fecha_evento)
        .toISOString()
        .split("T")[0]; // Convertir milisegundos a formato YYYY-MM-DD
      document.getElementById("fecha").value = fecha;
    }

    if (prospectoData.invitados) {
      document.getElementById("numPersonas").value = prospectoData.invitados;
    }

    if (prospectoData.pregunta_por) {
      document.getElementById("lugar").value = prospectoData.pregunta_por;
    }

    console.log("Datos cargados correctamente:", prospectoData);
  } catch (error) {
    console.error("Error al cargar los datos del anticipo:", error);
    alert("Error al cargar los datos del anticipo.");
  }
}



// Función auxiliar para mostrar el progreso de carga de archivos (opcional)
function mostrarProgresoArchivos(progreso) {
  const porcentaje = Math.round(progreso);
  Swal.update({
    title: "Subiendo archivos",
    html: `
            <div class="progress" style="height: 20px;">
                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                     role="progressbar" 
                     style="width: ${porcentaje}%" 
                     aria-valuenow="${porcentaje}" 
                     aria-valuemin="0" 
                     aria-valuemax="100">
                    ${porcentaje}%
                </div>
            </div>
        `,
  });
}


// Variables globales
let lastVisible = null;
let currentQuery = null;
const pageSize = 7;

// Elementos del DOM
const elements = {
    loader:document.getElementById('loader'),
    prospectosLista: document.getElementById('prospectos-lista'),
    filterType: document.getElementById('filter-type'),
    textSearch: document.getElementById('text-search'),
    searchInput: document.getElementById('search-input'),
    selectValue: document.getElementById('select-value'),
    tableBody: document.querySelector(".table-responsive")
};




// Configuración de modales
function setupModalListeners() {
    const modales = ['prospectoModal', 'seguimientoModal', 'modalMasInformacion'];
    
    modales.forEach(modalId => {
        document.getElementById(modalId)?.addEventListener("hidden.bs.modal", limpiarBackdrop);
    });
}

function limpiarBackdrop() {
    const backdrops = document.getElementsByClassName("modal-backdrop");
    while (backdrops.length > 0) {
        backdrops[0].parentNode.removeChild(backdrops[0]);
    }
    document.body.classList.remove("modal-open");
}


