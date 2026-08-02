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

// Refresco de token single-flight: si varias peticiones reciben 401 a la vez,
// solo se dispara un refresh y las demás esperan el resultado
let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refresh = sessionStorage.getItem("refresh_token");
      if (!refresh) return null;
      try {
        const { data } = await API.post(`/login/token/refresh/`, { refresh });
        sessionStorage.setItem("access_token", data.access);
        if (data.refresh) {
          sessionStorage.setItem("refresh_token", data.refresh);
        }
        return data.access as string;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
};

const clearSessionAndRedirect = () => {
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("refresh_token");
  sessionStorage.removeItem("user_email");
  sessionStorage.removeItem("user_name");
  sessionStorage.removeItem("user_rol");
  if (
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/login")
  ) {
    window.location.href = "/login";
  }
};

// Manejo de sesión expirada: ante un 401 intenta refrescar el token una vez
// y reintenta la petición; si no se puede, cierra sesión y redirige al login
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthEndpoint = original?.url?.includes("/login/token/");

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isAuthEndpoint &&
      typeof window !== "undefined" &&
      sessionStorage.getItem("access_token")
    ) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers["Authorization"] = `Bearer ${newToken}`;
        return API(original);
      }
      clearSessionAndRedirect();
    }

    return Promise.reject(error);
  }
);

export default API;
