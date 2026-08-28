import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  apiFetch,
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from "@/lib/api";

export type AuthAddress = {
  id?: number;
  county: string | null;
  town: string | null;
  estate: string | null;
  street: string | null;
  building: string | null;
  house_number: string | null;
  nearest_landmark: string | null;
  instructions: string | null;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  alt_phone?: string | null;
  role: "customer" | "admin" | string;
  profile_picture?: string | null;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
  address?: AuthAddress | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  profile: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCurrentUser = async () => {
    const token = getAuthToken();

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await apiFetch<AuthUser>("/auth/me", {
        token,
      });

      setUser(response);
    } catch {
      clearAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCurrentUser();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile: user,
      isAdmin: user?.role === "admin",
      loading,

      refreshProfile: async () => {
        await loadCurrentUser();
      },

      signOut: async () => {
        const token = getAuthToken();

        try {
          if (token) {
            await apiFetch("/auth/logout", {
              method: "POST",
              token,
            });
          }
        } catch {
          // Even if the server request fails,
          // remove the local authentication token.
        } finally {
          clearAuthToken();
          setUser(null);
        }
      },
    }),
    [user, loading],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used inside <AuthProvider>",
    );
  }

  return ctx;
}