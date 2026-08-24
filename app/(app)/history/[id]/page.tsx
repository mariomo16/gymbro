import Link from "next/link";
import { notFound } from "next/navigation";
import GroupDot from "@/components/GroupDot";
import { IconChevronLeft, IconFlame } from "@/components/icons";
import { getSessionUser } from "@/lib/auth";
import {
  formatDateLong,
  formatDuration,
  formatTime,
  formatVolume,
} from "@/lib/dates";
import { all, get } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export const metadata = { title: "Entrenamiento" };

export default async function WorkoutDetailPage({ params }: Params) {
  const user = await getSessionUser();
  if (!user) return null;
  const { id } = await params;
  const workoutId = Number(id);
  if (!Number.isInteger(workoutId)) notFound();

  const workout = get<{
    id: number;
    started_at: number;
    ended_at: number | null;
    duration_seconds: number | null;
    routine_day_id: number | null;
  }>(
    "SELECT id, started_at, ended_at, duration_seconds, routine_day_id FROM workouts WHERE id = ? AND user_id = ?",
    workoutId,
    user.id,
  );
  if (!workout) notFound();

  const title =
    get<{ name: string }>(
      `SELECT r.name FROM routine_days rd JOIN routines r ON r.id = rd.routine_id WHERE rd.id = ?`,
      workout.routine_day_id ?? -1,
    )?.name ?? "Entreno libre";

  const exercises = all<{
    we_id: number;
    name: string;
    muscle_group_id: number;
  }>(
    `SELECT we.id AS we_id, e.name, e.muscle_group_id
     FROM workout_exercises we JOIN exercises e ON e.id = we.exercise_id
     WHERE we.workout_id = ? ORDER BY we.position`,
    workoutId,
  );
  const sets = all<{
    workout_exercise_id: number;
    set_number: number;
    reps: number;
    weight: number;
  }>(
    `SELECT s.workout_exercise_id, s.set_number, s.reps, s.weight
     FROM workout_sets s JOIN workout_exercises we ON we.id = s.workout_exercise_id
     WHERE we.workout_id = ? ORDER BY s.set_number`,
    workoutId,
  );

  const totalVolume = sets.reduce((a, s) => a + s.reps * s.weight, 0);
  const byExercise = new Map<number, typeof sets>();
  for (const s of sets) {
    const list = byExercise.get(s.workout_exercise_id) ?? [];
    list.push(s);
    byExercise.set(s.workout_exercise_id, list);
  }

  return (
    <main className="flex flex-col gap-5">
      <header className="flex items-center gap-2">
        <Link
          href="/history"
          aria-label="Volver"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-mute"
        >
          <IconChevronLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight">{title}</h1>
          <p className="text-xs text-mute capitalize">
            {formatDateLong(workout.started_at)}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-2.5">
        <div className="card flex flex-col items-center gap-1 p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-mute">
            Duración
          </span>
          <span className="text-lg font-bold">
            {formatDuration(workout.duration_seconds)}
          </span>
        </div>
        <div className="card flex flex-col items-center gap-1 p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-mute">
            Volumen
          </span>
          <span className="text-lg font-bold">{formatVolume(totalVolume)}</span>
        </div>
        <div className="card flex flex-col items-center gap-1 p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-mute">
            Series
          </span>
          <span className="text-lg font-bold">{sets.length}</span>
        </div>
      </section>

      {workout.ended_at != null && (
        <p className="-mt-2 flex items-center justify-center gap-1.5 text-xs text-mute">
          <IconFlame className="h-3.5 w-3.5" />
          {formatTime(workout.started_at)} – {formatTime(workout.ended_at)}
        </p>
      )}

      {exercises.length === 0 && (
        <p className="card p-6 text-center text-sm text-mute">
          Entreno sin ejercicios registrados.
        </p>
      )}

      {exercises.map((ex) => {
        const rows = byExercise.get(ex.we_id) ?? [];
        const vol = rows.reduce((a, s) => a + s.reps * s.weight, 0);
        return (
          <section key={ex.we_id} className="card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <GroupDot groupId={ex.muscle_group_id} />
              <h3 className="min-w-0 flex-1 truncate font-semibold">
                {ex.name}
              </h3>
              <span className="text-xs font-semibold text-mute">
                {formatVolume(vol)}
              </span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {rows.map((s) => (
                  <tr
                    key={s.set_number}
                    className="border-b border-line last:border-b-0"
                  >
                    <td className="px-4 py-2.5 text-xs font-semibold text-mute">
                      S{s.set_number}
                    </td>
                    <td className="py-2.5 text-right font-semibold tabular-nums">
                      {s.reps}
                    </td>
                    <td className="w-8 py-2.5 text-center text-xs text-mute">
                      ×
                    </td>
                    <td className="py-2.5 pr-4 font-semibold tabular-nums">
                      {s.weight} kg
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-3 text-center text-xs text-mute"
                    >
                      Sin series registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        );
      })}
    </main>
  );
}
