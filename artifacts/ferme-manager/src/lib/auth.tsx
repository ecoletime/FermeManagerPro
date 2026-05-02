import React, { createContext, useContext, useState, ReactNode } from "react";

type Role = "admin" | "employee" | null;

interface AuthState {
  isLoggedIn: boolean;
  role: Role;
  login: (role: Role) => void;
  logout: () => void;
}

const AUTH_KEY = "ferme_auth";

function loadAuth(): { isLoggedIn: boolean; role: Role } {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return { isLoggedIn: false, role: null };
    const parsed = JSON.parse(raw);
    if (parsed.isLoggedIn && (parsed.role === "admin" || parsed.role === "employee")) {
      return { isLoggedIn: true, role: parsed.role };
    }
  } catch {
  }
  return { isLoggedIn: false, role: null };
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = loadAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(initial.isLoggedIn);
  const [role, setRole] = useState<Role>(initial.role);

  const login = (newRole: Role) => {
    setRole(newRole);
    setIsLoggedIn(true);
    localStorage.setItem(AUTH_KEY, JSON.stringify({ isLoggedIn: true, role: newRole }));
  };

  const logout = () => {
    setRole(null);
    setIsLoggedIn(false);
    localStorage.removeItem(AUTH_KEY);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
