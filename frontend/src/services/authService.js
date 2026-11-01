import api from "./api";

export const registerUser = async (data) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

export const loginUser = async (data) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const fetchMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put("/auth/me", data);
  return response.data;
};