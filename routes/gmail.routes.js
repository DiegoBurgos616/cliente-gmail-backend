// backend/routes/gmail.routes.js
const express = require("express");
const { setGmailCredentials } = require("../config/googleClient");
const { db, getCurrentUserId } = require("../config/db");
const { sendProfessorWhatsappNotification } = require("../services/whatsappService");
const { getMessageBodies, extractEmail } = require("../utils/gmailUtils");

const router = express.Router();

// Listar mensajes
router.get("/gmail/messages", async (req, res) => {
  try {
    const gmail = setGmailCredentials();

    const label = req.query.label || "INBOX";
    const query = req.query.q || "";

    const listParams = {
      userId: "me",
      maxResults: 10,
    };

    if (query) listParams.q = query;

    if (label === "INBOX") {
      listParams.labelIds = ["INBOX", "IMPORTANT"];
    } else {
      listParams.labelIds = [label];
    }

    const listRes = await gmail.users.messages.list(listParams);
    const messages = listRes.data.messages || [];
    const result = [];

    const userId = getCurrentUserId();
    if (!userId) {
      console.warn("⚠️ Usuario actual no encontrado en BD al listar mensajes");
    }

    for (const m of messages) {
      const msgRes = await gmail.users.messages.get({
        userId: "me",
        id: m.id,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      });

      const headers = msgRes.data.payload.headers || [];
      const getHeader = (name) =>
        headers.find((h) => h.name === name)?.value || "";

      const fromHeader = getHeader("From");
      const subject = getHeader("Subject");
      const date = getHeader("Date");

      const item = {
        id: m.id,
        from: fromHeader,
        subject,
        date,
        snippet: msgRes.data.snippet || "",
      };

      result.push(item);

      // Lógica profesor + n8n
      if (userId) {
const senderEmail = extractEmail(fromHeader).toLowerCase();
        console.log("📨 Mensaje de:", senderEmail, "subject:", subject);

        const contact = db
          .prepare(
            "SELECT id, name, email, tag FROM contacts WHERE user_id = ? AND LOWER(email) = ? AND LOWER(tag) = 'profesor'"
          )
          .get(userId, senderEmail);

        if (contact) {
          console.log("👨‍🏫 Contacto profesor detectado en BD:", contact);

          const already = db
            .prepare(
              "SELECT 1 FROM whatsapp_notifications WHERE user_id = ? AND gmail_message_id = ?"
            )
            .get(userId, m.id);

          if (!already) {
            console.log(
              `🔔 Enviando notificación WhatsApp vía n8n para mensaje ${m.id}…`
            );

            await sendProfessorWhatsappNotification(
              contact.name,
              contact.email,
              subject
            );

            db.prepare(
              "INSERT INTO whatsapp_notifications (user_id, gmail_message_id) VALUES (?, ?)"
            ).run(userId, m.id);
          } else {
            console.log("ℹ️ Mensaje ya notificado anteriormente, se omite:", m.id);
          }
        }
      }
    }

    res.json(result);
  } catch (err) {
    console.error("Error en /gmail/messages:", err.response?.data || err);
    res.status(500).send("Error al obtener mensajes");
  }
});

// Obtener mensaje por ID
router.get("/gmail/messages/:id", async (req, res) => {
  try {
    const gmail = setGmailCredentials();

    const msgRes = await gmail.users.messages.get({
      userId: "me",
      id: req.params.id,
      format: "full",
    });

    const data = msgRes.data;
    const headers = data.payload.headers || [];
    const getHeader = (name) =>
      headers.find((h) => h.name === name)?.value || "";

    const { text, html } = getMessageBodies(data.payload);

    res.json({
      id: data.id,
      from: getHeader("From"),
      subject: getHeader("Subject"),
      date: getHeader("Date"),
      snippet: data.snippet || "",
      body: text,
      bodyHtml: html,
    });
  } catch (err) {
    console.error("Error en /gmail/messages/:id", err);
    res.status(500).send("Error al obtener mensaje");
  }
});

// Enviar correo
function encodeSubjectUtf8(subject = "") {
  const base64 = Buffer.from(subject, "utf8").toString("base64");
  return `=?UTF-8?B?${base64}?=`;
}

router.post("/gmail/send", async (req, res) => {
  try {
    const gmail = setGmailCredentials();

    const { to, subject, message } = req.body;

    const encodedSubject = encodeSubjectUtf8(subject || "");

    const rawLines = [
      "MIME-Version: 1.0",
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: 8bit",
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      "",
      message,
    ];

    const raw = Buffer.from(rawLines.join("\r\n"))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });

    res.json({ status: "Correo enviado correctamente" });
  } catch (err) {
    console.error("Error en /gmail/send:", err.response?.data || err);
    res.status(500).send("Error al enviar correo");
  }
});

module.exports = router;
