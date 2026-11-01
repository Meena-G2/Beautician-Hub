import axios from "axios";

// Key used to keep the login token in the browser
export const TOKEN_KEY = "bh_token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Attach the token (if there is one) to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Turn any error into one readable message
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.request) return "Cannot reach the server. Please check your connection and try again.";
  return error.message || "Something went wrong";
};

export default api;