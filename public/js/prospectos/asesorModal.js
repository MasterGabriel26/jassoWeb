async function cargarDatosAsesorModal(asesorId) {
  if (!asesorId) return;

  try {
      const asesorDoc = await db.collection("usuarios").doc(asesorId).get();
      if (asesorDoc.exists) {
          const asesorData = asesorDoc.data();
          const profileCard = document.querySelector('.asesor-profile-card');
          
          // Actualizar avatar
          const avatarElement = profileCard.querySelector('.profile-avatar');
          if (asesorData.imageProfile) {
              avatarElement.style.backgroundImage = `url(${asesorData.imageProfile})`;
              avatarElement.textContent = '';
          } else {
              const initials = asesorData.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase();
              avatarElement.textContent = initials;
              avatarElement.style.backgroundImage = '';
              avatarElement.style.background = `linear-gradient(45deg, #2d3456, #1e2330)`;
          }

          // Actualizar información
          profileCard.querySelector('.profile-name').textContent = asesorData.name;
          profileCard.querySelector('.profile-phone').textContent = asesorData.phone || 'Sin teléfono';
          
          // Actualizar estado online/offline
          const statusElement = profileCard.querySelector('.profile-status');
          statusElement.className = `profile-status ${asesorData.onLine ? 'online' : 'offline'}`;

          // Obtener estadísticas (ejemplo)
          const prospectosCount = await obtenerConteoProspectos(asesorId);
          const ventasCount = await obtenerConteoVentas(asesorId);

          
          
          profileCard.querySelector('.prospectos-count').textContent = prospectosCount;
          
          const ventasElement = profileCard.querySelector('.ventas-count');

          if (ventasElement) {
            ventasElement.textContent = ventasCount;
        } else {
            console.error('No se encontró el elemento .ventas-count');
        }

// Verificar los datos actualizados
console.log('Datos actualizados en la UI:', {
  prospectos: prospectosCount,
  ventas: ventasCount
});
          
      }
  } catch (error) {
      console.error("Error al cargar datos del asesor:", error);
  }
}

// Funciones auxiliares para obtener estadísticas
async function obtenerConteoProspectos(asesorId) {
  try {
      const snapshot = await db.collection("prospectos2")
          .where("asesor", "==", asesorId)
          .get();
      return snapshot.size;
  } catch (error) {
      console.error("Error al obtener conteo de prospectos:", error);
      return 0;
  }
}

async function obtenerConteoVentas(asesorId) {
  try {
      console.log('Buscando ventas para asesor:', asesorId);
      
      const snapshot = await db.collection("prospectos2")
          .where("asesor", "==", asesorId)
          .where("status", "==", "VENTA_CONFIRMADA")
          .get();

      console.log('Snapshot recibido:', snapshot);
      console.log('Número de documentos:', snapshot.size);
      
      // Veamos los documentos individualmente
      snapshot.forEach(doc => {
          console.log('Documento encontrado:', doc.id, doc.data());
      });

      return snapshot.size;
  } catch (error) {
      console.error("Error al obtener conteo de ventas:", error);
      console.error("Error completo:", error.message);
      return 0;
  }
}