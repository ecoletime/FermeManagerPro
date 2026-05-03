import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

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
const ADMIN_CREDENTIALS_KEY = "ferme_admin_credentials";

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

function loadAdminCredentials() {
  try {
    const raw = localStorage.getItem(ADMIN_CREDENTIALS_KEY);
    if (!raw) return { username: "admin", password: "admin123" };
    const parsed = JSON.parse(raw);
    return {
      username: typeof parsed.username === "string" && parsed.username ? parsed.username : "admin",
      password: typeof parsed.password === "string" && parsed.password ? parsed.password : "admin123",
    };
  } catch {
    return { username: "admin", password: "admin123" };
  }
}

export function getAdminCredentials() {
  return loadAdminCredentials();
}

export function updateAdminCredentials(username: string, password: string) {
  localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify({ username, password }));
}

export function setAuthState(role: Role, permissions: Permissions = []) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ isLoggedIn: Boolean(role), role, permissions }));
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = loadAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(initial.isLoggedIn);
  const [role, setRole] = useState<Role>(initial.role);
  const [permissions, setPermissions] = useState<Permissions>(initial.permissions);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      document.documentElement.classList.toggle("dark", Boolean(parsed.darkMode));
    } catch {
    }
  }, []);

  const login = (newRole: Role, newPermissions: Permissions = []) => {
    setRole(newRole);
    setPermissions(newPermissions);
    setIsLoggedIn(true);
    setAuthState(newRole, newPermissions);
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
