import axios from "axios";

// Using Vite's env vars
const API_URL = `${import.meta.env.VITE_API_URL}/mock-interview`; 

export const startMockInterview = async (formData, token) => {
  return await axios.post(`${API_URL}/start`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getNextQuestion = async (interviewId, token) => {
  return await axios.post(`${API_URL}/${interviewId}/next`, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const submitAnswer = async (interviewId, answer, code, token) => {
  return await axios.post(`${API_URL}/${interviewId}/answer`, { answer, code }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const endInterview = async (interviewId, token) => {
  return await axios.post(`${API_URL}/${interviewId}/end`, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getInterviewHistory = async (token) => {
  return await axios.get(`${API_URL}/history`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getInterviewById = async (interviewId, token) => {
  return await axios.get(`${API_URL}/${interviewId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
