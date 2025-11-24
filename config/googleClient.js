// backend/config/googleClient.js
const { google } = require("googleapis");

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  ACCESS_TOKEN,
  REFRESH_TOKEN,
} = process.env;

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// Si ya hay tokens al iniciar, los usamos
if (ACCESS_TOKEN && REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    access_token: ACCESS_TOKEN,
    refresh_token: REFRESH_TOKEN,
  });
}

function setGmailCredentials() {
  oauth2Client.setCredentials({
    access_token: process.env.ACCESS_TOKEN,
    refresh_token: process.env.REFRESH_TOKEN,
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

function setCalendarCredentials() {
  oauth2Client.setCredentials({
    access_token: process.env.ACCESS_TOKEN,
    refresh_token: process.env.REFRESH_TOKEN,
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

function hasGoogleTokens() {
  return (
    process.env.ACCESS_TOKEN &&
    process.env.REFRESH_TOKEN &&
    process.env.ACCESS_TOKEN.trim() !== "" &&
    process.env.REFRESH_TOKEN.trim() !== ""
  );
}

module.exports = {
  oauth2Client,
  setGmailCredentials,
  setCalendarCredentials,
  hasGoogleTokens,
};
