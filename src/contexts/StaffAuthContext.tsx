import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  IS_STRAPI_CONFIGURED,
  LAB_STAFF_ROLE_TYPE,
  STRAPI_BASE_URL,
  staffAuthApi,
  type StaffUser,
} from "@/lib/api";

const STORAGE_KEY = "strapi_lab_staff_jwt";

export type StaffAuthState = {
  ready: boolean;
  token: string | null;
  user: StaffUser | null;
  isLabStaff: boolean;
  login: (identifier: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
};

const StaffAuthContext = createContext<StaffAuthState | null>(null);

function readStoredToken(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<StaffUser | null>(null);

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t = readStoredToken();
      if (!t) {
        if (!cancelled) {
          setToken(null);
          setUser(null);
          setReady(true);
        }
        return;
      }
      if (!cancelled) setToken(t);
      const u = await staffAuthApi.fetchMe(t);
      if (cancelled) return;
      if (!u) {
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
        setToken(null);
        setUser(null);
      } else {
        setUser(u);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      if (!IS_STRAPI_CONFIGURED || !STRAPI_BASE_URL) {
        return { ok: false as const, error: "Strapi is not configured." };
      }
      const auth = await staffAuthApi.loginLocal(identifier, password);
      if (!auth.ok) return auth;

      const u = await staffAuthApi.fetchMe(auth.jwt);
      if (!u || u.roleType !== LAB_STAFF_ROLE_TYPE) {
        return {
          ok: false as const,
          error: "This account does not have the Lab staff role. Ask an administrator to assign it in Strapi.",
        };
      }
      try {
        sessionStorage.setItem(STORAGE_KEY, auth.jwt);
      } catch {
        /* ignore */
      }
      setToken(auth.jwt);
      setUser(u);
      return { ok: true as const };
    },
    [],
  );

  const value = useMemo<StaffAuthState>(
    () => ({
      ready,
      token,
      user,
      isLabStaff: user?.roleType === LAB_STAFF_ROLE_TYPE,
      login,
      logout,
    }),
    [ready, token, user, login, logout],
  );

  return <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>;
}

export function useStaffAuth(): StaffAuthState {
  const ctx = useContext(StaffAuthContext);
  if (!ctx) {
    throw new Error("useStaffAuth must be used within StaffAuthProvider");
  }
  return ctx;
}
