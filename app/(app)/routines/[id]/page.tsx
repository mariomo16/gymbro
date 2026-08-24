import Link from "next/link";
import { notFound } from "next/navigation";
import { IconChevronLeft } from "@/components/icons";
import RoutineBuilder from "@/components/RoutineBuilder";
import { getSessionUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { getExercises, getUserGroups } from "@/lib/queries";

type Params = { params: Promise<{ id: string }> };

export const metadata = { title: "Editar rutina" };

export default async function EditRoutinePage({ params }: Params) {
  const user = await getSessionUser();
  if (!user) return null;
  const { id } = await params;
  const routineId = Number(id);
  if (!Number.isInteger(routineId)) notFound();

  const routine = get<{ id: number; name: string }>(
    "SELECT id, name FROM routines WHERE id = ? AND user_id = ?",
    routineId,
    user.id,
  );
  if (!routine) notFound();

  const dayRows = all<{
    weekday: number;
    exercise_id: number;
    target_sets: number | null;
    target_reps_min: number | null;
    target_reps_max: number | null;
    position: number;
  }>(
    `SELECT rd.weekday, rex.exercise_id, rex.target_sets, rex.target_reps_min, rex.target_reps_max, rex.position
     FROM routine_days rd JOIN routine_exercises rex ON rex.routine_day_id = rd.id
     WHERE rd.routine_id = ? ORDER BY rd.weekday, rex.position`,
    routineId,
  );
  const exercises = getExercises();
  const byId = new Map(exercises.map((e) => [e.id, e]));

  const groupedDays = new Map<
    number,
    {
      exercise: (typeof exercises)[number];
      targetSets: number | null;
      targetRepsMin: number | null;
      targetRepsMax: number | null;
    }[]
  >();
  for (const row of dayRows) {
    const exercise = byId.get(row.exercise_id);
    if (!exercise) continue;
    const list = groupedDays.get(row.weekday) ?? [];
    list.push({
      exercise,
      targetSets: row.target_sets,
      targetRepsMin: row.target_reps_min,
      targetRepsMax: row.target_reps_max,
    });
    groupedDays.set(row.weekday, list);
  }

  return (
    <main className="flex flex-col gap-5">
      <header className="flex items-center gap-2">
        <Link
          href="/routines"
          aria-label="Volver"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-mute"
        >
          <IconChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="truncate text-2xl font-bold tracking-tight">
          {routine.name}
        </h1>
      </header>
      <RoutineBuilder
        groups={getUserGroups()}
        exercises={exercises}
        initial={{
          id: routine.id,
          name: routine.name,
          days: [...groupedDays.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([weekday, rows]) => ({ weekday, rows })),
        }}
      />
    </main>
  );
}
