import api from "./api";

export const createPaymentOrder = async (bookingId) => {
  const response = await api.post("/payments/order", { bookingId });
  return response.data;
};

export const verifyPayment = async (payload) => {
  const response = await api.post("/payments/verify", payload);
  return response.data;
};

export const syncPayment = async (bookingId) => {
  const response = await api.post(`/payments/${bookingId}/sync`);
  return response.data;
};

export const markCashReceived = async (bookingId) => {
  const response = await api.put(`/payments/${bookingId}/cash`);
  return response.data;
};