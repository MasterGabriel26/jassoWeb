const NodeCache = require('node-cache');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Instancia de caché en memoria
const cache = new NodeCache({ stdTTL: 300 }); // Datos en caché por 5 minutos (300s)

exports.generateOpenGraph = functions.https.onRequest(async (req, res) => {
  try {
    const postId = req.query.id;

    if (!postId) {
      console.error('ID del paquete no proporcionado');
      return res.status(400).send('ID del paquete es obligatorio');
    }

    // Intentar obtener del caché
    const cachedData = cache.get(postId);
    if (cachedData) {
      console.log('Datos obtenidos desde el caché:', postId);
      return res.send(cachedData);
    }

    // Consultar Firestore si no está en caché
    const doc = await admin.firestore().collection('publicaciones').doc(postId).get();
    if (!doc.exists) {
      console.error('Paquete no encontrado:', postId);
      return res.status(404).send('Paquete no encontrado');
    }

    const post = doc.data();
    const baseUrl = 'https://jassocompany.com';
    const imageUrl = post.multimediaUrl?.[0]?.startsWith('http')
      ? post.multimediaUrl[0]
      : `${baseUrl}/img/jasso_logo_app.jpeg`;

    // Generar HTML
    const html = `
      <!DOCTYPE html>
      <html prefix="og: https://ogp.me/ns#" lang="es">
      <head>
          <meta charset="UTF-8">
          <title>${post.tituloEvento || 'Paquete JASSO'}</title>
          <meta property="og:title" content="${post.tituloEvento || 'Paquete JASSO'}">
          <meta property="og:image" content="${imageUrl}">
      </head>
      <body>
          <h1>${post.tituloEvento || 'Paquete JASSO'}</h1>
          <img src="${imageUrl}" alt="${post.tituloEvento || 'Paquete JASSO'}">
      </body>
      </html>
    `;

    // Guardar en caché
    cache.set(postId, html);
    console.log('Datos almacenados en caché:', postId);

    // Enviar respuesta
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Content-Type': 'text/html; charset=UTF-8'
    });

    return res.send(html);

  } catch (error) {
    console.error('Error generando las etiquetas Open Graph:', error);
    return res.status(500).send('Error interno del servidor');
  }
});
