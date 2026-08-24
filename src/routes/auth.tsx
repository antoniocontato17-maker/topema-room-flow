import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Topema Gestão de Salas" },
      {
        name: "description",
        content: "Acesse o sistema de agendamento de salas de reunião da Topema.",
      },
      { property: "og:title", content: "Entrar — Topema Gestão de Salas" },
      {
        property: "og:description",
        content: "Acesse o sistema de agendamento de salas de reunião da Topema.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (session) void navigate({ to: "/agenda", replace: true });
  }, [session, navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error("Não foi possível entrar", { description: error.message });
    toast.success("Bem-vindo!");
    void navigate({ to: "/agenda" });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2) return toast.error("Informe seu nome completo");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/agenda`,
        data: { full_name: fullName.trim() },
      },
    });
    setLoading(false);
    if (error) return toast.error("Não foi possível cadastrar", { description: error.message });
    toast.success("Conta criada", {
      description: "Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada.",
    });
  };

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="bg-navy px-5 py-4 text-navy-foreground">
        <span className="text-lg font-semibold tracking-tight">
          TOPEMA <span className="font-light opacity-80">| Gestão de Salas</span>
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="surface-card w-full max-w-md p-6 fade-in-up">
          <h1 className="text-xl font-semibold">Acesso ao sistema</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use as credenciais fornecidas pelo administrador.
          </p>

          <Tabs defaultValue="login" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={signIn} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@topema.com.br"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    required
                    maxLength={120}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2">E-mail</Label>
                  <Input
                    id="email2"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2">Senha</Label>
                  <Input
                    id="password2"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Cadastrando..." : "Criar conta"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  O primeiro usuário cadastrado torna-se administrador automaticamente.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
