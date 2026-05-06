import axiosInstance from "../lib/axios";

export const sessionApi = {
  createSession: async (data) => {
    const response = await axiosInstance.post("/sessions", data);
    return response.data;
  },

  getActiveSessions: async () => {
    const response = await axiosInstance.get("/sessions/active");
    return response.data;
  },
  getMyRecentSessions: async () => {
    const response = await axiosInstance.get("/sessions/my-recent");
    return response.data;
  },

  getSessionById: async (id) => {
    const response = await axiosInstance.get(`/sessions/${id}`);
    return response.data;
  },

  joinSession: async (id) => {
    const response = await axiosInstance.post(`/sessions/${id}/join`);
    return response.data;
  },
  endSession: async (id) => {
    const response = await axiosInstance.post(`/sessions/${id}/end`);
    return response.data;
  },
  getStreamToken: async () => {
    const response = await axiosInstance.get(`/chat/token`);
    return response.data;
  },

  // ── Private session API ──────────────────────────────────────────
  createPrivateSession: async (data) => {
    const response = await axiosInstance.post("/sessions/invite", data);
    return response.data;
  },
  joinByToken: async (token) => {
    const response = await axiosInstance.get(`/sessions/join-token/${token}`);
    return response.data;
  },
  submitFeedback: async ({ sessionId, ratings }) => {
    const response = await axiosInstance.post(`/sessions/${sessionId}/feedback`, ratings);
    return response.data;
  },
};
