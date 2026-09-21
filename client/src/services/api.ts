import axios from "axios";

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return "http://localhost:5000/api";
  const cleanUrl = envUrl.replace(/\/+$/, "");
  return cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    // Prevent double /api prefix if service passed /api/...
    if (config.url && config.url.startsWith("/api/")) {
      config.url = config.url.substring(4);
    } else if (config.url === "/api") {
      config.url = "/";
    }

    const token =
      localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  }
);

export default api;