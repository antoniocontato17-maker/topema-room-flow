import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CalendarCheck, DoorOpen, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Topema — Gestão de Salas de Reunião" },
      {
        name: "description",
        content:
          "Agende as salas de reunião da Topema: veja disponibilidade em tempo real, reserve horários e convide participantes.",
      },
      { property: "og:title", content: "Topema — Gestão de Salas de Reunião" },
      {
        property: "og:description",
        content:
          "Agende as salas de reunião da Topema: disponibilidade em tempo real, reservas e convites.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/agenda", replace: true });
  }, [loading, session, navigate]);

  return (
    <main className="min-h-screen bg-background">
      <header className="bg-navy text-navy-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className="text-lg font-semibold tracking-tight">
            TOPEMA <span className="font-light opacity-80">| Gestão de Salas</span>
          </span>
          <Button asChild variant="secondary" size="sm">
            <Link to="/auth">Entrar</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-16 fade-in-up">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Reuniões sem conflito
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight text-foreground sm:text-5xl">
          Agendamento das salas de reunião da Topema
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          Consulte a disponibilidade das salas Azul, Branca, Amarela e Laranja, reserve
          horários e envie convites aos participantes em poucos cliques.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Acessar o sistema</Link>
          </Button>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: DoorOpen,
              title: "Salas com foto e materiais",
              text: "Veja a foto real, a descrição e os equipamentos disponíveis antes de reservar.",
            },
            {
              icon: CalendarCheck,
              title: "Visões diária, mensal e anual",
              text: "Grade de horários livre/reservado e panorama de ocupação do mês e do ano.",
            },
            {
              icon: ShieldCheck,
              title: "Permissões por perfil",
              text: "Administradores gerenciam salas e usuários; cada pessoa cancela as próprias reservas.",
            },
          ].map((f) => (
            <div key={f.title} className="surface-card p-5">
              <f.icon className="h-5 w-5 text-primary" />
              <h2 className="mt-3 text-base font-semibold">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
