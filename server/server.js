const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session"); // Importar express-session
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configurar sesiones
app.use(
  session({
    secret: process.env.SECRET, // Cambia esto por una cadena segura
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Usa `true` si estás en HTTPS
  })
);

// Servir los archivos estáticos (HTML, CSS, JS) desde la carpeta 'public'
app.use(express.static(path.join(__dirname, "../public")));

// Función para renovar el access_token. Devuelve true/false según el resultado,
// para que cada ruta decida cómo reaccionar (en vez de asumir que siempre funcionó).
async function refreshAccessToken(req) {
  try {
    const response = await axios.post("https://www.strava.com/oauth/token", {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      refresh_token: req.session.refreshToken,
      grant_type: "refresh_token",
    });
    req.session.accessToken = response.data.access_token;
    req.session.refreshToken = response.data.refresh_token; // Actualiza el refresh_token si es necesario
    return true;
  } catch (error) {
    console.error("Error al renovar el token de acceso:", error);
    return false;
  }
}

// Ruta para iniciar el proceso de autenticación con Strava
app.get("/auth/strava", (req, res) => {
<<<<<<< HEAD
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&redirect_uri=${process.env.REDIRECT_URI}&scope=read,activity:read_all,profile:read_all`;
=======
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&redirect_uri=${process.env.REDIRECT_URI}&scope=read_all,activity:read_all,profile:read_all`;
>>>>>>> 04b2dda59d24423eedc9d3dc2621a0a9137fe6c2
  res.redirect(authUrl);
});

// Ruta de callback donde Strava redirige después de la autenticación
app.get("/auth/callback", async (req, res) => {
  const code = req.query.code;
  try {
    // Intercambiar el código por un token de acceso
    const tokenResponse = await axios.post(
      "https://www.strava.com/oauth/token",
      {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code: code,
        grant_type: "authorization_code",
      }
    );
    req.session.accessToken = tokenResponse.data.access_token;
    req.session.refreshToken = tokenResponse.data.refresh_token; // Guarda el refresh_token en la sesión

    // Redirigir al cliente con la información del usuario y los segmentos favoritos
    res.redirect(`/segments.html`);
  } catch (error) {
    console.error("Error al obtener el token de acceso:", error);
    res.status(500).send("Error autenticando con Strava.");
  }
});

// Ruta para obtener la información del usuario
app.get("/api/userinfo", async (req, res) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: "Usuario no autenticado" });
  }

  try {
    // Solicitud para obtener la información del usuario
    const userInfoResponse = await axios.get(
      "https://www.strava.com/api/v3/athlete",
      {
        headers: {
          Authorization: `Bearer ${req.session.accessToken}`,
        },
      }
    );

    // Enviar los datos al frontend
    res.json(userInfoResponse.data);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // Token expirado: intentamos renovarlo y reintentamos la misma
      // petición aquí mismo (sin redirigir, para no depender de
      // variables que ya no existen ni arriesgar un bucle de redirects).
      const renovado = await refreshAccessToken(req);
      if (!renovado) {
        return res.status(401).json({ error: "Sesión expirada, vuelve a iniciar sesión" });
      }
      try {
        const retryResponse = await axios.get(
          "https://www.strava.com/api/v3/athlete",
          { headers: { Authorization: `Bearer ${req.session.accessToken}` } }
        );
        return res.json(retryResponse.data);
      } catch (retryError) {
        return res.status(401).json({ error: "Sesión expirada, vuelve a iniciar sesión" });
      }
    }
    res.status(500).json({ error: "Error al obtener la información" });
  }
});

// Ruta para obtener los segmentos favoritos del usuario
app.get("/api/userSegmentsStarred", async (req, res) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: "Usuario no autenticado" });
  }

  try {
    const { page, per_page } = req.query;

    // Solicitud para obtener los segmentos favoritos
    const starredSegmentsResponse = await axios.get(
      `https://www.strava.com/api/v3/segments/starred?page=${page}&per_page=${per_page}`,
      {
        headers: {
          Authorization: `Bearer ${req.session.accessToken}`,
        },
      }
    );

    // Enviar los datos al frontend
    res.json(starredSegmentsResponse.data);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la información" });
  }
});

// Ruta para obtener información de un segmento específico
app.get("/api/segmentInfo", async (req, res) => {
  if (!req.session.accessToken) {
    return res
      .status(401)
      .json({ status_code: 401, error: "Usuario no autenticado" });
  }

  // `id` se saca del query ANTES del try/catch para que esté disponible
  // también dentro del catch (ver explicación del bug más abajo).
  const { id } = req.query;

  try {
    // Solicitud para obtener la información del segmento
    const oneStarredSegmentResponse = await axios.get(
      `https://www.strava.com/api/v3/segments/${id}`,
      {
        headers: {
          Authorization: `Bearer ${req.session.accessToken}`,
        },
      }
    );

    // Enviar los datos al frontend
    res.json(oneStarredSegmentResponse.data);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // Token expirado: renovamos y reintentamos la misma petición aquí
      // mismo, en vez de redirigir al cliente (evita el ReferenceError
      // de `id` y un posible bucle de redirects).
      const renovado = await refreshAccessToken(req);
      if (!renovado) {
        return res
          .status(401)
          .json({ status_code: 401, error: "Sesión expirada, vuelve a iniciar sesión" });
      }
      try {
        const retryResponse = await axios.get(
          `https://www.strava.com/api/v3/segments/${id}`,
          { headers: { Authorization: `Bearer ${req.session.accessToken}` } }
        );
        return res.json(retryResponse.data);
      } catch (retryError) {
        return res
          .status(401)
          .json({ status_code: 401, error: "Sesión expirada, vuelve a iniciar sesión" });
      }
    }
    res.status(500).json({ error: "Error al obtener la información" });
  }
});

// Ruta para obtener el perfil de elevación real del segmento (distancia + altitud)
// usado para dibujar el gráfico interactivo en el frontend.
app.get("/api/segmentStreams", async (req, res) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: "Usuario no autenticado" });
  }

  const { id } = req.query;

  try {
    const streamsResponse = await axios.get(
      `https://www.strava.com/api/v3/segments/${id}/streams`,
      {
        params: { keys: "distance,altitude", key_by_type: true },
        headers: { Authorization: `Bearer ${req.session.accessToken}` },
      }
    );
    res.json(streamsResponse.data);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      const renovado = await refreshAccessToken(req);
      if (!renovado) {
        return res.status(401).json({ error: "Sesión expirada, vuelve a iniciar sesión" });
      }
      try {
        const retryResponse = await axios.get(
          `https://www.strava.com/api/v3/segments/${id}/streams`,
          {
            params: { keys: "distance,altitude", key_by_type: true },
            headers: { Authorization: `Bearer ${req.session.accessToken}` },
          }
        );
        return res.json(retryResponse.data);
      } catch (retryError) {
        return res.status(401).json({ error: "Sesión expirada, vuelve a iniciar sesión" });
      }
    }
    res.status(500).json({ error: "Error al obtener el perfil de elevación" });
  }
});

// Ruta para cerrar sesión
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error al cerrar sesión:", err);
    }
    // Limpia la cookie
    res.clearCookie("connect.sid");

     // Redirigir primero al logout de Strava
     //res.redirect('https://www.strava.com/logout');

     setTimeout(() => {
       // Luego redirigir a la página de inicio
       res.redirect("/index.html");
     }, 3000); // Esperar 1 segundo antes de redirigir a la página de inicio
 
  });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

app.get("/ping", (req, res) => {
  res.send("OK");
});
