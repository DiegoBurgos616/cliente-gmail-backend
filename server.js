// backend/server.js
require("dotenv").config();
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

app.use(express.json());

// CORS para que el frontend desde otro puerto pueda acceder
app.use(
  cors({
    origin: "*",
  })
);

app.use(authRoutes);
app.use(authMiddleware);
app.use(contactsRoutes);
app.use(gmailRoutes);
app.use(eventsRoutes);
app.use(aiRoutes);

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});
