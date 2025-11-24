// backend/routes/events.routes.js
const express = require("express");
const { setCalendarCredentials } = require("../config/googleClient");

const router = express.Router();

// Listar próximas reuniones (hoy + 5 días)
router.get("/events", async (req, res) => {
  try {
    console.log(">>> Llamando /events (primary, hoy + próximos 5 días)");
    const calendar = setCalendarCredentials();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const timeMin = todayStart.toISOString();

    const fiveDaysLater = new Date(
      todayStart.getTime() + 5 * 24 * 60 * 60 * 1000
    );
    const timeMax = fiveDaysLater.toISOString();

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
    });

    const items = response.data.items || [];
    console.log("Eventos devueltos por Google:", items.length);

    const mapped = items.map((ev) => {
      const start = ev.start || {};
      let date = "";
      let time = "";

      if (start.dateTime) {
        const d = new Date(start.dateTime);
        date = d.toISOString().slice(0, 10);
        time = d.toTimeString().slice(0, 5);
      } else if (start.date) {
        date = start.date;
        time = "";
      }

      const attendees = ev.attendees || [];
      const participants = attendees
        .map((a) => a.email || a.displayName)
        .filter(Boolean)
        .join(", ");

      console.log(
        `  * ${ev.summary || "(Sin título)"} -> ${date} ${time || ""}`
      );

      return {
        id: ev.id,
        title: ev.summary || "(Sin título)",
        date,
        time,
        participants,
        notes: ev.description || "",
      };
    });

    mapped.sort((a, b) => {
      const tsA = new Date(`${a.date}T${a.time || "00:00"}:00`).getTime();
      const tsB = new Date(`${b.date}T${b.time || "00:00"}:00`).getTime();
      return tsA - tsB;
    });

    res.json(mapped);
  } catch (err) {
    console.error(
      "Error en GET /events (Calendar):",
      err.response?.data || err
    );
    res
      .status(500)
      .json({ error: "Error al obtener eventos de Google Calendar" });
  }
});

// Crear nueva reunión
router.post("/events", async (req, res) => {
  try {
    const calendar = setCalendarCredentials();
    const { title, date, time, participants, notes } = req.body;

    if (!title || !date || !time) {
      return res
        .status(400)
        .json({ error: "Título, fecha y hora son obligatorios" });
    }

    const [hour, minute] = time.split(":");
    const startDateTime = new Date(date);
    startDateTime.setHours(Number(hour), Number(minute), 0, 0);

    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    let attendees = [];
    if (participants && participants.trim()) {
      const tokens = participants.split(",").map((p) => p.trim());
      attendees = tokens
        .filter((t) => t.includes("@"))
        .map((email) => ({ email }));
    }

    const event = {
      summary: title,
      description: notes || "",
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: "America/Mexico_City",
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: "America/Mexico_City",
      },
      attendees,
    };

    const created = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    const ev = created.data;

    res.json({
      id: ev.id,
      title: ev.summary,
      date,
      time,
      participants,
      notes,
    });
  } catch (err) {
    console.error(
      "Error en POST /events (Calendar):",
      err.response?.data || err
    );
    res
      .status(500)
      .json({ error: "Error al crear evento en Google Calendar" });
  }
});

// Eliminar reunión
router.delete("/events/:id", async (req, res) => {
  try {
    const calendar = setCalendarCredentials();
    const eventId = req.params.id;

    await calendar.events.delete({
      calendarId: "primary",
      eventId,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(
      "Error en DELETE /events/:id (Calendar):",
      err.response?.data || err
    );
    res
      .status(500)
      .json({ error: "Error al eliminar evento en Google Calendar" });
  }
});

module.exports = router;
