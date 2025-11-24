// backend/utils/gmailUtils.js

// Decodifica base64 "url-safe" de Gmail
function decodeGmailBase64(data = "") {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

// Quita solo cosas peligrosas (style, script), pero deja el resto del HTML
function stripHtmlDangerousTags(html = "") {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "");
}

// Extrae CUERPO en dos versiones: texto plano y HTML
function getMessageBodies(payload) {
  let text = "";
  let html = "";

  function walk(part) {
    if (!part) return;

    const mime = part.mimeType || "";
    const bodyData = part.body && part.body.data ? part.body.data : null;

    if (bodyData) {
      if (mime === "text/plain" && !text) {
        text = decodeGmailBase64(bodyData);
      } else if (mime === "text/html" && !html) {
        const rawHtml = decodeGmailBase64(bodyData);
        html = stripHtmlDangerousTags(rawHtml);
      }
    }

    if (part.parts && part.parts.length) {
      for (const p of part.parts) walk(p);
    }
  }

  walk(payload);

  return {
    text: (text || "").trim(),
    html: (html || "").trim(),
  };
}

// Helper para sacar solo el correo del header From
function extractEmail(fromHeader = "") {
  const match = fromHeader.match(/<([^>]+)>/);
  if (match) return match[1].toLowerCase().trim();
  return fromHeader.toLowerCase().trim();
}

module.exports = {
  decodeGmailBase64,
  stripHtmlDangerousTags,
  getMessageBodies,
  extractEmail,
};
