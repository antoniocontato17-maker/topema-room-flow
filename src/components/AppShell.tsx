import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, DoorOpen, LogOut, Users } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AppShell({ children }: { children: ReactNode }) {
  const { isAdmin, fullName, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  const linkClass =
    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-navy-foreground/75 transition-colors hover:bg-white/10 hover:text-navy-foreground";

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-navy text-navy-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-3">
          <Link to="/agenda" className="text-base font-semibold tracking-tight">
            TOPEMA <span className="font-light opacity-75">| Gestão de Salas</span>
          </Link>

          <nav className="flex flex-1 flex-wrap items-center gap-1">
            <Link
              to="/agenda"
              className={linkClass}
              activeProps={{ className: "bg-white/15 text-navy-foreground" }}
            >
              <CalendarDays className="h-4 w-4" /> Agenda
            </Link>
            {isAdmin && (
              <>
                <Link
                  to="/salas"
                  className={linkClass}
                  activeProps={{ className: "bg-white/15 text-navy-foreground" }}
                >
                  <DoorOpen className="h-4 w-4" /> Salas
                </Link>
                <Link
                  to="/usuarios"
                  className={linkClass}
                  activeProps={{ className: "bg-white/15 text-navy-foreground" }}
                >
                  <Users className="h-4 w-4" /> Usuários
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">
                {fullName || user?.email}
              </p>
              <Badge
                variant="secondary"
                className="mt-0.5 h-5 px-1.5 text-[10px] uppercase tracking-wide"
              >
                {isAdmin ? "Administrador" : "Usuário"}
              </Badge>
            </div>
            <Button size="sm" variant="ghost" onClick={signOut} className="text-navy-foreground hover:bg-white/10">
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6 fade-in-up">{children}</main>
    </div>
  );
}
