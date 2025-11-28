// backend/routes/auth.routes.js
const express = require("express");
const { google } = require("googleapis");
const { oauth2Client, hasGoogleTokens } = require("../config/googleClient");
const { db } = require("../config/db");

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5500/";

// ================================
// Estado de autenticación con Google
// ================================
router.get("/auth/status", (req, res) => {
  const authenticated = hasGoogleTokens();
  return res.json({ authenticated });
});

// ================================
// Iniciar conexión manualmente: /gmail/connect
// ================================
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

  return res.redirect(url);
});

// ================================
// Callback de Google OAuth
// ================================
router.get("/gmail/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Falta el parámetro 'code' en la URL.");
  }

  try {
    // Intercambiamos el code por tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Guardamos tokens en variables de entorno (simple para proyecto escolar)
    process.env.ACCESS_TOKEN = tokens.access_token || "";
    if (tokens.refresh_token) {
      process.env.REFRESH_TOKEN = tokens.refresh_token;
    }

    // Obtenemos el correo principal de la cuenta de Gmail
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const profileResponse = await gmail.users.getProfile({ userId: "me" });
    const primaryEmail = profileResponse.data.emailAddress;

    process.env.PRIMARY_EMAIL = primaryEmail;

    // Registramos (o aseguramos) el usuario en la BD
    db.prepare("INSERT OR IGNORE INTO users (email) VALUES (?)").run(primaryEmail);

    console.log("✅ Sesión iniciada con Google para:", primaryEmail);

    // Redirigimos de vuelta al front
    return res.redirect(FRONTEND_URL);
  } catch (err) {
    console.error("Error en /gmail/callback:", err);
    return res.status(500).send("Error al procesar la autenticación de Google.");
  }
});

// ================================
// LOGOUT
// ================================
router.get("/logout", (req, res) => {
  console.log("Cerrando sesión…");
  process.env.ACCESS_TOKEN = "";
  process.env.REFRESH_TOKEN = "";
  process.env.PRIMARY_EMAIL = "";
  oauth2Client.setCredentials({});

  return res.redirect("/gmail/connect");
});

module.exports = router;
