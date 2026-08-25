import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { createUser, deleteUser } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários — Topema Gestão de Salas" },
      {
        name: "description",
        content: "Cadastre usuários e defina o perfil de acesso (administrador ou comum).",
      },
      { property: "og:title", content: "Usuários — Topema Gestão de Salas" },
      {
        property: "og:description",
        content: "Gerencie os acessos ao sistema de agendamento de salas.",
      },
    ],
  }),
  component: UsersPage,
});

type PersonRow = { id: string; full_name: string; email: string; role: string };

function UsersPage() {
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createUserFn = useServerFn(createUser);
  const deleteUserFn = useServerFn(deleteUser);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [toDelete, setToDelete] = useState<PersonRow | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) void navigate({ to: "/agenda", replace: true });
  }, [loading, isAdmin, navigate]);

  const { data: people = [] } = useQuery({
    queryKey: ["people"],
    queryFn: async () => {
      const [{ data: profiles, error }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email").order("full_name"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (error) throw error;
      return (profiles ?? []).map((p) => ({
        ...p,
        role: roles?.some((r) => r.user_id === p.id && r.role === "admin") ? "admin" : "user",
      })) as PersonRow[];
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createUserFn({ data: { fullName: fullName.trim(), email: email.trim(), password, role } }),
    onSuccess: () => {
      toast.success("Usuário cadastrado");
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("user");
      void queryClient.invalidateQueries({ queryKey: ["people"] });
    },
    onError: (e: Error) => toast.error("Erro ao cadastrar", { description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUserFn({ data: { userId: id } }),
    onSuccess: () => {
      toast.success("Usuário removido");
      setToDelete(null);
      void queryClient.invalidateQueries({ queryKey: ["people"] });
    },
    onError: (e: Error) => toast.error("Erro ao remover", { description: e.message }),
  });

  if (!isAdmin) return null;

  return (
    <AppShell>
      <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
      <p className="text-sm text-muted-foreground">
        Cadastre acessos e defina quem é administrador do sistema.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <section className="surface-card h-fit p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <UserPlus className="h-4 w-4 text-primary" /> Novo usuário
          </h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (password.length < 6) {
                toast.error("A senha deve ter ao menos 6 caracteres");
                return;
              }
              createMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="u-name">Nome *</Label>
              <Input
                id="u-name"
                required
                maxLength={120}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-email">E-mail *</Label>
              <Input
                id="u-email"
                type="email"
                required
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-pass">Senha *</Label>
              <Input
                id="u-pass"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select value={role} onValueChange={(v) => setRole(v as "admin" | "user")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário comum</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Cadastrando..." : "Cadastrar usuário"}
            </Button>
          </form>
        </section>

        <section className="surface-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Perfil</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{p.full_name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                  <td className="px-4 py-3">
                    {p.role === "admin" ? (
                      <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                        <ShieldCheck className="mr-1 h-3 w-3" /> Administrador
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Usuário</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={p.id === user?.id}
                      onClick={() => setToDelete(p)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remover</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {toDelete?.full_name || toDelete?.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              O acesso e as reservas desse usuário serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && deleteMutation.mutate(toDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover usuário
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
