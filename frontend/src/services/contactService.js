import api from "./api";

// Public: send a message from the Contact page
export const sendMessage = async (payload) => {
  const response = await api.post("/contact", payload);
  return response.data;
};

// Admin: read and manage messages
export const getMessages = async () => {
  const response = await api.get("/contact");
  return response.data;
};

export const setMessageRead = async (id, isRead) => {
  const response = await api.put(`/contact/${id}/read`, { isRead });
  return response.data;
};

export const deleteMessage = async (id) => {
  const response = await api.delete(`/contact/${id}`);
  return response.data;
};