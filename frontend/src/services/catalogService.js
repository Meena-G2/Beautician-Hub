import api from "./api";

export const getCategories = async () => {
  const response = await api.get("/categories");
  return response.data;
};

export const getServices = async (params = {}) => {
  const response = await api.get("/services", { params });
  return response.data;
};

export const getServiceById = async (id) => {
  const response = await api.get(`/services/${id}`);
  return response.data;
};

export const getBeauticians = async (params = {}) => {
  const response = await api.get("/beauticians", { params });
  return response.data;
};

export const getBeauticianById = async (id) => {
  const response = await api.get(`/beauticians/${id}`);
  return response.data;
};