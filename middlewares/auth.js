// backend/middlewares/auth.js
const { hasGoogleTokens } = require("../config/googleClient");

function authMiddleware(req, res, next) {
  // Dejamos /gmail/connect y /gmail/callback como rutas públicas
  if (req.path.startsWith("/gmail/connect") || req.path.startsWith("/gmail/callback")) {
    return next();
  }

  if (!hasGoogleTokens()) {
    console.log("Usuario sin sesión. Redirigiendo a /gmail/connect desde", req.path);
    return res.redirect("/gmail/connect");
  }

  next();
}

module.exports = { authMiddleware };
