import api from "./api";

const authService = {
  async register(userData) {
    try {
      const response = await api.post("/register/", userData);
      return response.data;
    } catch (error) {
      console.error(
        "Registration failed:",
        error.response?.status,
        error.response?.data || error.message
      );
      throw error;
    }
  },

  async login(username, password) {
    try {
      const response = await api.post("/token/", {
        username,
        password,
      });

      console.log("Login response received:", {
        status: response.status,
        hasAccessToken: Boolean(response.data?.access),
        hasRefreshToken: Boolean(response.data?.refresh),
      });

      return response.data;
    } catch (error) {
      console.error(
        "Login failed:",
        error.response?.status,
        error.response?.data || error.message
      );
      throw error;
    }
  },

  async getProfile() {
    const response = await api.get("/profile/");
    return response.data;
  },
};

export default authService;