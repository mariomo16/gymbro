export function formatRepRange(min: number | null, max: number | null): string {
  if (min == null) return "";
  if (max == null) return `${min}+`;
  if (max === min) return String(min);
  return `${min}–${max}`;
}
