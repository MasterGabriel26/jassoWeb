// Estilos CSS actualizados
async function mostrarPublicaciones() {
    const modalHTML = `
        <div class="modal fade" id="publicacionesModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Publicaciones</h5>
                        <button type="button" class="close-button" data-bs-dismiss="modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="publicacionesList" class="publications-grid">
                            <!-- Las publicaciones se cargarán aquí -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <span class="selected-count">0 publicaciones seleccionadas</span>
                        <button type="button" class="action-button save" onclick="guardarPublicacionesSeleccionadas()">
                            <i class="fas fa-check"></i> Guardar selección
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
  
    // Eliminar modal anterior si existe
    const modalAnterior = document.getElementById("publicacionesModal");
    if (modalAnterior) {
        modalAnterior.remove();
    }
  
    // Agregar el nuevo modal al DOM
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  
    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById("publicacionesModal"));
    modal.show();
  
    // Cargar las publicaciones
    await cargarPublicaciones();
  }
  
  let publicacionesSeleccionadas = new Set();
  
  async function cargarPublicaciones() {
    const publicacionesList = document.getElementById("publicacionesList");
    publicacionesList.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <span>Cargando publicaciones...</span>
        </div>
    `;
  
    try {
        // Obtener las publicaciones de Firestore
        const snapshot = await db.collection("publicaciones2").get();
  
        if (snapshot.empty) {
            publicacionesList.innerHTML = '<div class="text-center">No se encontraron publicaciones</div>';
            return;
        }
  
        let publicacionesHTML = "";
       // En la función cargarPublicaciones, modifica solo la parte del template de la card:
  
  snapshot.forEach((doc) => {
    const publicacion = doc.data();
    const isSelected = publicacionesSeleccionadas.has(doc.id);
    publicacionesHTML += `
        <div class="publication-card ${isSelected ? "selected" : ""}" 
             onclick="togglePublicacion('${doc.id}', this)">
            <div class="publication-image">
                <img src="${publicacion.imagen_destacada || "/placeholder.svg"}" 
                     alt="${publicacion.titulo || 'Sin título'}">
                <div class="selection-overlay">
                    <i class="fas fa-check"></i>
                </div>
            </div>
            <div class="publication-info">
                <h3 class="publication-title">${publicacion.titulo || 'Sin título'}</h3>
                <div class="publication-details">
                    <span class="category">
                        <i class="fas fa-tag"></i> ${publicacion.categoria || 'Sin categoría'}
                    </span>
                    <span class="location">
                        <i class="fas fa-map-marker-alt"></i> ${publicacion.lugar || 'Sin ubicación'}
                    </span>
                </div>
            </div>
        </div>
    `;
  });
        publicacionesList.innerHTML = publicacionesHTML || '<div class="empty-state">No se encontraron publicaciones</div>';
        actualizarContador();
    } catch (error) {
        console.error("Error al cargar publicaciones:", error);
        publicacionesList.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error al cargar las publicaciones</p>
            </div>
        `;
    }
  }
  
  function actualizarContador() {
    const contador = document.querySelector(".selected-count");
    if (contador) {
        contador.textContent = `${publicacionesSeleccionadas.size} publicación(es) seleccionada(s)`;
    }
  }
  
  function togglePublicacion(publicacionId, element) {
    if (publicacionesSeleccionadas.has(publicacionId)) {
        publicacionesSeleccionadas.delete(publicacionId);
        element.classList.remove("selected");
    } else {
        publicacionesSeleccionadas.add(publicacionId);
        element.classList.add("selected");
    }
    actualizarContador();
  }
  
  let publicacionesGuardadas = [];
  
  async function guardarPublicacionesSeleccionadas() {
    try {
        publicacionesGuardadas = Array.from(publicacionesSeleccionadas);
        console.log("Publicaciones guardadas en memoria:", publicacionesGuardadas);
  
        const modal = bootstrap.Modal.getInstance(document.getElementById("publicacionesModal"));
        modal.hide();
  
        const botonAdjuntar = document.querySelector(`button[data-paso="55"]`);
        if (botonAdjuntar) {
            botonAdjuntar.innerHTML = `<i class="fas fa-check me-2"></i>${publicacionesGuardadas.length} publicación(es) seleccionada(s)`;
            botonAdjuntar.classList.remove("btn-secondary");
            botonAdjuntar.classList.add("btn-success");
        }
    } catch (error) {
        console.error("Error al procesar las publicaciones:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al procesar las publicaciones seleccionadas'
        });
    }
  }


  async function verificarPaso5() {
    const descripcion = document.getElementById("descripcion").value.trim();
  
    // Validaciones con SweetAlert2
    if (!descripcion) {
      Swal.fire({
        icon: "warning",
        title: "Campo requerido",
        text: "Por favor, ingrese una descripción de los paquetes ofrecidos.",
        confirmButtonText: "Entendido",
      });
      return;
    }
  
    if (archivoAdjunto.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Archivo requerido",
        text: "Por favor, adjunte al menos un archivo de evidencia.",
        confirmButtonText: "Entendido",
      });
      return;
    }
  
    if (publicacionesGuardadas.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Selección requerida",
        text: "Por favor, seleccione al menos un paquete.",
        confirmButtonText: "Entendido",
      });
      return;
    }
  
    // Mostrar loading
    Swal.fire({
      title: "Guardando información",
      html: "Por favor espere...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  
    try {
      const updateData = {
        paso5_descripcion: descripcion,
        paso5_idsPublicaciones: Array.from(publicacionesGuardadas),
      };
  
      // Subir archivos
      const downloadURLs = [];
      for (const file of archivoAdjunto) {
        const storageRef = firebase
          .storage()
          .ref(`prospectos/${prospectoActualId}/paso5/${file.name}`);
        await storageRef.put(file);
        const downloadURL = await storageRef.getDownloadURL();
        downloadURLs.push(downloadURL);
      }
      updateData.paso5_adjuntarCotizacionURL =
        firebase.firestore.FieldValue.arrayUnion(...downloadURLs);
  
      // Actualizar datos en Firestore
      await db
        .collection("seguimientoProspectos2")
        .doc(prospectoActualId)
        .set(updateData, { merge: true });
  
     
      const porcentaje = calcularPorcentaje(5);
      await db.collection("prospectos2").doc(prospectoActualId).update({
        porcentaje: porcentaje,
      });
  
      // Mostrar mensaje de éxito
      await Swal.fire({
        icon: "success",
        title: "¡Completado!",
        text: "La información se guardó correctamente",
        showConfirmButton: false,
        timer: 2000,
      });
  
      mostrarPasoSeguimiento(5);
    } catch (error) {
      console.error("Error al guardar:", error);
  
      // Mostrar mensaje de error
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un problema al guardar los cambios. Por favor, intente nuevamente.",
        confirmButtonText: "Entendido",
        footer: `<small class="text-muted">Error: ${error.message}</small>`,
      });
    }
  }