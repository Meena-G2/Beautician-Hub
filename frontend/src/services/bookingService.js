import api from "./api";

// Free start times for one beautician, one service and one date
export const getSlots = async (beauticianId, date, serviceId) => {
  const response = await api.get(`/availability/${beauticianId}/slots`, {
    params: { date, serviceId },
  });
  return response.data;
};

export const createBooking = async (payload) => {
  const response = await api.post("/bookings", payload);
  return response.data;
};

// Customer: all of my bookings
export const getMyBookings = async () => {
  const response = await api.get("/bookings/my");
  return response.data;
};

// Beautician: booking requests and appointments for me
export const getBeauticianBookings = async () => {
  const response = await api.get("/bookings/beautician");
  return response.data;
};

// Customer or beautician: change a booking's status
export const updateBookingStatus = async (id, status) => {
  const response = await api.put(`/bookings/${id}/status`, { status });
  return response.data;
};