import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import api from "../services/api";

import type {
  AuthUser,
} from "../types";

interface LoginInput {
  emailOrEmployeeId: string;
  password: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;

  login: (
    credentials: LoginInput
  ) => Promise<void>;

  logout: () => void;
}

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const token =
        localStorage.getItem(
          "accessToken"
        );

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response =
          await api.get("/auth/me");

        setUser(response.data.data);
      } catch {
        localStorage.removeItem(
          "accessToken"
        );

        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async ({
  emailOrEmployeeId,
  password,
}: LoginInput) => {
  try {
    const response =
      await api.post("/auth/login", {
        emailOrEmployeeId,
        password,
      });

    console.log(
      "LOGIN RESPONSE:",
      response.data
    );

    const {
      accessToken,
      user,
    } = response.data.data;

    if (!accessToken) {
      throw new Error(
        "Access token was not returned by server"
      );
    }

    localStorage.setItem(
      "accessToken",
      accessToken
    );

    setUser(user);

    console.log(
      "USER SET:",
      user
    );
  } catch (error) {
    console.error(
      "LOGIN FAILED:",
      error
    );

    throw error;
  }
};

  const logout = () => {
    localStorage.removeItem(
      "accessToken"
    );

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};