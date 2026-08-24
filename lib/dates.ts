export const DAYS_SHORT = ["L", "M", "X", "J", "V", "S", "D"];
export const DAYS_LONG = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export function todayISO(): string {
  return toISO(new Date());
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function shiftDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toISO(date);
}

const dateFmt = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const shortFmt = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
});
const timeFmt = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateLong(ms: number): string {
  return capitalize(dateFmt.format(new Date(ms)));
}

export function formatDateShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return capitalize(shortFmt.format(new Date(y, m - 1, d)));
}

export function formatTime(ms: number): string {
  return timeFmt.format(new Date(ms));
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h} h ${m} min`;
  if (m > 0) return `${m} min`;
  return `${seconds} s`;
}

export function formatVolume(volume: number): string {
  if (volume >= 10000) return `${Math.round(volume / 1000)} t`;
  return `${Math.round(volume).toLocaleString("es-ES")} kg`;
}

export function signed(n: number, digits = 1): string {
  const r = n.toFixed(digits);
  return n > 0 ? `+${r}` : r;
}
