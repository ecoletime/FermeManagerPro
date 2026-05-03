import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Role = "admin" | "employee" | null;

type Permissions = string[];

interface AuthState {
  isLoggedIn: boolean;
  role: Role;
  permissions: Permissions;
  username?: string;
  login: (role: Role, permissions?: Permissions) => void;
  logout: () => void;
}

interface AuthSnapshot {
  isLoggedIn: boolean;
  role: Role;
  permissions: Permissions;
  username?: string;
}

const AUTH_KEY = "ferme_auth";
const SETTINGS_KEY = "ferme_system_settings";
const ADMIN_CREDENTIALS_KEY = "ferme_admin_credentials";

function loadAuth(): AuthSnapshot {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return { isLoggedIn: false, role: null, permissions: [] };
    const parsed = JSON.parse(raw);
    if (parsed.isLoggedIn && (parsed.role === "admin" || parsed.role === "employee")) {
      return {
        isLoggedIn: true,
        role: parsed.role,
        permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
        username: typeof parsed.username === "string" ? parsed.username : undefined,
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

export function setAuthStateWithUsername(role: Role, permissions: Permissions = [], username?: string) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ isLoggedIn: Boolean(role), role, permissions, username }));
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthSnapshot>(loadAuth());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      document.documentElement.classList.toggle("dark", Boolean(parsed.darkMode));
    } catch {
    }
  }, []);

  useEffect(() => {
    const sync = () => setState(loadAuth());
    sync();
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("storage", sync);
    };
  }, []);

  const login = (newRole: Role, newPermissions: Permissions = []) => {
    const snapshot = { isLoggedIn: Boolean(newRole), role: newRole, permissions: newPermissions };
    setState(snapshot);
    localStorage.setItem(AUTH_KEY, JSON.stringify(snapshot));
    window.dispatchEvent(new Event("storage"));
  };

  const logout = () => {
    setState({ isLoggedIn: false, role: null, permissions: [] });
    localStorage.removeItem(AUTH_KEY);
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn: state.isLoggedIn, role: state.role, permissions: state.permissions, username: state.username, login, logout }}>
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
