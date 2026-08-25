import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { RoomPhoto } from "@/components/RoomPhoto";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export const Route = createFileRoute("/_authenticated/salas")({
  head: () => ({
    meta: [
      { title: "Gestão de Salas — Topema" },
      {
        name: "description",
        content: "Cadastre salas de reunião com foto, descrição e materiais disponíveis.",
      },
      { property: "og:title", content: "Gestão de Salas — Topema" },
      {
        property: "og:description",
        content: "Cadastre e edite as salas de reunião da Topema.",
      },
    ],
  }),
  component: RoomsPage,
});

type Room = {
  id: string;
  name: string;
  description: string;
  photo_path: string | null;
  materials: string[];
};

const DEFAULT_ROOMS = [
  {
    name: "Sala Azul",
    description: "Sala de reuniões executiva para até 12 pessoas.",
    materials: ["TV 55\"", "Videoconferência", "Flipchart", "Adaptadores HDMI"],
  },
  {
    name: "Sala Branca",
    description: "Sala clara e reservada, ideal para entrevistas e reuniões rápidas.",
    materials: ["TV 43\"", "Quadro branco", "Adaptadores USB-C"],
  },
  {
    name: "Sala Amarela",
    description: "Sala colaborativa para dinâmicas e workshops.",
    materials: ["Projetor", "Flipchart", "Post-its", "Caixa de som"],
  },
  {
    name: "Sala Laranja",
    description: "Sala de apoio para reuniões de equipe do dia a dia.",
    materials: ["TV 50\"", "Webcam", "Adaptadores HDMI"],
  },
];

function RoomsPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Room | "new" | null>(null);
  const [toDelete, setToDelete] = useState<Room | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) void navigate({ to: "/agenda", replace: true });
  }, [loading, isAdmin, navigate]);

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("*").order("name");
      if (error) throw error;
      return data as Room[];
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const missing = DEFAULT_ROOMS.filter((d) => !rooms.some((r) => r.name === d.name));
      if (missing.length === 0) return;
      const { error } = await supabase.from("rooms").insert(missing);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Salas padrão criadas");
      void queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (e: Error) => toast.error("Erro", { description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (room: Room) => {
      const { error } = await supabase.from("rooms").delete().eq("id", room.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sala excluída");
      setToDelete(null);
      void queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (e: Error) => toast.error("Erro ao excluir", { description: e.message }),
  });

  if (!isAdmin) return null;

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Salas de reunião</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre foto real, descrição e materiais disponíveis em cada sala.
          </p>
        </div>
        <div className="flex gap-2">
          {rooms.length === 0 && (
            <Button variant="outline" onClick={() => seedMutation.mutate()}>
              Criar salas padrão
            </Button>
          )}
          <Button onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" /> Nova sala
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <article key={room.id} className="surface-card overflow-hidden">
            <RoomPhoto path={room.photo_path} alt={`Foto da ${room.name}`} className="h-40 w-full" />
            <div className="space-y-3 p-4">
              <h2 className="text-lg font-semibold">{room.name}</h2>
              <p className="text-sm text-muted-foreground">{room.description}</p>
              <div className="flex flex-wrap gap-1">
                {room.materials.map((m) => (
                  <Badge key={m} variant="secondary" className="text-[11px]">
                    {m}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => setEditing(room)}>
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setToDelete(room)}>
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {editing && (
        <RoomDialog
          room={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void queryClient.invalidateQueries({ queryKey: ["rooms"] });
          }}
        />
      )}

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir a {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as reservas dessa sala também serão removidas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && deleteMutation.mutate(toDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir sala
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function RoomDialog({
  room,
  onClose,
  onSaved,
}: {
  room: Room | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(room?.name ?? "");
  const [description, setDescription] = useState(room?.description ?? "");
  const [materials, setMaterials] = useState((room?.materials ?? []).join(", "));
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Informe o nome da sala");
      return;
    }
    setSaving(true);

    let photoPath = room?.photo_path ?? null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setSaving(false);
        toast.error("A imagem deve ter no máximo 10 MB");
        return;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("room-photos")
        .upload(path, file, { upsert: false });
      if (uploadError) {
        setSaving(false);
        toast.error("Falha no upload da foto", { description: uploadError.message });
        return;
      }
      photoPath = path;
    }

    const payload = {
      name: name.trim().slice(0, 80),
      description: description.trim().slice(0, 1000),
      materials: materials
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean)
        .slice(0, 30),
      photo_path: photoPath,
    };

    const { error } = room
      ? await supabase.from("rooms").update(payload).eq("id", room.id)
      : await supabase.from("rooms").insert(payload);
    setSaving(false);

    if (error) {
      toast.error("Não foi possível salvar", { description: error.message });
      return;
    }
    toast.success(room ? "Sala atualizada" : "Sala cadastrada");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{room ? `Editar ${room.name}` : "Nova sala"}</DialogTitle>
          <DialogDescription>
            Foto real, descrição e materiais ajudam o usuário a escolher a sala certa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-name">Nome da sala *</Label>
            <Input
              id="room-name"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sala Azul"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="room-desc">Descrição</Label>
            <Textarea
              id="room-desc"
              rows={3}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="room-mat">Materiais disponíveis (separados por vírgula)</Label>
            <Textarea
              id="room-mat"
              rows={2}
              maxLength={800}
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              placeholder='TV 55", Projetor, Flipchart, Adaptadores'
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="room-photo">
              <Upload className="mr-1 inline h-3.5 w-3.5" /> Foto da sala
            </Label>
            <Input
              id="room-photo"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar sala"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
