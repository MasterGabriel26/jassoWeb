

var apiKey = null;

const idApi = "nflQTde5Jbq8c7NqrrSC";

db.collection('APIS').doc(idApi).get().then(doc => {
    if (doc.exists) {  
        apiKey = doc.data().apikey;     
    } else {
        console.error('No API key found!');
        alertify.alert('Error', 'No API key found!');
    }
}).catch(error => {
    console.error('Error getting API key:', error);
    alertify.alert('Error', 'Error getting API key from Firestore.');
});

let targetTextareaId = null;

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.help-button').forEach(button => {
        button.addEventListener('click', function () {
            targetTextareaId = this.getAttribute('data-textarea');
            const textarea = document.getElementById(targetTextareaId);
            const inputValue = textarea.value.trim();

            if (inputValue === '') {
                alertify.alert('Error', 'Por favor, complete el campo antes de pedir ayuda.');
                return;
            }

            const nombreMarido = document.getElementById('nombreMarido').value.trim();
            const nombreMujer = document.getElementById('nombreMujer').value.trim();

            if ((targetTextareaId.includes('Marido') && nombreMarido === '') ||
                (targetTextareaId.includes('Mujer') && nombreMujer === '') ||
                (targetTextareaId === 'descripcionFelicidad' && (nombreMarido === '' || nombreMujer === ''))) {
                alertify.alert('Error', 'Por favor, asegúrese de que los nombres del marido y la mujer estén llenos.');
                return;
            }

            generateText(nombreMarido, nombreMujer, inputValue);
        });
    });

    document.getElementById('aprobar').addEventListener('click', approveText);
    document.getElementById('generar').addEventListener('click', function(event) {
        event.preventDefault();
        const nombreMarido = document.getElementById('nombreMarido').value.trim();
        const nombreMujer = document.getElementById('nombreMujer').value.trim();
        const textareaValue = document.getElementById(targetTextareaId).value.trim();
        generateText(nombreMarido, nombreMujer, textareaValue);
    });
});
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}
async function generateText(nombreMarido, nombreMujer, inputText) {
    const resultDiv = document.getElementById('generatedText');
    resultDiv.textContent = 'Generando texto...';

    if (!apiKey) {
        alertify.alert('Error', 'API key is not available.');
        resultDiv.textContent = 'Error: API key is not available.';
        return;
    }

    const context = getContextForTextarea(targetTextareaId, nombreMarido, nombreMujer, inputText);
    const lru = "https://api.openai.com/v1/chat/completions"
    var metodo = 'POST'
    const model = "gpt-3.5-turbo"
    try {
        const response = await fetch(lru, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un asistente que ayuda a generar textos realistas y emocionantes para presentaciones de tarjetas de invitación de bodas. No exageres ni uses fantasías. La narración debe ser en tercera persona. también tener en cuenta que la descripción o narración que hagas debe estar completa y no a medias.'
                    },
                    {
                        role: 'user',
                        content: `${context}`
                    }
                ],
                max_tokens: 100, // Incrementa el límite de tokens
            })
        });

        const data = await response.json();
        const generatedText = data.choices[0].message.content.trim();
        resultDiv.textContent = generatedText;
        
        $('#aiModal').modal('show');
    } catch (error) {
        resultDiv.textContent = 'Ocurrió un error al generar el texto.';
        console.error('Error:', error);
        alertify.alert('Error', 'Ocurrió un error al generar el texto.');
    }
}

function approveText() {
    if (targetTextareaId) {
        const textarea = document.getElementById(targetTextareaId);
        const generatedText = document.getElementById('generatedText').textContent;
        textarea.value = generatedText;
        autoResizeTextarea(textarea);
        $('#aiModal').modal('hide');
        alertify.success('Texto aprobado y guardado.');
    }
}

function copyText() {
    const text = document.getElementById('generatedText').textContent;
    navigator.clipboard.writeText(text).then(() => {
        alertify.success('Texto copiado al portapapeles');
    }).catch(err => {
        console.error('Error al copiar el texto: ', err);
        alertify.error('Error al copiar el texto');
    });
}

function getContextForTextarea(textareaId, nombreMarido, nombreMujer, inputText) {
    switch (textareaId) {
        case 'descripcionMarido':
            return `Escribe una descripción breve y emocionante sobre ${nombreMarido}. No es necesario que inicies con los nombres de ellos, sé creativo. No debe ser fantasiosa. Aquí está la entrada del usuario: ${inputText}. Asegúrate de que la descripción sea completa y concluyente.`;
        case 'descripcionMujer':
            return `Escribe una descripción breve y emocionante sobre ${nombreMujer}. No es necesario que inicies con los nombres de ellos, sé creativo. No debe ser fantasiosa. Aquí está la entrada del usuario: ${inputText}. Asegúrate de que la descripción sea completa y concluyente.`;
        case 'primerEncuentro':
            return `Describe brevemente cómo se conocieron ${nombreMarido} y ${nombreMujer}. No es necesario que inicies con los nombres de ellos, sé creativo. Debe ser realista y emocionante. Aquí está la entrada del usuario: ${inputText}. Asegúrate de que la descripción sea completa y concluyente.`;
        case 'primeraCita':
            return `Describe brevemente cómo fue la primera cita de ${nombreMarido} y ${nombreMujer}. No es necesario que inicies con los nombres de ellos, sé creativo. Debe ser realista y emocionante. Aquí está la entrada del usuario: ${inputText}. Asegúrate de que la descripción sea completa y concluyente.`;
        case 'propuesta':
            return `Describe brevemente cómo ${nombreMarido} le pidió matrimonio a ${nombreMujer}. No es necesario que inicies con los nombres de ellos, sé creativo. Debe ser realista y emocionante. Aquí está la entrada del usuario: ${inputText}. Asegúrate de que la descripción sea completa y concluyente.`;
        case 'compromiso':
            return `Describe brevemente cómo fue el compromiso de ${nombreMarido} y ${nombreMujer}. No es necesario que inicies con los nombres de ellos, sé creativo. Debe ser realista y emocionante. Aquí está la entrada del usuario: ${inputText}. Asegúrate de que la descripción sea completa y concluyente.`;
        case 'descripcionFelicidad':
            return `Describe brevemente la felicidad de ${nombreMarido} y ${nombreMujer} por su boda. Debe ser realista y emocionante. No es necesario que inicies con los nombres de ellos, sé creativo. Aquí está la entrada del usuario: ${inputText}. Asegúrate de que la descripción sea completa y concluyente.`;
        case 'descripcionEvento':
            return `Describe brevemente la La boda de ${nombreMarido} y ${nombreMujer} será un evento lleno de amor y felicidad, donde celebraremos nuestra unión con familiares y amigos queridos. Estamos emocionados de compartir este día especial con ustedes. Debe ser realista y emocionante. Ten en cuenta que el evento será futuró porque se va a realizar, sé creativo. Aquí está la entrada del usuario: ${inputText}. Asegúrate de que la descripción sea completa y concluyente.`;
           
            default:
            return `Escribe una breve descripción. Aquí está la entrada del usuario: ${inputText}. Asegúrate de que la descripción sea completa y concluyente. No es necesario que inicies con los nombres de ellos, sé creativo.`;
    }
}
