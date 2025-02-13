async function guardarDatosAnticipo() {
    try {
      const fecha = document.getElementById("fecha").value;
      const numPersonas = document.getElementById("numPersonas").value;
      const lugar = document.getElementById("lugar").value;
  
      // Validaciones con SweetAlert2
      if (!fecha || !numPersonas || !lugar) {
        Swal.fire({
          icon: "warning",
          title: "Campos incompletos",
          text: "Por favor, complete todos los campos requeridos",
          confirmButtonText: "Entendido",
        });
        return;
      }
  
      if (archivosAnticipo.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Archivo requerido',
            text: 'Por favor, adjunte el recibo del anticipo antes de guardar',
            confirmButtonText: 'Entendido'
        });
        return;
    }
    
  
      // Mostrar loader inicial
      Swal.fire({
        title: "Procesando anticipo",
        html: `
                  <div class="upload-progress">
                      <div class="upload-icon">
                          <i class="fas fa-file-invoice-dollar"></i>
                      </div>
                      <div class="upload-text">
                          Preparando archivos...
                      </div>
                  </div>
              `,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
  
      // Array para almacenar las URLs de los archivos
      const downloadURLs = [];
      for (let i = 0; i < archivosAnticipo.length; i++) {
          const archivo = archivosAnticipo[i];
        const timestamp = Date.now();
        const nombreArchivo = `${timestamp}_${archivo.name}`;
        const storageRef = firebase
          .storage()
          .ref(`recibosAnticipo/${prospectoActualId}/${nombreArchivo}`);
  
        // Subir con progreso
        const uploadTask = storageRef.put(archivo);
  
        await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              Swal.update({
                html: `
                                  <div class="upload-progress">
                                      <div class="upload-icon">
                                          <i class="fas fa-file-upload"></i>
                                      </div>
                                      <div class="upload-text">
                                          Subiendo archivo ${i + 1} de ${
                  archivoAdjunto.length
                }
                                      </div>
                                      <div class="progress-bar">
                                          <div class="progress" style="width: ${progress}%"></div>
                                      </div>
                                      <div class="upload-percentage">${Math.round(
                                        progress
                                      )}%</div>
                                  </div>
                              `,
              });
            },
            (error) => {
              reject(error);
            },
            async () => {
              const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
              downloadURLs.push(downloadURL);
              resolve();
            }
          );
        });
      }
  
      // Convertir fecha
      const fechaEvento = new Date(fecha).getTime();
  
      // Actualizar Firestore
      const seguimientoDoc = await db
        .collection("seguimientoProspectos2")
        .doc(prospectoActualId)
        .get();
      const seguimientoData = seguimientoDoc.data();
  
      await db
        .collection("seguimientoProspectos2")
        .doc(prospectoActualId)
        .update({
          paso7_adjuntarRecibosAnticipoURL:
            firebase.firestore.FieldValue.arrayUnion(...downloadURLs),
        });
  
      await db.collection("prospectos2").doc(prospectoActualId).update({
        fecha_evento: fechaEvento,
        invitados: numPersonas,
        pregunta_por: lugar,
        pregunta_porMin: lugar.toLowerCase(),
      });
  
      // Calcular y actualizar porcentaje
      const completedSteps = Object.values(seguimientoData).filter(
        (value) => value === true || (Array.isArray(value) && value.length > 0)
      ).length;
      const porcentaje = Math.round((completedSteps / 13) * 100);
  
      await db.collection("prospectos2").doc(prospectoActualId).update({
        porcentaje: porcentaje.toString(),
      });
  
      // Limpiar los archivos almacenados
      archivosAnticipo = [];
  
      // Mostrar mensaje de éxito
      await Swal.fire({
        icon: "success",
        title: "¡Anticipo registrado!",
        html: `
                  <div class="success-message">
                      <div class="success-icon">
                          <i class="fas fa-check-circle"></i>
                      </div>
                      <div class="success-details">
                          <p>Se ha registrado el anticipo correctamente</p>
                          <div class="details-grid">
                              <div class="detail-item">
                                  <i class="fas fa-calendar"></i>
                                  <span>Fecha: ${new Date(
                                    fechaEvento
                                  ).toLocaleDateString()}</span>
                              </div>
                              <div class="detail-item">
                                  <i class="fas fa-users"></i>
                                  <span>Invitados: ${numPersonas}</span>
                              </div>
                              <div class="detail-item">
                                  <i class="fas fa-map-marker-alt"></i>
                                  <span>Lugar: ${lugar}</span>
                              </div>
                          </div>
                      </div>
                  </div>
              `,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
  
      mostrarPasoSeguimiento(7);
    } catch (error) {
      console.error("Error al guardar anticipo:", error);
      Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text: "Hubo un problema al procesar el anticipo: " + error.message,
        confirmButtonText: "Entendido",
      });
    }
  }

  let archivosAnticipo = []; // Variable global para almacenar los archivos

async function seleccionarArchivosAnticipo(paso) {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ".jpg,.jpeg,.png,.pdf";
    
    input.onchange = async (e) => {
        const files = Array.from(e.target.files);

        if (files.length > 0) {
            try {
                // Validar tamaño total
                const totalSize = files.reduce((acc, file) => acc + file.size, 0);
                const maxSize = 25 * 1024 * 1024; // 25MB

                if (totalSize > maxSize) {
                    throw new Error(`El tamaño total de los archivos excede el límite de ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
                }

                // Procesar archivos
                const processedFiles = await Promise.all(
                    files.map(async (file) => {
                        try {
                            return await procesarArchivo(file);
                        } catch (error) {
                            throw new Error(`Error al procesar ${file.name}: ${error.message}`);
                        }
                    })
                );

                // Almacenar los archivos procesados
                archivosAnticipo = processedFiles;

                // Mostrar preview de los archivos seleccionados
                const button = document.querySelector(`button[data-paso="${paso}"]`);
                if (button) {
                    button.innerHTML = `
                        <i class="fas fa-check me-2"></i>
                        ${files.length} archivo${files.length > 1 ? 's' : ''} seleccionado${files.length > 1 ? 's' : ''}
                    `;
                }

                // Mostrar SweetAlert con la previsualización
                await Swal.fire({
                    title: 'Archivos seleccionados',
                    html: `
                        <div class="files-preview">
                            ${files.map(file => `
                                <div class="file-item">
                                    <i class="fas ${file.type.includes('pdf') ? 'fa-file-pdf' : 'fa-file-image'}"></i>
                                    <span>${file.name}</span>
                                    <small>(${(file.size / 1024 / 1024).toFixed(2)} MB)</small>
                                </div>
                            `).join('')}
                        </div>
                        <div class="files-info mt-3">
                            <p>Los archivos se guardarán cuando complete el formulario</p>
                        </div>
                    `,
                    icon: 'info',
                    confirmButtonText: 'Entendido'
                });

            } catch (error) {
                console.error("Error:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error al procesar archivos',
                    text: error.message,
                    confirmButtonText: 'Entendido'
                });

                // Resetear el botón si hay error
                const button = document.querySelector(`button[data-paso="${paso}"]`);
                if (button) {
                    button.innerHTML = '<i class="fas fa-paperclip me-2"></i>Adjuntar archivo';
                }
                archivosAnticipo = []; // Limpiar los archivos en caso de error
            }
        }
    };

    input.click();
}