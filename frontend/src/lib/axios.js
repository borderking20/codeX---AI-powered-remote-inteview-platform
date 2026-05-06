import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // by adding this field browser will send the cookies to server automatically, on every single req
});

// Add interceptor to inject Clerk JWT token because cross-site cookies are blocked in production
axiosInstance.interceptors.request.use(async (config) => {
  if (window.Clerk && window.Clerk.session) {
    const token = await window.Clerk.session.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default axiosInstance;
