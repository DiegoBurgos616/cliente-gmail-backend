// backend/services/whatsappService.js
const axios = require("axios");

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const STUDENT_PHONE = process.env.STUDENT_PHONE;

async function sendProfessorWhatsappNotification(profName, profEmail, subject) {
  if (!N8N_WEBHOOK_URL || !STUDENT_PHONE) {
    console.warn("N8N_WEBHOOK_URL o STUDENT_PHONE no configurados, se omite envío.");
    return;
  }

  const payload = {
    prof_name: profName || "",
    prof_email: profEmail,
    subject: subject || "",
    student_phone: STUDENT_PHONE,
  };

  try {
    const resp = await axios.post(N8N_WEBHOOK_URL, payload, {
      headers: { "Content-Type": "application/json" },
    });

    console.log("Webhook enviado correctamente a n8n:", resp.status);
  } catch (err) {
    console.error("Error al llamar webhook de n8n:", err.response?.data || err.message);
  }
}

module.exports = { sendProfessorWhatsappNotification };
