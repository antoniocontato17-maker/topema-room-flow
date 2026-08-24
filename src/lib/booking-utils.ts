export const SLOT_MINUTES = 30;
export const DAY_START_HOUR = 7;
export const DAY_END_HOUR = 20;

export type Slot = { start: Date; end: Date; label: string };

export function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

export function buildSlots(day: Date): Slot[] {
  const slots: Slot[] = [];
  for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
      const end = new Date(start.getTime() + SLOT_MINUTES * 60000);
      slots.push({ start, end, label: `${pad(h)}:${pad(m)}` });
    }
  }
  return slots;
}

export function formatTime(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDateLong(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export const MONTHS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

export function parseEmails(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))
    .slice(0, 50);
}

type InviteInput = {
  title: string;
  roomName: string;
  start: Date;
  end: Date;
  organizer: string;
  comments: string;
  participants: string[];
};

export function buildInviteMailto(i: InviteInput) {
  const body = [
    `Você foi convidado para a reunião "${i.title}".`,
    "",
    `Sala: ${i.roomName}`,
    `Data: ${formatDateLong(i.start)}`,
    `Horário: ${pad(i.start.getHours())}:${pad(i.start.getMinutes())} às ${pad(i.end.getHours())}:${pad(i.end.getMinutes())}`,
    `Organizador: ${i.organizer}`,
    "",
    "Comentários / link de videoconferência:",
    i.comments.trim() || "—",
    "",
    "Topema — Gestão de Salas",
  ].join("\n");

  return `mailto:${encodeURIComponent(i.participants.join(","))}?subject=${encodeURIComponent(
    `Convite: ${i.title} — ${i.roomName}`,
  )}&body=${encodeURIComponent(body)}`;
}

function icsDate(d: Date) {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`
  );
}

export function buildIcs(i: InviteInput) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Topema//Gestao de Salas//PT",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@topema`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(i.start)}`,
    `DTEND:${icsDate(i.end)}`,
    `SUMMARY:${i.title}`,
    `LOCATION:${i.roomName}`,
    `DESCRIPTION:${(i.comments || "").replace(/\n/g, "\\n")}`,
    ...i.participants.map((p) => `ATTENDEE;CN=${p}:mailto:${p}`),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(i: InviteInput) {
  const blob = new Blob([buildIcs(i)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${i.title.replace(/[^\w\-]+/g, "-")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
