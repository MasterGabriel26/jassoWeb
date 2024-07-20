function MatrimonioModel() {
    var weddingData = {
        pareja: {
            nombreMarido: $('#nombreMarido').val(),
            descripcionMarido: $('#descripcionMarido').val(),
            fotoMarido: $('#fotoMarido').prop('files')[0], // Assumes you handle the file upload separately
            nombreMujer: $('#nombreMujer').val(),
            descripcionMujer: $('#descripcionMujer').val(),
            fotoMujer: $('#fotoMujer').prop('files')[0] // Assumes you handle the file upload separately
        },
        descripcionFelicidad: $('#descripcionFelicidad').val(),
        detallesEvento: {
            fechaEvento: $('#fechaEvento').val(),
            descripcionEvento: $('#descripcionEvento').val(),
            fotoLugar: $('#fotoLugar').prop('files')[0] // Assumes you handle the file upload separately
        },
        historia: {
            primerEncuentro: {
                descripcion: $('#primerEncuentro').val(),
                fecha: $('#fechaPrimerEncuentro').val(),
                foto: $('#fotoPrimerEncuentro').prop('files')[0] // Assumes you handle the file upload separately
            },
            primeraCita: {
                descripcion: $('#primeraCita').val(),
                fecha: $('#fechaPrimeraCita').val(),
                foto: $('#fotoPrimeraCita').prop('files')[0] // Assumes you handle the file upload separately
            },
            propuesta: {
                descripcion: $('#propuesta').val(),
                fecha: $('#fechaPropuesta').val(),
                foto: $('#fotoPropuesta').prop('files')[0] // Assumes you handle the file upload separately
            },
            compromiso: {
                descripcion: $('#compromiso').val(),
                fecha: $('#fechaCompromiso').val(),
                foto: $('#fotoCompromiso').prop('files')[0] // Assumes you handle the file upload separately
            }
        },
        galeriaFotos: Array.from($('#galeriaFotos').prop('files')), // Assumes you handle the file upload separately
        portadaFotos: Array.from($('#portadaFotos').prop('files')), // Assumes you handle the file upload separately
        padrinos: []
    };

    // Add padrinos
    $('.padrino').each(function(index) {
        var padrino = {
            nombre: $(this).find('input[name="nombrePadrino[]"]').val(),
            foto: $(this).find('input[name="fotoPadrino[]"]').prop('files')[0] // Assumes you handle the file upload separately
        };
        weddingData.padrinos.push(padrino);
    });

    // Add detalles del evento
    weddingData.detallesEvento.lugarEvento = $('#lugarEvento').val();
    weddingData.detallesEvento.horaCeremonia = $('#horaCeremonia').val();
    weddingData.detallesEvento.horaRecepcion = $('#horaRecepcion').val();
    weddingData.detallesEvento.redesSociales = {
        facebook: $('#facebookLugar').val(),
        instagram: $('#instagramLugar').val()
    };

    return weddingData;
}

// Example of how to use the function to get data
$('#weddingForm').on('submit', function(event) {
    event.preventDefault();
    var weddingData = getWeddingData();
    console.log(weddingData);
    // Here you would typically send `weddingData` to your Firestore database
});
