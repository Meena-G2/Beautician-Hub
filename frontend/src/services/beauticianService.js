import api from "./api";

// ----- Profile -----
export const getMyProfile = async () => {
  const response = await api.get("/beauticians/me/profile");
  return response.data;
};

export const saveMyProfile = async (payload) => {
  const response = await api.put("/beauticians/me/profile", payload);
  return response.data;
};

// ----- Services -----
export const getMyServices = async () => {
  const response = await api.get("/services/mine");
  return response.data;
};

export const createService = async (payload) => {
  const response = await api.post("/services", payload);
  return response.data;
};

export const updateService = async (id, payload) => {
  const response = await api.put(`/services/${id}`, payload);
  return response.data;
};

export const deleteService = async (id) => {
  const response = await api.delete(`/services/${id}`);
  return response.data;
};

// ----- Weekly working hours -----
export const getMyAvailability = async () => {
  const response = await api.get("/availability/me");
  return response.data;
};

export const saveMyAvailability = async (schedule) => {
  const response = await api.put("/availability/me", { schedule });
  return response.data;
};