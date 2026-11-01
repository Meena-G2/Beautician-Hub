import api from "./api";

export const createReview = async (payload) => {
  const response = await api.post("/reviews", payload);
  return response.data;
};

// Beautician: reviews about me
export const getReceivedReviews = async () => {
  const response = await api.get("/reviews/received");
  return response.data;
};