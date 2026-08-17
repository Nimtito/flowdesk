import axios from "axios";
import api from "./app";

const API_URL = import.meta.env.VITE_API_URL;

const authService = {
  // REGISTER
  async register(userData) {
    const response = await api.post(
      "/api/register/",
      userData
    );

    return response.data;
  },

  // LOGIN
  async login(username, password) {
    const response = await api.post(
      "/api/token/",
      {
        username,
        password,
      }
    );

    return response.data;
  },

  // REFRESH ACCESS TOKEN
  async refreshToken(refreshToken) {
    const response = await axios.post(
      `${API_URL}/api/token/refresh/`,
      {
        refresh: refreshToken,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  },

  // PROFILE
  async getProfile() {
    const response = await api.get(
      "/api/profile/"
    );

    return response.data;
  },
};

export default authService;