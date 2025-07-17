import axios from "axios";
import { getCSRFToken } from "../utils/csrf";
import { API_BASE_URL } from "../utils/config"; // Asegúrate de importar API_BASE_URL correctamente

// Configuración de Axios con la URL dinámica
const API = axios.create({
  baseURL: API_BASE_URL, // Usa la variable de entorno correcta
  withCredentials: true, // Permite el envío de cookies
});

// Agregar automáticamente el CSRF Token y el JWT en cada petición
API.interceptors.request.use((config) => {
  const csrfToken = getCSRFToken();
  if (csrfToken) {
    config.headers["X-CSRFToken"] = csrfToken;
  }
  // Agregar el token JWT si existe
  const token = sessionStorage.getItem("access_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  // Normalizar URLs para asegurar consistencia
  if (config.url) {
    // Si la URL contiene un dominio completo, extraer solo la parte relativa
    if (config.url.includes("://")) {
      try {
        const urlObj = new URL(config.url);
        config.url = urlObj.pathname + urlObj.search;
      } catch (e) {
        // Si no se puede parsear, usar la URL tal como está
      }
    }
    
    // Remover cualquier duplicación de /api/ en la URL
    config.url = config.url.replace(/\/api\/facet\//, "/facet/");
    config.url = config.url.replace(/\/api\/login\//, "/login/");
    
    // Determinar si estamos en producción (docentes.facet.unt.edu.ar)
    const isProduction = API_BASE_URL.includes("docentes.facet.unt.edu.ar");
    
    // Asegurar que todas las URLs tengan el formato correcto según el entorno
    if (isProduction) {
      // En producción: TODAS las URLs necesitan /api/
      if (!API_BASE_URL.endsWith("/api")) {
        config.url = `/api${config.url}`;
        config.baseURL = API_BASE_URL.replace(/\/api\/?$/, "");
      } else {
        config.baseURL = API_BASE_URL;
      }
    } else {
      // En desarrollo: todas las URLs van directas sin /api/
      config.baseURL = API_BASE_URL.replace(/\/api\/?$/, "");
    }
  }

  return config;
});

export default API;
