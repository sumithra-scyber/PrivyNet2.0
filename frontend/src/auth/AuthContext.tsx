import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../api/client";
import type { LoginRequest, TokenResponse, UserOut } from "../api/types";

interface AuthContextValue {
  user: UserOut | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadCurrentUser() {
    const token = localStorage.getItem("privynet_token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const { data } = await api.get<UserOut>("/users/me");
      setUser(data);
    } catch {
      localStorage.removeItem("privynet_token");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCurrentUser();
  }, []);

  async function login(credentials: LoginRequest) {
    const { data } = await api.post<TokenResponse>("/auth/login", credentials);
    localStorage.setItem("privynet_token", data.access_token);
    const { data: me } = await api.get<UserOut>("/users/me");
    setUser(me);
  }

  function logout() {
    localStorage.removeItem("privynet_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
