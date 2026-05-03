import React, { createContext, useContext, useState, ReactNode } from "react";

type Role = "admin" | "employee" | null;

type Permissions = string[];

interface AuthState {
  isLoggedIn: boolean;
  role: Role;
  permissions: Permissions;
  login: (role: Role, permissions?: Permissions) => void;
  logout: () => void;
}

const AUTH_KEY = "ferme_auth";
const SETTINGS_KEY = "ferme_system_settings";

function loadAuth(): { isLoggedIn: boolean; role: Role; permissions: Permissions } {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return { isLoggedIn: false, role: null, permissions: [] };
    const parsed = JSON.parse(raw);
    if (parsed.isLoggedIn && (parsed.role === "admin" || parsed.role === "employee")) {
      return {
        isLoggedIn: true,
        role: parsed.role,
        permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
      };
    }
  } catch {
  }
  return { isLoggedIn: false, role: null, permissions: [] };
}

function applySavedTheme() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    document.documentElement.classList.toggle("dark", Boolean(parsed.darkMode));
  } catch {
  }
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = loadAuth();
  applySavedTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(initial.isLoggedIn);
  const [role, setRole] = useState<Role>(initial.role);
  const [permissions, setPermissions] = useState<Permissions>(initial.permissions);

  const login = (newRole: Role, newPermissions: Permissions = []) => {
    setRole(newRole);
    setPermissions(newPermissions);
    setIsLoggedIn(true);
    localStorage.setItem(AUTH_KEY, JSON.stringify({ isLoggedIn: true, role: newRole, permissions: newPermissions }));
  };

  const logout = () => {
    setRole(null);
    setPermissions([]);
    setIsLoggedIn(false);
    localStorage.removeItem(AUTH_KEY);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, role, permissions, login, logout }}>
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
