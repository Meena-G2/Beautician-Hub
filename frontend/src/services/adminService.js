import api from "./api";

// ----- Dashboard numbers -----
export const getStats = async () => {
  const response = await api.get("/admin/stats");
  return response.data;
};

// ----- Beautician profile approvals -----
export const getProfiles = async () => {
  const response = await api.get("/beauticians/admin/all");
  return response.data;
};

export const setApproval = async (userId, status) => {
  const response = await api.put(`/beauticians/${userId}/approval`, { status });
  return response.data;
};

// ----- Users -----
export const getUsers = async (params = {}) => {
  const response = await api.get("/admin/users", { params });
  return response.data;
};

export const setUserStatus = async (id, status) => {
  const response = await api.put(`/admin/users/${id}/status`, { status });
  return response.data;
};

// ----- Categories -----
export const getAllCategories = async () => {
  const response = await api.get("/categories/admin/all");
  return response.data;
};

export const createCategory = async (payload) => {
  const response = await api.post("/categories", payload);
  return response.data;
};

export const updateCategory = async (id, payload) => {
  const response = await api.put(`/categories/${id}`, payload);
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
};

// ----- Monitoring -----
export const getAdminBookings = async (params = {}) => {
  const response = await api.get("/admin/bookings", { params });
  return response.data;
};

export const getAdminServices = async () => {
  const response = await api.get("/admin/services");
  return response.data;
};

export const suspendService = async (id, isSuspended) => {
  const response = await api.put(`/services/${id}/suspend`, { isSuspended });
  return response.data;
};

export const getAdminReviews = async () => {
  const response = await api.get("/admin/reviews");
  return response.data;
};

export const deleteReview = async (id) => {
  const response = await api.delete(`/admin/reviews/${id}`);
  return response.data;
};