import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "https://splitmate-0a2j.onrender.com/api";

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");

      const isAuthPage = ["/login", "/register"].includes(
        window.location.pathname,
      );

      if (!isAuthPage) {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  },
);

export default API;
