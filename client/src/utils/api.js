import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the saved authentication token to requests.
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

// Handle expired or invalid sessions.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem("token");

      if (token) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Redirect only if the user is not already on an auth page.
        const isAuthPage = ["/login", "/register"].includes(
          window.location.pathname,
        );

        if (!isAuthPage) {
          window.location.replace("/login");
        }
      }
    }

    return Promise.reject(error);
  },
);

export default API;
