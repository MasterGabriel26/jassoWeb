// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAOvefpvlXLtbTx1T2hYg2Ds56eiKI3eAk",
    authDomain: "jassodb-4b8e4.firebaseapp.com",
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

document.addEventListener('DOMContentLoaded', function() {
    populateSelect('lugarEvento', 'lugares', 'nombreLugar');
    populateSelect('tipoEvento', 'eventos', 'evento');
    
    const form = document.getElementById('publicacionForm');
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    const categoriaSelect = document.getElementById('categoria');
    const backButton = document.getElementById('backButton');

    // Category-specific fields
    const camposAlimentosYBebidas = document.getElementById('camposAlimentosYBebidas');
    const camposRentaVestidos = document.getElementById('camposRentaVestidos');
    const camposFotografiaVideo = document.getElementById('camposFotografiaVideo');
    const camposDecoracion = document.getElementById('camposDecoracion');
    const camposGruposSonido = document.getElementById('camposGruposSonido');
    const camposRentaMobiliario = document.getElementById('camposRentaMobiliario');

    categoriaSelect.addEventListener('change', function() {
        // Hide all category-specific fields
        camposAlimentosYBebidas.style.display = 'none';
        camposRentaVestidos.style.display = 'none';
        camposFotografiaVideo.style.display = 'none';
        camposDecoracion.style.display = 'none';
        camposGruposSonido.style.display = 'none';
        camposRentaMobiliario.style.display = 'none';

        // Show fields based on selected category
        switch(this.value) {
            case 'Alimentos y Bebidas':
                camposAlimentosYBebidas.style.display = 'block';
                break;
            case 'Renta de Vestidos':
                camposRentaVestidos.style.display = 'block';
                break;
            case 'Fotografia y Video':
                camposFotografiaVideo.style.display = 'block';
                break;
            case 'Decoración':
                camposDecoracion.style.display = 'block';
                break;
            case 'Grupos y Sonidos':
                camposGruposSonido.style.display = 'block';
                break;
            case 'Renta de Mobiliario':
                camposRentaMobiliario.style.display = 'block';
                break;
        }
    });

    imageUpload.addEventListener('change', function(event) {
        imagePreview.innerHTML = '';
        for (let file of event.target.files) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                imagePreview.appendChild(img);
            }
            reader.readAsDataURL(file);
        }
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (form.checkValidity() === false) {
            e.stopPropagation();
            form.classList.add('was-validated');
            return;
        }

        const formData = new FormData(form);
        const publicacionData = {
            categoria: formData.get('categoria'),
            tituloEvento: formData.get('tituloEvento'),
            tituloEventoLowercase: formData.get('tituloEvento').toLowerCase(),
            tipoEvento: Array.from(document.getElementById('tipoEvento').selectedOptions).map(option => option.value),
            cantidadDePersonas: formData.get('cantidadDePersonas'),
            fechaPost: new Date(formData.get('fechaPost')).getTime(),
            fechaVigencia: new Date(formData.get('fechaVigencia')).getTime(),
            fechaDeEvento: new Date(formData.get('fechaDeEvento')).getTime(),
            horarioEvento: formData.get('horarioEvento'),
            lugarDelEventoMapa: formData.get('lugarDelEventoMapa'),
            celularContacto: formData.get('celularContacto'),
            descripcion: formData.get('descripcion'),
            costoPaquete: formData.get('costoPaquete'),
            anticipo: formData.get('anticipo'),
            costoParaFirmar: formData.get('costoParaFirmar'),
            comisionVenta: formData.get('comisionVenta'),
            comisionLlamada: formData.get('comisionLlamada'),
            comisionLiderVenta: formData.get('comisionLiderVenta'),
            valorAgregado: formData.get('valorAgregado'),
            multimediaUrl: [],
            likesCount: 0,
            uid: 'USER_UID_HERE' // Replace with actual user UID when integrating authentication
        };

        // Add category-specific fields
        switch(formData.get('categoria')) {
            case 'Alimentos y Bebidas':
                publicacionData.serviciosAlimento = Array.from(document.getElementById('serviciosAlimento').selectedOptions).map(option => option.value);
                publicacionData.cantidadBotellas = formData.get('cantidadBotellas');
                publicacionData.tipoBotellas = Array.from(document.getElementById('tipoBotellas').selectedOptions).map(option => option.value);
                break;
            case 'Renta de Vestidos':
                publicacionData.tipoTela = Array.from(document.getElementById('tipoTela').selectedOptions).map(option => option.value);
                publicacionData.colores = formData.get('colores').split(',').map(color => color.trim());
                publicacionData.costoFleteVestido = formData.get('costoFleteVestido');
                publicacionData.descripcionAjusteVestido = formData.get('descripcionAjusteVestido');
                publicacionData.fechaEntregaVestido = new Date(formData.get('fechaEntregaVestido')).getTime();
                publicacionData.modeloVestidoLista = Array.from(document.getElementById('modeloVestidoLista').selectedOptions).map(option => option.value);
                publicacionData.costoDiaAdicionalVestido = formData.get('costoDiaAdicionalVestido');
                publicacionData.cuponPromocional = formData.get('cuponPromocional');
                publicacionData.entregaDomicilio = formData.get('entregaDomicilio') === 'on';
                break;
            case 'Fotografia y Video':
                publicacionData.tipoPapel = Array.from(document.getElementById('tipoPapel').selectedOptions).map(option => option.value);
                publicacionData.tamanio = Array.from(document.getElementById('tamanio').selectedOptions).map(option => option.value);
                publicacionData.incluyeDomicilioMaquillaje = formData.get('incluyeDomicilioMaquillaje') === 'on';
                publicacionData.incluyeMaquillaje = formData.get('incluyeMaquillaje') === 'on';
                publicacionData.tieneMisa = formData.get('tieneMisa') === 'on';
                publicacionData.bodaCivil = formData.get('bodaCivil') === 'on';
                publicacionData.direccionBoda = formData.get('direccionBoda');
                publicacionData.horaMisa = formData.get('horaMisa');
                publicacionData.direccionMisa = formData.get('direccionMisa');
                break;
            case 'Decoración':
                publicacionData.lugar = formData.get('lugar');
                publicacionData.urlFotoArreglos = formData.get('urlFotoArreglos');
                publicacionData.urlFotoBase = formData.get('urlFotoBase');
                publicacionData.urlFotoTonosEvento = formData.get('urlFotoTonosEvento');
                break;
            case 'Grupos y Sonidos':
                publicacionData.costoHora = formData.get('costoHora');
                publicacionData.generos = Array.from(document.getElementById('generos').selectedOptions).map(option => option.value);
                break;
            case 'Renta de Mobiliario':
                publicacionData.costoDia = formData.get('costoDia');
                publicacionData.costoFleteMoviliario = formData.get('costoFleteMoviliario');
                break;
        }

        try {
            // Upload images
            const files = imageUpload.files;
            for (let file of files) {
                const storageRef = storage.ref('images/' + file.name);
                await storageRef.put(file);
                const url = await storageRef.getDownloadURL();
                publicacionData.multimediaUrl.push(url);
            }

            // Add document to Firestore
            const docRef = await db.collection('publicaciones').add(publicacionData);
            console.log("Document written with ID: ", docRef.id);
            alert('Publicación creada exitosamente!');
            form.reset();
            imagePreview.innerHTML = '';
        } catch (error) {
            console.error("Error adding document: ", error);
            alert('Error al crear la publicación. Por favor, intente de nuevo.');
        }
    });

    backButton.addEventListener('click', function(e) {
        e.preventDefault();
        // Replace with the actual URL you want to go back to
        window.location.href = 'index.html';
    });
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
