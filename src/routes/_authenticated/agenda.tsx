import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Mail,
  Trash2,
  Video,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { RoomPhoto } from "@/components/RoomPhoto";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  MONTHS_PT,
  buildInviteMailto,
  buildSlots,
  downloadIcs,
  formatDateLong,
  formatTime,
  pad,
  parseEmails,
  toDateKey,
} from "@/lib/booking-utils";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda de Salas — Topema" },
      {
        name: "description",
        content:
          "Grade de horários, calendário mensal e panorama anual das salas de reunião da Topema.",
      },
      { property: "og:title", content: "Agenda de Salas — Topema" },
      {
        property: "og:description",
        content: "Consulte disponibilidade e reserve as salas de reunião da Topema.",
      },
    ],
  }),
  component: AgendaPage,
});

type Room = {
  id: string;
  name: string;
  description: string;
  photo_path: string | null;
  materials: string[];
};

type Booking = {
  id: string;
  room_id: string;
  user_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  participants: string[];
  comments: string;
};

function AgendaPage() {
  const { user, isAdmin, fullName } = useAuth();
  const queryClient = useQueryClient();

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [refDate, setRefDate] = useState(() => new Date());
  const [view, setView] = useState("dia");
  const [slotStart, setSlotStart] = useState<Date | null>(null);
  const [toCancel, setToCancel] = useState<Booking | null>(null);

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("*").order("name");
      if (error) throw error;
      return data as Room[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email");
      if (error) throw error;
      return data;
    },
  });

  const nameOf = (id: string) => {
    const p = profiles.find((x) => x.id === id);
    return p?.full_name || p?.email || "Usuário";
  };

  const roomId = selectedRoomId ?? rooms[0]?.id ?? null;
  const room = rooms.find((r) => r.id === roomId) ?? null;

  const yearStart = new Date(refDate.getFullYear(), 0, 1);
  const yearEnd = new Date(refDate.getFullYear() + 1, 0, 1);

  const { data: bookings = [] } = useQuery({
    queryKey: ["bookings", refDate.getFullYear()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .gte("starts_at", yearStart.toISOString())
        .lt("starts_at", yearEnd.toISOString())
        .order("starts_at");
      if (error) throw error;
      return data as Booking[];
    },
  });

  const roomBookings = useMemo(
    () => bookings.filter((b) => !roomId || b.room_id === roomId),
    [bookings, roomId],
  );

  const dayBookings = useMemo(
    () => roomBookings.filter((b) => toDateKey(new Date(b.starts_at)) === toDateKey(refDate)),
    [roomBookings, refDate],
  );

  const slots = useMemo(() => buildSlots(refDate), [refDate]);

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bookings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reserva cancelada");
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setToCancel(null);
    },
    onError: (e: Error) => toast.error("Erro ao cancelar", { description: e.message }),
  });

  const canCancel = (b: Booking) => isAdmin || b.user_id === user?.id;

  const shiftDay = (days: number) => {
    const d = new Date(refDate);
    d.setDate(d.getDate() + days);
    setRefDate(d);
  };
  const shiftMonth = (months: number) => {
    const d = new Date(refDate);
    d.setMonth(d.getMonth() + months, 1);
    setRefDate(d);
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda das salas</h1>
          <p className="text-sm text-muted-foreground">
            Escolha a sala, confira a disponibilidade e reserve seu horário.
          </p>
        </div>
        <Badge className="bg-success text-success-foreground hover:bg-success">
          {rooms.length} sala(s) cadastrada(s)
        </Badge>
      </div>

      {rooms.length === 0 ? (
        <div className="surface-card mt-6 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma sala cadastrada ainda.{" "}
            {isAdmin ? "Cadastre as salas na aba Salas." : "Peça ao administrador para cadastrar."}
          </p>
        </div>
      ) : (
        <>
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rooms.map((r) => {
              const busyNow = bookings.some(
                (b) =>
                  b.room_id === r.id &&
                  new Date(b.starts_at) <= new Date() &&
                  new Date(b.ends_at) > new Date(),
              );
              const active = r.id === roomId;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoomId(r.id)}
                  className={cn(
                    "surface-card overflow-hidden text-left transition-all hover:shadow-[var(--shadow-elevated)]",
                    active && "ring-2 ring-primary",
                  )}
                >
                  <RoomPhoto path={r.photo_path} alt={`Foto da ${r.name}`} className="h-32 w-full" />
                  <div className="space-y-2 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-semibold">{r.name}</h2>
                      <Badge
                        className={cn(
                          busyNow
                            ? "bg-busy text-busy-foreground hover:bg-busy"
                            : "bg-success text-success-foreground hover:bg-success",
                        )}
                      >
                        {busyNow ? "Ocupada" : "Disponível"}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {r.materials.slice(0, 4).map((m) => (
                        <Badge key={m} variant="secondary" className="text-[10px]">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </section>

          <Tabs value={view} onValueChange={setView} className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                <TabsTrigger value="dia">Dia</TabsTrigger>
                <TabsTrigger value="mes">Mês</TabsTrigger>
                <TabsTrigger value="ano">Ano</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    view === "dia"
                      ? shiftDay(-1)
                      : view === "mes"
                        ? shiftMonth(-1)
                        : setRefDate(new Date(refDate.getFullYear() - 1, refDate.getMonth(), 1))
                  }
                  aria-label="Anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-44 text-center text-sm font-medium capitalize">
                  {view === "dia"
                    ? formatDateLong(refDate)
                    : view === "mes"
                      ? `${MONTHS_PT[refDate.getMonth()]} de ${refDate.getFullYear()}`
                      : refDate.getFullYear()}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    view === "dia"
                      ? shiftDay(1)
                      : view === "mes"
                        ? shiftMonth(1)
                        : setRefDate(new Date(refDate.getFullYear() + 1, refDate.getMonth(), 1))
                  }
                  aria-label="Próximo"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="secondary" onClick={() => setRefDate(new Date())}>
                  Hoje
                </Button>
              </div>
            </div>

            <TabsContent value="dia" className="mt-4">
              <div className="surface-card p-4">
                <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm bg-success" /> Livre
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm bg-busy" /> Reservado
                  </span>
                  <span>Sala: {room?.name}</span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {slots.map((slot) => {
                    const booking = dayBookings.find(
                      (b) =>
                        new Date(b.starts_at) < slot.end && new Date(b.ends_at) > slot.start,
                    );
                    if (booking) {
                      const isStart = formatTime(booking.starts_at) === slot.label;
                      return (
                        <div
                          key={slot.label}
                          className="rounded-lg border border-border bg-busy/60 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-busy-foreground">
                              {slot.label}
                            </span>
                            <Badge variant="secondary">Reservado</Badge>
                          </div>
                          {isStart ? (
                            <div className="mt-2 space-y-1">
                              <p className="text-sm font-medium">{booking.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {nameOf(booking.user_id)} ·{" "}
                                {formatTime(booking.starts_at)}–{formatTime(booking.ends_at)}
                              </p>
                              {booking.comments && (
                                <p className="flex items-start gap-1 text-xs text-muted-foreground">
                                  <Video className="mt-0.5 h-3 w-3 shrink-0" />
                                  <span className="line-clamp-2 break-all">{booking.comments}</span>
                                </p>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-1"
                                disabled={!canCancel(booking)}
                                onClick={() => setToCancel(booking)}
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Cancelar
                              </Button>
                            </div>
                          ) : (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {booking.title} · {nameOf(booking.user_id)}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return (
                      <button
                        key={slot.label}
                        onClick={() => setSlotStart(slot.start)}
                        className="group flex items-center justify-between rounded-lg border border-border bg-success-soft/60 p-3 text-left transition-colors hover:bg-success-soft"
                      >
                        <span className="inline-flex items-center gap-2 text-sm font-semibold">
                          <Clock className="h-4 w-4 text-success" /> {slot.label}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                          Livre <CalendarPlus className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="mes" className="mt-4">
              <MonthView
                refDate={refDate}
                bookings={roomBookings}
                onPickDay={(d) => {
                  setRefDate(d);
                  setView("dia");
                }}
              />
            </TabsContent>

            <TabsContent value="ano" className="mt-4">
              <YearView
                year={refDate.getFullYear()}
                bookings={roomBookings}
                onPickMonth={(m) => {
                  setRefDate(new Date(refDate.getFullYear(), m, 1));
                  setView("mes");
                }}
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      {slotStart && room && (
        <BookingDialog
          open
          onOpenChange={() => setSlotStart(null)}
          room={room}
          start={slotStart}
          organizer={fullName || user?.email || "Organizador"}
          userId={user?.id ?? ""}
          existing={dayBookings}
          onCreated={() => {
            setSlotStart(null);
            void queryClient.invalidateQueries({ queryKey: ["bookings"] });
          }}
        />
      )}

      <AlertDialog open={Boolean(toCancel)} onOpenChange={(o) => !o && setToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar esta reserva?</AlertDialogTitle>
            <AlertDialogDescription>
              A reserva “{toCancel?.title}” será removida da agenda. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toCancel && cancelMutation.mutate(toCancel.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancelar reserva
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function MonthView({
  refDate,
  bookings,
  onPickDay,
}: {
  refDate: Date;
  bookings: Booking[];
  onPickDay: (d: Date) => void;
}) {
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = first.getDay();

  const counts = new Map<string, number>();
  bookings.forEach((b) => {
    const key = toDateKey(new Date(b.starts_at));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return (
    <div className="surface-card p-4">
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2">
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = new Date(year, month, i + 1);
          const count = counts.get(toDateKey(day)) ?? 0;
          const isToday = toDateKey(day) === toDateKey(new Date());
          return (
            <button
              key={i}
              onClick={() => onPickDay(day)}
              className={cn(
                "flex min-h-20 flex-col rounded-lg border border-border p-2 text-left transition-colors hover:border-primary",
                count > 0 ? "bg-accent/50" : "bg-card",
                isToday && "ring-2 ring-primary",
              )}
            >
              <span className="text-sm font-semibold">{i + 1}</span>
              {count > 0 ? (
                <Badge variant="secondary" className="mt-auto w-fit text-[10px]">
                  {count} reserva{count > 1 ? "s" : ""}
                </Badge>
              ) : (
                <span className="mt-auto text-[10px] font-medium text-success">Livre</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function YearView({
  year,
  bookings,
  onPickMonth,
}: {
  year: number;
  bookings: Booking[];
  onPickMonth: (m: number) => void;
}) {
  const perMonth = Array.from({ length: 12 }, (_, m) =>
    bookings.filter((b) => new Date(b.starts_at).getMonth() === m).length,
  );
  const max = Math.max(1, ...perMonth);

  return (
    <div className="surface-card p-4">
      <p className="mb-4 text-sm text-muted-foreground">
        Panorama de ocupação em {year} — {bookings.length} reserva(s) no ano.
      </p>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {MONTHS_PT.map((label, m) => (
          <button
            key={label}
            onClick={() => onPickMonth(m)}
            className="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{label}</span>
              <span className="text-sm font-bold text-primary">{perMonth[m]}</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-success transition-all"
                style={{ width: `${((perMonth[m] ?? 0) / max) * 100}%` }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function BookingDialog({
  open,
  onOpenChange,
  room,
  start,
  organizer,
  userId,
  existing,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  room: Room;
  start: Date;
  organizer: string;
  userId: string;
  existing: Booking[];
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("60");
  const [participants, setParticipants] = useState("");
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);

  const end = new Date(start.getTime() + Number(duration) * 60000);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) {
      toast.error("Informe o nome da reunião");
      return;
    }
    const conflict = existing.some(
      (b) => new Date(b.starts_at) < end && new Date(b.ends_at) > start,
    );
    if (conflict) {
      toast.error("Este intervalo conflita com outra reserva");
      return;
    }

    const emails = parseEmails(participants);
    setSaving(true);
    const { error } = await supabase.from("bookings").insert({
      room_id: room.id,
      user_id: userId,
      title: title.trim().slice(0, 150),
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      participants: emails,
      comments: comments.trim().slice(0, 2000),
    });
    setSaving(false);

    if (error) {
      toast.error("Não foi possível reservar", { description: error.message });
      return;
    }

    const invite = {
      title: title.trim(),
      roomName: room.name,
      start,
      end,
      organizer,
      comments,
      participants: emails,
    };

    if (emails.length > 0) {
      downloadIcs(invite);
      window.location.href = buildInviteMailto(invite);
      toast.success("Reserva criada", {
        description: `Convite gerado para ${emails.length} participante(s).`,
      });
    } else {
      toast.success("Reserva criada");
    }
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova reserva — {room.name}</DialogTitle>
          <DialogDescription className="capitalize">
            {formatDateLong(start)} às {pad(start.getHours())}:{pad(start.getMinutes())}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Nome da reunião *</Label>
            <Input
              id="title"
              required
              maxLength={150}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Alinhamento comercial"
            />
          </div>

          <div className="space-y-2">
            <Label>Duração</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["30", "60", "90", "120", "180", "240"].map((d) => (
                  <SelectItem key={d} value={d}>
                    {Number(d) >= 60
                      ? `${Number(d) / 60}h${Number(d) % 60 ? "30" : ""}`
                      : "30 min"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Término às {pad(end.getHours())}:{pad(end.getMinutes())}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="participants">
              <Mail className="mr-1 inline h-3.5 w-3.5" />
              E-mails dos participantes
            </Label>
            <Textarea
              id="participants"
              rows={2}
              maxLength={2000}
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="joao@topema.com.br, maria@topema.com.br"
            />
            <p className="text-xs text-muted-foreground">
              Ao salvar, o convite (.ics) é gerado e o e-mail é preparado para envio.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Comentários / link de videoconferência</Label>
            <Textarea
              id="comments"
              rows={3}
              maxLength={2000}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Pauta, observações e link do Teams ou Google Meet"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Confirmar reserva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
