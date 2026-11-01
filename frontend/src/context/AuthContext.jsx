import { createContext, useContext, useEffect, useState } from "react";
import { TOKEN_KEY } from "../services/api";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // When the app opens, check whether a saved token is still valid
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    authService
      .fetchMe()
      .then((data) => setUser(data.user))
      .catch((error) => {
        // Only forget the token if the server rejected it
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem(TOKEN_KEY);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const saveSession = (data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  };

    const login = async (email, password, expectedRole) => {
    const data = await authService.loginUser({ email, password });

    // If the person chose a login type, the account must match it
    if (expectedRole && data.user.role !== expectedRole) {
      const label = expectedRole.charAt(0).toUpperCase() + expectedRole.slice(1);
      throw new Error(
        `This is a ${data.user.role} account. Please use the ${label} login.`
      );
    }

    return saveSession(data);
  };

  const register = async (formData) => {
    const data = await authService.registerUser(formData);
    return saveSession(data);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  // Which dashboard belongs to which role
  const getDashboardPath = (role) => {
    if (role === "admin") return "/admin";
    if (role === "beautician") return "/beautician";
    return "/customer";
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    setUser,
    getDashboardPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);