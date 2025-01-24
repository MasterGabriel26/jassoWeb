async function generarCredenciales() {


    Swal.fire({
        title: 'Generando credenciales',
        html: `
          <div class="upload-progress">
            <div class="upload-progress-text">
              Preparando la información
            </div>
            <div class="progress-bar">
              <div class="progress" style="width: 0%"></div>
            </div>
            <div class="progress-text">0%</div>
          </div>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

  try {
     updateProgress(20, 'Obteniendo información del usuario');

    const prospectoDoc = await db
      .collection("prospectos2")
      .doc(prospectoActualId)
      .get();
    const prospectoData = prospectoDoc.data();

    if (!prospectoData || !prospectoData.name) {
      throw new Error(
        "El prospecto no tiene nombre registrado o no se encontró"
      );
    }

    console.log("Datos del prospecto obtenidos:", prospectoData);

    // Generar email y contraseña
    const fechaActual = new Date();
    const nombreLimpio = prospectoData.name
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[áäà]/g, "a")
      .replace(/[éëè]/g, "e")
      .replace(/[íïì]/g, "i")
      .replace(/[óöò]/g, "o")
      .replace(/[úüù]/g, "u")
      .replace(/ñ/g, "n")
      .replace(/[^a-z0-9]/g, "");

    const dia = fechaActual.getDate().toString().padStart(2, "0");
    const mes = (fechaActual.getMonth() + 1).toString().padStart(2, "0");
    const año = fechaActual.getFullYear().toString().slice(-4);

    updateProgress(40, 'Generando credenciales de acceso');

    const email = `${nombreLimpio}${dia}${mes}${año}@jasso.com`;
    const password = Math.floor(100000 + Math.random() * 900000).toString();

     
    // Crear una instancia secundaria de Firebase
    updateProgress(60, 'Creando cuenta de usuario');
    let secondaryApp;
    try {
      secondaryApp = firebase.initializeApp(
        {
          ...firebase.app().options,
          apiKey: firebase.app().options.apiKey,
          authDomain: firebase.app().options.authDomain,
          projectId: firebase.app().options.projectId,
        },
        "secondary"
      );
    } catch (e) {
      // Si la app ya existe, obtenerla
      secondaryApp = firebase.app("secondary");
    }

    // Crear usuario usando la instancia secundaria
    let userCredential;
    try {
      userCredential = await secondaryApp
        .auth()
        .createUserWithEmailAndPassword(email, password);
      console.log("Usuario creado en Firebase Authentication");
    } catch (authError) {
      console.error(
        "Error al crear usuario en Firebase Authentication:",
        authError
      );
      // Asegurarse de eliminar la app secundaria en caso de error
      await secondaryApp.delete();
      throw authError;
    }

    updateProgress(80, 'Guardando información');


    // Guardar información en Firestore (seguimientoProspectos)
    try {
      await db
        .collection("seguimientoProspectos2")
        .doc(prospectoActualId)
        .update({
          paso13_asignacionUsuario: true,
          paso13_correo: email,
          paso13_pass: password,
        });
      console.log("Información guardada en seguimientoProspectos2");
    } catch (seguimientoError) {
      console.error(
        "Error al guardar en seguimientoProspectos2:",
        seguimientoError
      );
      // Revertir la creación del usuario
      await userCredential.user.delete();
      await secondaryApp.delete();
      throw seguimientoError;
    }

    // Crear documento en 'usuarios' colección
    const userData = {
      active: true,
      email: email,
      imageProfile: "",
      name: prospectoData.name,
      onLine: true,
      password: password,
      phone: prospectoData.telefono_prospecto || "",
      timestamp: Date.now(),
      uid: userCredential.user.uid,
      userType: "cliente",
    };

    try {
      await db
        .collection("usuarios")
        .doc(userCredential.user.uid)
        .set(userData);
      console.log("Usuario creado exitosamente en la colección 'usuarios'");
    } catch (usuariosError) {
      console.error(
        "Error al crear usuario en la colección 'usuarios':",
        usuariosError
      );
      // Revertir la creación del usuario
      await userCredential.user.delete();
      await db
        .collection("seguimientoProspectos2")
        .doc(prospectoActualId)
        .update({
          paso13_asignacionUsuario: false,
          paso13_correo: firebase.firestore.FieldValue.delete(),
          paso13_pass: firebase.firestore.FieldValue.delete(),
        });
      await secondaryApp.delete();
      throw usuariosError;
    }

    // Actualizar porcentaje
    try {
      await db.collection("prospectos2").doc(prospectoActualId).update({
        porcentaje: 100,
      });
      console.log("Porcentaje actualizado en la colección 'prospectos'");
    } catch (porcentajeError) {
      console.error("Error al actualizar el porcentaje:", porcentajeError);
    }

    // Eliminar la instancia secundaria después de completar todo
    await secondaryApp.delete();

    console.log("Proceso de generación de credenciales completado con éxito");
    updateProgress(100, '¡Proceso completado!');

    // Mostrar mensaje de éxito
    setTimeout(() => {
      Swal.fire({
        icon: "success",
        title: "¡Credenciales generadas exitosamente!",
        html: `
          <div class="success-credentials">
            <div class="credentials-info">
              <i class="fas fa-check-circle success-icon"></i>
              <p>Las credenciales se han generado correctamente</p>
            </div>
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#28a745"
      });
    }, 1000);

    mostrarPasoSeguimiento(13);
  } catch (error) { console.error("Error en generación de credenciales:", error);
    
    let errorMessage = "Ocurrió un error al generar las credenciales.";
    let errorDetails = "";

    // Identificar tipo específico de error
    if (error.code) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = "El correo electrónico ya está en uso.";
                errorDetails = "Intenta con un nombre diferente o contacta a soporte.";
                break;
            case 'auth/invalid-email':
                errorMessage = "El correo electrónico no es válido.";
                errorDetails = "Verifica el formato del correo generado.";
                break;
            case 'auth/operation-not-allowed':
                errorMessage = "Operación no permitida.";
                errorDetails = "La creación de usuarios está deshabilitada.";
                break;
            case 'auth/weak-password':
                errorMessage = "La contraseña es muy débil.";
                errorDetails = "La contraseña debe cumplir con los requisitos mínimos.";
                break;
            default:
                errorDetails = error.message || "Error desconocido";
        }
    }

    // Si es un error de Firestore
    if (error.name === "FirebaseError") {
        errorMessage = "Error en la base de datos";
        errorDetails = "No se pudo guardar la información del usuario.";
    }

    // Mostrar error con Swal
    Swal.fire({
        icon: 'error',
        title: errorMessage,
        html: `
            <div class="error-container">
                <p class="error-details">${errorDetails}</p>
                <div class="error-code">
                    <small>Código de error: ${error.code || 'UNKNOWN'}</small>
                </div>
            </div>
        `,
        confirmButtonColor: '#dc3545',
        showConfirmButton: true,
        confirmButtonText: 'Entendido'
    });

    // Registrar error en consola con más detalles
    console.group('Detalles del error');
    console.error('Mensaje:', error.message);
    console.error('Código:', error.code);
    console.error('Stack:', error.stack);
    console.groupEnd();
  }
}

async function copiarCredenciales(email, password) {
  try {
    const texto = `Email: ${email}\nContraseña: ${password}`;
    await navigator.clipboard.writeText(texto);
    alert("Credenciales copiadas al portapapeles");
  } catch (err) {
    console.error("Error al copiar al portapapeles:", err);
    alert("Error al copiar las credenciales");
  }
}
