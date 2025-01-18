// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAOvefpvlXLtbTx1T2hYg2Ds56eiKI3eAk",
  authDomain: "jassodb-4b8e4.firebaseapp.com",
  projectId: "jassodb-4b8e4",
  storageBucket: "jassodb-4b8e4.appspot.com",
  messagingSenderId: "851107842246",
  appId: "1:851107842246:web:aa155261b9acdda47e6fc7",
  measurementId: "G-N18F7GL2NG",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();


let selectedFiles = new Map();



// Añade este JavaScript
document.getElementById('btnMaterialAdicional').addEventListener('click', function() {
  const modal = new bootstrap.Modal(document.getElementById('materialAdicionalModal'));
  modal.show();
});

// Para manejar los botones de material
document.querySelectorAll('.btn-material').forEach(btn => {
  btn.addEventListener('click', function() {
      this.classList.toggle('active');
      updateCounter(this);
  });
});

function updateCounter(button) {
  const type = button.classList.contains('btn-images') ? 'Imágenes' :
               button.classList.contains('btn-videos') ? 'Videos' : 'PDF';
  const count = button.classList.contains('active') ? '1' : '0';
  button.innerHTML = `
      <i class="fas fa-${button.classList.contains('btn-images') ? 'images' : 
                        button.classList.contains('btn-videos') ? 'video' : 'file-pdf'} mb-2"></i>
      ${type} (${count})
  `;
}





document.addEventListener('DOMContentLoaded', function() {
  // Inicializar Select2 en todos los select múltiples
  $('.select2').select2({
      theme: 'bootstrap-5',
      width: '100%',
      placeholder: 'Selecciona opciones',
      allowClear: true,
      language: {
          noResults: function() {
              return "No se encontraron resultados";
          },
          searching: function() {
              return "Buscando...";
          }
      }
  });

  const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');


if (imageUpload) {
imageUpload.addEventListener('change', function(e) {
  // Convertir FileList a Array
  const newFiles = Array.from(e.target.files);
  
  // Añadir nuevos archivos al Map existente
  newFiles.forEach(file => {
      // Crear un identificador único usando timestamp
      const uniqueId = `${Date.now()}-${file.name}`;
      selectedFiles.set(uniqueId, file);
  });

  // Limpiar el input para permitir seleccionar los mismos archivos nuevamente
  this.value = '';
  
  // Actualizar vista previa
  updateImagePreview();
});
}

function updateImagePreview() {
imagePreview.innerHTML = '';

selectedFiles.forEach((file, uniqueId) => {
  const reader = new FileReader();
  reader.onload = function(e) {
      const previewContainer = document.createElement('div');
      previewContainer.className = 'preview-container';

      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = 'preview-image';

      const removeButton = document.createElement('button');
      removeButton.className = 'remove-button';
      removeButton.innerHTML = '×';

      removeButton.onclick = function(event) {
          event.preventDefault();
          event.stopPropagation();
          selectedFiles.delete(uniqueId);
          updateImagePreview();
      };

      previewContainer.appendChild(img);
      previewContainer.appendChild(removeButton);
      imagePreview.appendChild(previewContainer);
  };
  reader.readAsDataURL(file);
});
}

// Función para obtener todos los archivos seleccionados (útil para el envío del formulario)
function getSelectedFiles() {
return Array.from(selectedFiles.values());
}

});


document.addEventListener("DOMContentLoaded", function () {
  populateSelect("lugarEvento", "lugares", "nombreLugar");
  populateSelect("tipoEvento", "eventos", "evento");

  const form = document.getElementById("publicacionForm");
  const imageUpload = document.getElementById("imageUpload");
  const imagePreview = document.getElementById("imagePreview");
  const categoriaSelect = document.getElementById("categoria");
  const backButton = document.getElementById("backButton");

  // Category-specific fields
  const camposAlimentosYBebidas = document.getElementById(
    "camposAlimentosYBebidas"
  );
  const camposRentaVestidos = document.getElementById("camposRentaVestidos");
  const camposFotografiaVideo = document.getElementById(
    "camposFotografiaVideo"
  );
  const camposDecoracion = document.getElementById("camposDecoracion");
  const camposGruposSonido = document.getElementById("camposGruposSonido");
  const camposRentaMobiliario = document.getElementById(
    "camposRentaMobiliario"
  );

  categoriaSelect.addEventListener("change", function () {
    // Hide all category-specific fields
    camposAlimentosYBebidas.style.display = "none";
    camposRentaVestidos.style.display = "none";
    camposFotografiaVideo.style.display = "none";
    camposDecoracion.style.display = "none";
    camposGruposSonido.style.display = "none";
    camposRentaMobiliario.style.display = "none";

    // Show fields based on selected category
    switch (this.value) {
      case "Alimentos y Bebidas":
        camposAlimentosYBebidas.style.display = "block";
        break;
      case "Renta de Vestidos":
        camposRentaVestidos.style.display = "block";
        break;
      case "Fotografia y Video":
        camposFotografiaVideo.style.display = "block";
        break;
      case "Decoración":
        camposDecoracion.style.display = "block";
        break;
      case "Grupos y Sonidos":
        camposGruposSonido.style.display = "block";
        break;
      case "Renta de Mobiliario":
        camposRentaMobiliario.style.display = "block";
        break;
    }
  });



  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    try {
      // Mostrar loader
      Swal.fire({
        title: "Creando publicación...",
        text: "Por favor espere",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      if (form.checkValidity() === false) {
        throw new Error("Por favor, complete todos los campos requeridos");
      }

   
      


      const formData = new FormData(form);


           // Validaciones específicas
           if (selectedFiles.size === 0) {
            throw new Error("Debe seleccionar al menos una imagen");
        }
  
      // Validar fechas
      const fechaPost = new Date(formData.get("fechaPost")).getTime();
      const fechaVigencia = new Date(formData.get("fechaVigencia")).getTime();
      const fechaDeEvento = formData.get("fechaDeEvento")
        ? new Date(formData.get("fechaDeEvento")).getTime()
        : 0;

      if (fechaVigencia < fechaPost) {
        throw new Error(
          "La fecha de vigencia debe ser posterior a la fecha de publicación"
        );
      }

      // Obtener el usuario actual
      const user = firebase.auth().currentUser;
      if (!user) {
        throw new Error("Debe iniciar sesión para crear una publicación");
      }

    
      // Crear objeto base de la publicación
      const publicacionData = {
        id:this.id,
        uid: user.uid,
        fechaPost: Date.now(),
        fechaDeEvento: 0,
        categoria: document.getElementById('categoria').value,
        tituloEvento: document.getElementById('tituloEvento').value,
        tituloEventoLowercase: document.getElementById('tituloEvento').value.toLowerCase(),
        likesCount: 0,
        tipoEvento: Array.from(document.getElementById('tipoEvento').selectedOptions).map(option => option.value),
        descripcion: document.getElementById('descripcion').value,
        lugar:document.getElementById('lugarEvento').value,
        lugarDelEventoMapa: document.getElementById('direccion').value,
        celularContacto: document.getElementById('celularContacto').value,
        multimediaUrl: [],
        multimediaName: [],
        horarioEvento: "",
        valorAgregado: document.getElementById('valorAgregado').value || "",
       
       //paquete
        anticipo: document.getElementById('anticipo').value || "",
        costoPaquete: document.getElementById('costoPaquete').value,
        costoParaFirmar: document.getElementById('costoParaFirmar').value || "",
       
        //info para asesor
        comisionVenta: document.getElementById('comisionVenta').value || "",
        comisionLlamada: document.getElementById('comisionLlamada').value || "",
        comisionLiderVenta: document.getElementById('comisionLiderVenta').value || "",
       
        cantidadDePersonas: document.getElementById('cantidadDePersonas').value,
        fechaVigencia: new Date(document.getElementById('fechaVigencia').value).getTime(),
        active: true,
        id_materiañ:""

      };

      // Add category-specific fields
      switch (formData.get("categoria")) {
        case "Alimentos y Bebidas":
          publicacionData.serviciosAlimento = Array.from(
            document.getElementById("serviciosAlimento").selectedOptions
          ).map((option) => option.value);
          publicacionData.cantidadBotellas = formData.get("cantidadBotellas");
          publicacionData.tipoBotellas = Array.from(
            document.getElementById("tipoBotellas").selectedOptions
          ).map((option) => option.value);
          publicacionData.urlFotoMesa = formData.get("urlFotoMesa");
          publicacionData.urlFotoSilla = formData.get("urlFotoSilla");
          publicacionData.urlFotoMontaje = formData.get("urlFotoMontaje");
          break;

        case "Renta de Vestidos":
          publicacionData.tipoTela = Array.from(
            document.getElementById("tipoTela").selectedOptions
          ).map((option) => option.value);
          publicacionData.colores = formData
            .get("colores")
            .split(",")
            .map((color) => color.trim());
          publicacionData.costoFleteVestido = formData.get("costoFleteVestido");
          publicacionData.descripcionAjusteVestido = formData.get(
            "descripcionAjusteVestido"
          );
          publicacionData.fechaEntregaVestido = new Date(
            formData.get("fechaEntregaVestido")
          ).getTime();
          publicacionData.modeloVestidoLista = Array.from(
            document.getElementById("modeloVestidoLista").selectedOptions
          ).map((option) => option.value);
          publicacionData.costoDiaAdicionalVestido = formData.get(
            "costoDiaAdicionalVestido"
          );
          publicacionData.cuponPromocional = formData.get("cuponPromocional");
          publicacionData.entregaDomicio = // Corregido el nombre
            formData.get("entregaDomicio") === "on";
          break;

        case "Fotografia y Video":
          publicacionData.tipoPapel = Array.from(
            document.getElementById('tipoPapel')?.selectedOptions || []
          ).map(option => option.value);
          publicacionData.tamanio = Array.from(
            document.getElementById('tamanio')?.selectedOptions || []
          ).map(option => option.value);
          publicacionData.incluyeDomicilioMaquillaje = 
            document.getElementById('incluyeDomicilioMaquillaje')?.checked || false;
          publicacionData.incluyeMaquillaje = 
            document.getElementById('incluyeMaquillaje')?.checked || false;
          publicacionData.tieneMisa = 
            document.getElementById('tieneMisa')?.checked || false;
          publicacionData.bodaCivil = 
            document.getElementById('bodaCivil')?.checked || false;
          publicacionData.direccionBoda = formData.get("direccionBoda");
          publicacionData.horaMisa = formData.get("horaMisa");
          publicacionData.direccionMisa = formData.get("direccionMisa");
          break;

        case "Decoración":
         
          publicacionData.urlFotoArreglos = formData.get("urlFotoArreglos");
          publicacionData.urlFotoBase = formData.get("urlFotoBase");
          publicacionData.urlFotoTonosEvento = formData.get("urlFotoTonosEvento");
          break;

        case "Grupos y Sonido": // Corregido el nombre
          publicacionData.costoHora = formData.get("costoHora");
          publicacionData.generos = Array.from(
            document.getElementById("generos").selectedOptions
          ).map((option) => option.value);
          break;

        case "Renta de Mobiliario":
          publicacionData.costoDia = formData.get("costoDia");
          publicacionData.costoFleteMoviliario = formData.get("costoFleteMoviliario");

          break;
      }

      // Subir imágenes
      const files = Array.from(selectedFiles.values());
      const uploadPromises = files.map((file) => {
          const fileName = `${Date.now()}-${file.name}`;
          const storageRef = storage.ref(`images/${fileName}`);
          publicacionData.multimediaName.push(fileName);
          return storageRef
              .put(file)
              .then((snapshot) => snapshot.ref.getDownloadURL());
      });


      const urls = await Promise.all(uploadPromises);
      publicacionData.multimediaUrl = urls;

      // Guardar en Firestore
      const docRef = await db.collection("publicaciones").add(publicacionData);

      // Mostrar mensaje de éxito
      await Swal.fire({
        icon: "success",
        title: "¡Publicación creada exitosamente!",
        text: "La publicación ha sido creada y está lista para ser vista",
        showConfirmButton: true,
        confirmButtonText: "Aceptar",
      });

      // Limpiar formulario y redirigir
      form.reset();
      imagePreview.innerHTML = "";
      window.location.href = "paquetes.html"; // O la página que desees
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Hubo un error al crear la publicación",
        confirmButtonText: "Aceptar",
      });
    }
  });

  backButton.addEventListener("click", function (e) {
    e.preventDefault();
    // Replace with the actual URL you want to go back to
    window.location.href = "index.html";
  });
});

function populateSelect(selectId, collectionName, attribute) {
    const select = document.getElementById(selectId);
    db.collection(collectionName)
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const option = document.createElement("option");
                const data = doc.data();
                option.value = data[attribute];     // Usar el nombre como valor
                option.textContent = data[attribute]; // Usar el nombre como texto
                select.appendChild(option);
            });
        })
        .catch((error) => {
            console.error("Error fetching data: ", error);
        });
}
