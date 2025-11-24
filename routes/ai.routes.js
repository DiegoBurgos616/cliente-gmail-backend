// backend/routes/ai.routes.js
const express = require("express");
const axios = require("axios");

const router = express.Router();

router.post("/ai/format-email", async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Falta el texto del mensaje" });
    }

    const prompt = `
Eres un asistente que mejora correos electrónicos escritos en español.

Objetivo:
- Corrige ortografía y gramática.
- Mejora la redacción para que suene clara, profesional y amable.
- Mantén la intención original.
- No inventes información nueva.

Devuelve SOLO un JSON con exactamente esta forma:
{
  "subject": "...",
  "body": "..."
}

ASUNTO ORIGINAL:
${subject || "(sin asunto)"}

CUERPO ORIGINAL:
${message}
    `.trim();

    const aiRes = await axios.post(
      "https://api.openai.com/v1/responses",
      {
        model: "gpt-4o-mini",
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "email_format",
            schema: {
              type: "object",
              properties: {
                subject: { type: "string" },
                body: { type: "string" },
              },
              required: ["subject", "body"],
              additionalProperties: false,
            },
            strict: true,
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const content = aiRes.data.output?.[0]?.content?.[0];
    let formatted = { subject: subject || "", body: message };

    if (content?.json) {
      formatted = content.json;
    } else if (content?.text) {
      try {
        formatted = JSON.parse(content.text);
      } catch {
        formatted = { subject: subject || "", body: content.text };
      }
    }

    res.json({
      subject: formatted.subject || subject || "",
      body: formatted.body || message,
    });
  } catch (err) {
    console.error("Error en /ai/format-email:", err.response?.data || err);
    res.status(500).json({ error: "Error al formatear con IA" });
  }
});

module.exports = router;
