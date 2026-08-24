import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthValue = {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  fullName: string;
  loading: boolean;
  refreshRole: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  session: null,
  user: null,
  isAdmin: false,
  fullName: "",
  loading: true,
  refreshRole: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);

  const loadRole = async (userId: string | undefined) => {
    if (!userId) {
      setIsAdmin(false);
      setFullName("");
      return;
    }
    const [{ data: roles }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    ]);
    setIsAdmin(Boolean(roles?.some((r) => r.role === "admin")));
    setFullName(profile?.full_name ?? "");
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setTimeout(() => {
        void loadRole(newSession?.user?.id);
      }, 0);
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadRole(data.session?.user?.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isAdmin,
        fullName,
        loading,
        refreshRole: () => loadRole(session?.user?.id),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
