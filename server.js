// backend/server.js
require("dotenv").config();
const axios = require("axios");
const express = require("express");
const cors = require("cors");
const { authMiddleware } = require("./middlewares/auth");

const authRoutes = require("./routes/auth.routes");
const contactsRoutes = require("./routes/contacts.routes");
const gmailRoutes = require("./routes/gmail.routes");
const eventsRoutes = require("./routes/events.routes");
const aiRoutes = require("./routes/ai.routes");

const app = express();
const PORT = process.env.PORT || 3000;
const { db } = require("./config/db");

(() => {
  try {
    db.exec("DELETE FROM whatsapp_notifications;");
    console.log("Tabla whatsapp_notifications vaciada al iniciar el server.");
  } catch (err) {
    console.error("Error al vaciar whatsapp_notifications:", err);
  }
})();

app.use(
  cors({
    origin: "*",
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: "Content-Type, Authorization",
  })
);

app.use(express.json());

// Primero rutas públicas (login)
app.use(authRoutes);

// Después protegidas
app.use(authMiddleware);
app.use(contactsRoutes);
app.use(gmailRoutes);
app.use(eventsRoutes);
app.use(aiRoutes);

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});
