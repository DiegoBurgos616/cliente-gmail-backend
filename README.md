# GoMail – Backend

## Descripción
Este proyecto es el **backend** de un cliente de correo escolar integrado con **Gmail** y **Google Calendar**.

Se encarga de:
- Conectarse a Gmail mediante **OAuth2** (Google APIs).
- Leer correos (Inbox, Sent, filtros por búsqueda).
- Enviar correos desde la cuenta conectada.
- Guardar contactos en una base de datos local (**SQLite**).
- Consultar eventos próximos de Google Calendar.
- Exponer endpoints para que el **frontend** pueda consumir toda la información.

---

## 👨‍💻 Authors
1. Patricio Peña  
2. Wilbert Manzur  
3. Martin Cuevas  
4. Diego Burgos  

---

## 📌 Project Setup (Backend)

### 1️⃣ Clonar el repositorio

Abre una terminal y ve a la carpeta donde quieres guardar el proyecto:

```sh
cd /ruta/donde/quieras/guardar
Clona el repositorio del backend:

sh

git clone https://github.com/DiegoBurgos616/cliente-gmail-backend.git
cd cliente-gmail-backend
2️⃣ Instalar dependencias
Asegúrate de tener Node.js instalado (versión 18+ recomendada).
Luego ejecuta:

sh

npm install
Esto instalará, entre otros:

express

googleapis

better-sqlite3

axios

cors

dotenv

nodemon

3️⃣ Configurar variables de entorno
Crea un archivo .env en la raíz del backend (misma carpeta donde está server.js):

sh

touch .env
Ejemplo de contenido mínimo:

env

# Puerto donde correrá el backend
PORT=3000

# URL donde corre el frontend (para redirecciones después del login)
FRONTEND_URL=http://localhost:5500

# Credenciales OAuth2 de Google (Proyecto de Google Cloud)
GOOGLE_CLIENT_ID=TU_CLIENT_ID
GOOGLE_CLIENT_SECRET=TU_CLIENT_SECRET
GOOGLE_REDIRECT_URI=http://localhost:3000/gmail/callback

# Correo principal que usará el cliente
PRIMARY_EMAIL=tu-correo@gmail.com

# Tokens (opcionalmente se pueden rellenar manualmente si ya los tienes)
ACCESS_TOKEN=
REFRESH_TOKEN=
📝 Importante:

GOOGLE_REDIRECT_URI debe coincidir exactamente con la URL configurada en la consola de Google Cloud.

El proyecto de Google debe tener habilitadas las APIs de Gmail y Google Calendar.

La base de datos app.db se creará automáticamente al ejecutar el servidor (usando better-sqlite3).

4️⃣ Ejecutar el backend en local
Dentro de la carpeta del backend:

sh

node server.js
Si todo sale bien, verás algo similar en la terminal:

sh

Servidor escuchando en http://localhost:3000
También puedes usar nodemon para desarrollo:

sh

npx nodemon server.js
5️⃣ Flujo básico de uso (Backend)
Levanta el backend con node server.js.

Desde el navegador o el frontend, se llamará a la ruta:

txt

http://localhost:3000/gmail/connect
para iniciar sesión con Google (OAuth).

Una vez completado el login, el backend obtiene los tokens de acceso.

A partir de ahí se pueden usar los endpoints:

GET /gmail/messages → listar correos.

GET /gmail/messages/:id → detalle de un correo.

POST /gmail/send → enviar un correo.

GET /contacts / POST /contacts → contactos.

GET /events → eventos de Google Calendar.

El frontend consume estos endpoints para mostrar la información en la interfaz.
