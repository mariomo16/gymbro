import Link from "next/link";
import { IconChevronRight } from "@/components/icons";
import { getSessionUser } from "@/lib/auth";
import { formatDateLong, formatDuration, formatVolume } from "@/lib/dates";
import { all } from "@/lib/db";

export const metadata = { title: "Historial" };

type Row = {
  id: number;
  started_at: number;
  duration_seconds: number | null;
  title: string | null;
  volume: number;
  sets: number;
};

export default async function HistoryPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const workouts = all<Row>(
    `SELECT w.id, w.started_at, w.duration_seconds,
      (SELECT r.name FROM routine_days rd JOIN routines r ON r.id = rd.routine_id WHERE rd.id = w.routine_day_id) AS title,
      (SELECT COALESCE(SUM(s.reps * s.weight), 0) FROM workout_sets s
       JOIN workout_exercises we ON we.id = s.workout_exercise_id WHERE we.workout_id = w.id) AS volume,
      (SELECT COUNT(*) FROM workout_sets s
       JOIN workout_exercises we ON we.id = s.workout_exercise_id WHERE we.workout_id = w.id) AS sets
    FROM workouts w
    WHERE w.user_id = ? AND w.ended_at IS NOT NULL
    ORDER BY w.started_at DESC LIMIT 100`,
    user.id,
  );

  const groups: { key: string; label: string; items: Row[] }[] = [];
  for (const w of workouts) {
    const raw = new Intl.DateTimeFormat("es-ES", {
      month: "long",
      year: "numeric",
    }).format(new Date(w.started_at));
    const last = groups[groups.length - 1];
    if (last && last.key === raw) last.items.push(w);
    else
      groups.push({
        key: raw,
        label: raw.charAt(0).toUpperCase() + raw.slice(1),
        items: [w],
      });
  }

  return (
    <main className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Historial</h1>
        <p className="mt-0.5 text-sm text-mute">
          {workouts.length > 0
            ? `${workouts.length} entrenamientos`
            : "Aún no hay entrenos"}
        </p>
      </header>

      {groups.map((g) => (
        <section key={g.label} className="flex flex-col gap-2">
          <h2 className="px-1 text-[11px] font-bold uppercase tracking-widest text-mute">
            {g.label}
          </h2>
          {g.items.map((w) => (
            <Link
              key={w.id}
              href={`/history/${w.id}`}
              className="card flex items-center gap-3 p-4 active:bg-raised"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {w.title ?? "Entreno libre"}
                </p>
                <p className="mt-0.5 text-xs text-mute">
                  {formatDateLong(w.started_at)} ·{" "}
                  {formatDuration(w.duration_seconds)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {formatVolume(w.volume)}
                </p>
                <p className="text-[11px] text-mute">{w.sets} series</p>
              </div>
              <IconChevronRight className="h-4 w-4 shrink-0 text-mute" />
            </Link>
          ))}
        </section>
      ))}

      {workouts.length === 0 && (
        <div className="card p-6 text-center text-sm text-mute">
          Cuando termines tu primer entrenamiento aparecerá aquí.
        </div>
      )}
    </main>
  );
}
