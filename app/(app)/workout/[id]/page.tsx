import { notFound, redirect } from "next/navigation";
import WorkoutSession from "@/components/WorkoutSession";
import { getSessionUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import {
  getLastSetForExercise,
  getUserExercises,
  getUserGroups,
  getWorkoutSets,
} from "@/lib/queries";

type Params = { params: Promise<{ id: string }> };

export const metadata = { title: "Entrenamiento" };

export default async function WorkoutPage({ params }: Params) {
  const user = await getSessionUser();
  if (!user) return null;
  const { id } = await params;
  const workoutId = Number(id);
  if (!Number.isInteger(workoutId)) notFound();

  const workout = get<{
    id: number;
    started_at: number;
    ended_at: number | null;
    routine_day_id: number | null;
  }>(
    "SELECT id, started_at, ended_at, routine_day_id FROM workouts WHERE id = ? AND user_id = ?",
    workoutId,
    user.id,
  );
  if (!workout) notFound();
  if (workout.ended_at != null) redirect(`/history/${workoutId}`);

  const title =
    get<{ name: string }>(
      `SELECT r.name FROM routine_days rd JOIN routines r ON r.id = rd.routine_id WHERE rd.id = ?`,
      workout.routine_day_id ?? -1,
    )?.name ?? "Entreno libre";

  const weRows = all<{
    id: number;
    exercise_id: number;
    name: string;
    muscle_group_id: number;
    position: number;
  }>(
    `SELECT we.id, we.exercise_id, e.name, e.muscle_group_id, we.position
     FROM workout_exercises we JOIN exercises e ON e.id = we.exercise_id
     WHERE we.workout_id = ? ORDER BY we.position`,
    workoutId,
  );
  const targetMap = new Map<number, number | null>();
  if (workout.routine_day_id != null) {
    for (const row of all<{ exercise_id: number; target_sets: number | null }>(
      "SELECT exercise_id, target_sets FROM routine_exercises WHERE routine_day_id = ?",
      workout.routine_day_id,
    )) {
      targetMap.set(row.exercise_id, row.target_sets);
    }
  }

  const setsByWe = new Map<
    number,
    { id: number; reps: number; weight: number }[]
  >();
  for (const s of getWorkoutSets(workoutId)) {
    const list = setsByWe.get(s.workout_exercise_id) ?? [];
    list.push({ id: s.id, reps: s.reps, weight: s.weight });
    setsByWe.set(s.workout_exercise_id, list);
  }

  const exercises = weRows.map((we) => ({
    id: we.id,
    exercise_id: we.exercise_id,
    name: we.name,
    muscle_group_id: we.muscle_group_id,
    position: we.position,
    target_sets: targetMap.get(we.exercise_id) ?? null,
    prev: getLastSetForExercise(user.id, we.exercise_id),
    sets: (setsByWe.get(we.id) ?? []).sort((a, b) => a.id - b.id),
  }));

  return (
    <WorkoutSession
      workoutId={workoutId}
      startedAt={workout.started_at}
      title={title}
      initialExercises={exercises}
      groups={getUserGroups()}
      exercises={getUserExercises(user.id)}
    />
  );
}
