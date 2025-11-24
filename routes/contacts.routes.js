// backend/routes/contacts.routes.js
const express = require("express");
const { db, getCurrentUserId } = require("../config/db");

const router = express.Router();

// Listar contactos del usuario actual
router.get("/contacts", (req, res) => {
  const userId = getCurrentUserId();
  if (!userId) {
    return res
      .status(500)
      .json({ error: "Usuario actual no encontrado en la base de datos" });
  }

  const rows = db
    .prepare(
      "SELECT id, name, email, tag FROM contacts WHERE user_id = ? ORDER BY id DESC"
    )
    .all(userId);

  console.log("GET /contacts, total:", rows.length);
  res.json(rows);
});

// Crear nuevo contacto
router.post("/contacts", (req, res) => {
  const { name, email, tag } = req.body;

  if (!name || !email) {
    return res
      .status(400)
      .json({ error: "Nombre y correo son obligatorios" });
  }

  const userId = getCurrentUserId();
  if (!userId) {
    return res
      .status(500)
      .json({ error: "Usuario actual no encontrado en la base de datos" });
  }

  const result = db
    .prepare(
      "INSERT INTO contacts (user_id, name, email, tag) VALUES (?, ?, ?, ?)"
    )
    .run(userId, name, email, tag || "");

  const contact = {
    id: result.lastInsertRowid,
    name,
    email,
    tag: tag || "",
  };

  console.log("Contacto agregado:", contact);
  res.json(contact);
});

// Eliminar contacto
router.delete("/contacts/:id", (req, res) => {
  const userId = getCurrentUserId();
  if (!userId) {
    return res
      .status(500)
      .json({ error: "Usuario actual no encontrado en la base de datos" });
  }

  const id = Number(req.params.id);

  const info = db
    .prepare("DELETE FROM contacts WHERE id = ? AND user_id = ?")
    .run(id, userId);

  if (info.changes === 0) {
    console.log(
      "Intento de borrar contacto inexistente o de otro usuario:",
      id
    );
    return res.status(404).json({ error: "Contacto no encontrado" });
  }

  console.log("Contacto eliminado, id:", id);
  res.json({ ok: true });
});

module.exports = router;
