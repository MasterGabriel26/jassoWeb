const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.dynamicOG = functions.https.onRequest(async (req, res) => {
  const postId = req.query.id;
  
  if (!postId) {
    res.status(400).send('Missing post ID');
    return;
  }

  try {
    const doc = await admin.firestore().collection('publicaciones').doc(postId).get();
    
    if (!doc.exists) {
      res.status(404).send('Post not found');
      return;
    }

    const post = doc.data();
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta property="og:title" content="${post.tituloEvento} | Paquetes JASSO">
          <meta property="og:description" content="${post.descripcion.substring(0, 100)}...">
          <meta property="og:image" content="${post.multimediaUrl[0]}">
          <meta property="og:url" content="https://jassocompany.com/paquete-detalle.html?id=${postId}">
          <meta property="og:type" content="website">
          <meta property="og:site_name" content="JASSO">
          <meta property="og:image:width" content="600">
          <meta property="og:image:height" content="315">
          <title>${post.tituloEvento} | JASSO</title>
          <script>window.location.href = "/paquete-detalle.html?id=${postId}";</script>
      </head>
      <body>
          <p>Redirigiendo...</p>
      </body>
      </html>
    `;
    
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    res.send(html);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});