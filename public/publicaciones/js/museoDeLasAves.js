
		const firebaseConfig = {
			apiKey: "AIzaSyAOvefpvlXLtbTx1T2hYg2Ds56eiKI3eAk",
			authDomain: "jassodb-4b8e4.firebaseapp.com",
			databaseURL: "https://jassodb-4b8e4-default-rtdb.firebaseio.com",
			projectId: "jassodb-4b8e4",
			storageBucket: "jassodb-4b8e4.appspot.com",
			messagingSenderId: "851107842246",
			appId: "1:851107842246:web:aa155261b9acdda47e6fc7",
			measurementId: "G-N18F7GL2NG",
		};


		firebase.initializeApp(firebaseConfig);
		const db = firebase.firestore();

		

		document.addEventListener("DOMContentLoaded", async function () {
			// try {
			const urlParams = new URLSearchParams(window.location.search);
			const publicacionId = urlParams.get("id");
			const tipoUsuario = urlParams.get("tipo"); // Obtener el tipo de usuario


			if (!publicacionId) {
				throw new Error("ID de publicación no proporcionado");
			}

			const doc = await firebase
				.firestore()
				.collection("publicaciones2")
				.doc(publicacionId)
				.get();

			if (!doc.exists) {
				throw new Error("Publicación no encontrada");
			}
			const data = doc.data();
           alert(data.lugar);
     




			const comisionesCard = document.getElementById("sidebar-commissions");
		
			if (tipoUsuario && tipoUsuario.toLowerCase() === 'asesor') {
				comisionesCard.style.display = 'block';
			}
			// Establecer imagen de fondo
			$("#categoria-sidebar").text(data.categoria);

			// Insertar el contenido de la publicación
			const fecha = data.fecha_creacion.toDate();
			const fechaFormateada = fecha.toLocaleDateString("es-ES", {
				year: "numeric",
				month: "long",
				day: "numeric",
			});
			const detalleHtml = `
            <div class="dreamit-blog-single-box">
                <div class="dreamit-single-thumb">
                    <img src="${data.imagen_destacada || 'assets/images/default-blog.jpg'}" 
                         alt="${data.titulo}"
                         style="width: 100%; height: 500px; object-fit: cover;">
                    <div class="post-catagoris">
                        <a href="#">${data.categoria ? data.categoria : 'Sin categoría'}</a>
                    </div>
                </div>
                <div class="dreamit-blog-content">
                    <div class="blog-meta-box">
                        <a href="#"><i class="fa fa-user"></i><span>Admin</span></a>
                        <span><i class="fa fa-calendar"></i><span>${fechaFormateada}</span></span>
                        <span><i class="far fa-comments"></i><span> 0 comment</span></span>
                    </div>
                    <div class="blog-title">
                        <h2>${data.lugar}</h2>
                    </div>
                    
                    <div class="blog-content-text post-content">
                        ${data.contenido}
                    </div>
                </div>
            </div>
        `;
			const styleTag = `
    <style>
        .dreamit-single-thumb img {
            width: 100%;
            height: 500px;
            object-fit: cover;
        }

        .post-content img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 20px auto;
        }

        /* Estilos responsivos */
        @media (max-width: 768px) {
            .dreamit-single-thumb img {
                height: 300px;
            }
        }

        /* Para imágenes muy grandes en el contenido */
        .post-content .img-container {
            max-width: 800px;
            margin: 20px auto;
            overflow: hidden;
        }

        /* Zoom en hover para las imágenes del contenido */
        .post-content img:hover {
            cursor: pointer;
            opacity: 0.9;
        }
    </style>
`;
			$('head').append(styleTag);

			$('.detalle-post').html(detalleHtml);
			document.title = data.titulo;
			
		});


	// Función auxiliar para formatear moneda
    function formatearMoneda(valor) {
        if (valor === undefined || valor === null) return '$0';
        return `$${valor.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }