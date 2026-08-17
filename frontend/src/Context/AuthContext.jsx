import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import authService from "../Services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [accessToken, setAccessToken] = useState(
    () =>
      localStorage.getItem(
        "flowdesk_access_token"
      )
  );

  const [loading, setLoading] = useState(true);

  const isAuthenticated =
    Boolean(accessToken) && Boolean(user);

  // --------------------------------
  // SAVE TOKENS
  // --------------------------------

  const saveTokens = (access, refresh) => {
    localStorage.setItem(
      "flowdesk_access_token",
      access
    );

    if (refresh) {
      localStorage.setItem(
        "flowdesk_refresh_token",
        refresh
      );
    }

    setAccessToken(access);
  };

  // --------------------------------
  // CLEAR AUTHENTICATION
  // --------------------------------

  const clearAuthentication = () => {
    localStorage.removeItem(
      "flowdesk_access_token"
    );

    localStorage.removeItem(
      "flowdesk_refresh_token"
    );

    setAccessToken(null);
    setUser(null);
  };

  // --------------------------------
  // LOGIN
  // --------------------------------

  const login = async (username, password) => {
    const data = await authService.login(
      username,
      password
    );

    saveTokens(
      data.access,
      data.refresh
    );

    const profile =
      await authService.getProfile();

    setUser(profile);

    return profile;
  };

  // --------------------------------
  // REGISTER
  // --------------------------------

  const register = async (userData) => {
    return await authService.register(
      userData
    );
  };

  // --------------------------------
  // REFRESH TOKEN
  // --------------------------------

  const refreshAccessToken = async () => {
    const refreshToken =
      localStorage.getItem(
        "flowdesk_refresh_token"
      );

    if (!refreshToken) {
      throw new Error(
        "No refresh token available."
      );
    }

    const data =
      await authService.refreshToken(
        refreshToken
      );

    saveTokens(
      data.access,
      refreshToken
    );

    return data.access;
  };

  // --------------------------------
  // LOGOUT
  // --------------------------------

  const logout = () => {
    clearAuthentication();
  };

  // --------------------------------
  // RESTORE SESSION
  // --------------------------------

  useEffect(() => {
    const restoreSession = async () => {
      const storedAccessToken =
        localStorage.getItem(
          "flowdesk_access_token"
        );

      const storedRefreshToken =
        localStorage.getItem(
          "flowdesk_refresh_token"
        );

      if (
        !storedAccessToken &&
        !storedRefreshToken
      ) {
        setLoading(false);
        return;
      }

      try {
        if (storedAccessToken) {
          setAccessToken(
            storedAccessToken
          );

          const profile =
            await authService.getProfile();

          setUser(profile);

          return;
        }

        throw new Error(
          "Access token unavailable."
        );
      } catch {
        if (!storedRefreshToken) {
          clearAuthentication();
          return;
        }

        try {
          const newAccessToken =
            await refreshAccessToken();

          setAccessToken(
            newAccessToken
          );

          const profile =
            await authService.getProfile();

          setUser(profile);
        } catch {
          clearAuthentication();
        }
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const value = {
    user,
    accessToken,
    loading,
    isAuthenticated,

    login,
    register,
    logout,
    refreshAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}