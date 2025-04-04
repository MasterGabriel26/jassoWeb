// server.js
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const { Twilio } = require("twilio");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Twilio config
const sid = process.env.TWILIO_SID;
const token = process.env.TWILIO_TOKEN;
const twilioNumber = process.env.TWILIO_NUMBER;
const client = new Twilio(sid, token);

// Conversaciones por llamada
const conversaciones = {}; // CallSid => mensajes

// 👉 Ruta para iniciar la llamada
app.post("/llamar", async (req, res) => {
  const { numero } = req.body;

  try {
    const call = await client.calls.create({
      to: numero,
      from: twilioNumber,
      url: "https://766c-2806-267-148a-1a1-f8a9-af20-8155-9bfd.ngrok-free.app/iniciar"
    });

    res.json({ message: `📞 Llamada iniciada a ${numero}`, sid: call.sid });
  } catch (err) {
    console.error("❌ Error en /llamar:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 👉 Ruta de inicio con mensaje fijo de prueba
app.post("/debug-twilio", (req, res) => {
  console.log("🧪 Twilio accedió a /debug-twilio correctamente");
  res.send(`
    <Response>
      <Say language="es-MX" voice="Polly.Miguel">Hola, soy una prueba de voz. ¿Me escuchas?</Say>
    </Response>
  `);
});

// 👉 Primer paso conversacional
app.post("/iniciar", async (req, res) => {
  console.log("✅ Twilio llegó a /iniciar");
  const prompt = require("./prompt.js");

  try {
    const chat = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }]
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
    });

    const primerMensaje = chat.data.choices[0].message.content.trim().substring(0, 400);
    const callSid = req.body.CallSid || "default";

    conversaciones[callSid] = [
      { role: "user", content: prompt },
      { role: "assistant", content: primerMensaje }
    ];

    res.send(`
      <Response>
        <Gather input="speech" timeout="5" action="/respuesta" method="POST">
          <Say voice="Polly.Miguel" language="es-MX">${primerMensaje}</Say>
        </Gather>
        <Say language="es-MX">Gracias por tu tiempo.</Say>
      </Response>
    `);
  } catch (err) {
    console.error("❌ Error en /iniciar:", err.message);
    res.send(`<Response><Say>Error inicializando llamada.</Say></Response>`);
  }
});

// 👉 Continuación conversacional
app.post("/respuesta", async (req, res) => {
  const speech = req.body.SpeechResult;
  const callSid = req.body.CallSid || "default";

  console.log("🗣 Cliente dijo:", speech);

  if (!speech || speech.trim() === "") {
    return res.send(`
      <Response>
        <Say language="es-MX">No escuché tu respuesta. ¿Puedes repetir?</Say>
        <Redirect method="POST">/iniciar</Redirect>
      </Response>
    `);
  }

  if (!conversaciones[callSid]) {
    conversaciones[callSid] = [];
  }

  conversaciones[callSid].push({ role: "user", content: speech });

  try {
    const chat = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4",
      messages: conversaciones[callSid]
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
    });

    const respuestaIA = chat.data.choices[0].message.content.trim().substring(0, 400);
    conversaciones[callSid].push({ role: "assistant", content: respuestaIA });

    if (/gracias|eso es todo|hasta luego/i.test(speech)) {
      return res.send(`
        <Response>
          <Say language="es-MX">Gracias por tu tiempo. ¡Hasta pronto!</Say>
        </Response>
      `);
    }

    res.send(`
      <Response>
        <Gather input="speech" timeout="5" action="/respuesta" method="POST">
          <Say voice="Polly.Miguel" language="es-MX">${respuestaIA}</Say>
        </Gather>
        <Say language="es-MX">Gracias por tu tiempo.</Say>
      </Response>
    `);
  } catch (err) {
    console.error("❌ Error en /respuesta:", err.message);
    res.send(`<Response><Say language="es-MX">Ocurrió un error. Gracias por tu tiempo.</Say></Response>`);
  }
});

app.listen(3000, () => {
  console.log("🟢 Servidor corriendo en http://localhost:3000");
});