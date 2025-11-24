// backend/routes/auth.routes.js
const express = require("express");
const { google } = require("googleapis");
const { oauth2Client } = require("../config/googleClient");
const { db } = require("../config/db");

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5500";

// Iniciar conexión manualmente: /gmail/connect
router.get("/gmail/connect", (req, res) => {
  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/calendar",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });

  res.redirect(url);
});

// Callback de Google
router.get("/gmail/callback", async (req, res) => {
  try {
    const code = req.query.code;
    const { tokens } = await oauth2Client.getToken(code);
    console.log("TOKENS OBTENIDOS:", tokens);

    process.env.ACCESS_TOKEN = tokens.access_token || "";
    process.env.REFRESH_TOKEN = tokens.refresh_token || "";

    oauth2Client.setCredentials(tokens);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: "me" });
    const emailAddress = profile.data.emailAddress;
    console.log("Cuenta principal de Gmail:", emailAddress);

    process.env.PRIMARY_EMAIL = emailAddress;

    db.prepare(
      "INSERT INTO users (email) VALUES (?) ON CONFLICT(email) DO NOTHING"
    ).run(emailAddress);

    // Redirigimos al frontend (no al backend raíz)
    return res.redirect(FRONTEND_URL);
  } catch (err) {
    console.error("Error en /gmail/callback", err);
    res.status(500).send("Error al conectar con Gmail/Calendar");
  }
});

// LOGOUT
router.get("/logout", (req, res) => {
  console.log("Cerrando sesión…");
  process.env.ACCESS_TOKEN = "";
  process.env.REFRESH_TOKEN = "";
  process.env.PRIMARY_EMAIL = "";
  oauth2Client.setCredentials({});

  return res.redirect("/gmail/connect");
});

module.exports = router;

