"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/actions/exercises";
import { getSessionUser } from "@/lib/auth";
import { all, get, run } from "@/lib/db";
import type { WorkoutExercise, WorkoutSet } from "@/lib/types";

function getOwnedWorkout(userId: number, workoutId: number) {
  return get<{
    id: number;
    ended_at: number | null;
    routine_day_id: number | null;
  }>(
    "SELECT id, ended_at, routine_day_id FROM workouts WHERE id = ? AND user_id = ?",
    workoutId,
    userId,
  );
}

export async function startWorkoutAction(input: {
  routineDayId?: number | null;
}): Promise<ActionResult<{ id: number }>> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const active = getActive(user.id);
  if (active) return { ok: true, data: { id: active } };

  let routineDayId: number | null = null;
  if (input.routineDayId != null) {
    const day = get<{ id: number }>(
      `SELECT rd.id FROM routine_days rd JOIN routines r ON r.id = rd.routine_id
       WHERE rd.id = ? AND r.user_id = ?`,
      input.routineDayId,
      user.id,
    );
    if (!day) return { ok: false, error: "Ese día de rutina no existe." };
    routineDayId = day.id;
  }

  const r = run(
    "INSERT INTO workouts (user_id, routine_day_id, started_at) VALUES (?, ?, ?)",
    user.id,
    routineDayId,
    Date.now(),
  );

  if (routineDayId != null) {
    const ids = getPlannedExerciseIds(routineDayId);
    ids.forEach((exerciseId, i) => {
      run(
        "INSERT INTO workout_exercises (workout_id, exercise_id, position) VALUES (?, ?, ?)",
        r.lastInsertRowid,
        exerciseId,
        i,
      );
    });
  }

  revalidatePath("/");
  redirect(`/workout/${r.lastInsertRowid}`);
}

function getActive(userId: number): number | null {
  const row = get<{ id: number }>(
    "SELECT id FROM workouts WHERE user_id = ? AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1",
    userId,
  );
  return row?.id ?? null;
}

function getPlannedExerciseIds(routineDayId: number): number[] {
  return all<number | { exercise_id: number }>(
    "SELECT exercise_id FROM routine_exercises WHERE routine_day_id = ? ORDER BY position",
    routineDayId,
  ).map((r) =>
    typeof r === "object" && r !== null ? Number(r.exercise_id) : Number(r),
  );
}

export async function finishWorkoutAction(workoutId: number): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  const workout = getOwnedWorkout(user.id, workoutId);
  if (!workout || workout.ended_at != null) return;

  const endedAt = Date.now();
  run(
    "UPDATE workouts SET ended_at = ?, duration_seconds = ? WHERE id = ?",
    endedAt,
    Math.max(
      1,
      Math.round((endedAt - (getStart(workoutId) ?? endedAt)) / 1000),
    ),
    workoutId,
  );
  revalidatePath("/history");
  revalidatePath("/");
  redirect(`/history/${workoutId}`);
}

function getStart(workoutId: number): number | null {
  return (
    get<{ started_at: number }>(
      "SELECT started_at FROM workouts WHERE id = ?",
      workoutId,
    )?.started_at ?? null
  );
}

export async function discardWorkoutAction(workoutId: number): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  run("DELETE FROM workouts WHERE id = ? AND user_id = ?", workoutId, user.id);
  revalidatePath("/");
  redirect("/");
}

export async function addWorkoutExerciseAction(
  workoutId: number,
  exerciseId: number,
): Promise<ActionResult<WorkoutExercise>> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "No autenticado." };
  const workout = getOwnedWorkout(user.id, workoutId);
  if (!workout || workout.ended_at != null)
    return { ok: false, error: "Entrenamiento no activo." };

  const exercise = get<{ id: number; name: string; muscle_group_id: number }>(
    "SELECT id, name, muscle_group_id FROM exercises WHERE id = ? AND user_id = ?",
    exerciseId,
    user.id,
  );
  if (!exercise) return { ok: false, error: "Ejercicio no encontrado." };

  const dup = get<{ id: number }>(
    "SELECT id FROM workout_exercises WHERE workout_id = ? AND exercise_id = ?",
    workoutId,
    exerciseId,
  );
  if (dup) return { ok: false, error: "Ya está en este entrenamiento." };

  const pos =
    get<{ p: number }>(
      "SELECT COALESCE(MAX(position), -1) + 1 AS p FROM workout_exercises WHERE workout_id = ?",
      workoutId,
    )?.p ?? 0;

  const target =
    workout.routine_day_id == null
      ? null
      : (get<{ target_sets: number | null }>(
          `SELECT rex.target_sets FROM routine_exercises rex
       JOIN routine_days rd ON rd.id = rex.routine_day_id
       JOIN routines r ON r.id = rd.routine_id
       WHERE rd.id = ? AND rex.exercise_id = ?`,
          workout.routine_day_id,
          exerciseId,
        )?.target_sets ?? null);

  const r = run(
    "INSERT INTO workout_exercises (workout_id, exercise_id, position) VALUES (?, ?, ?)",
    workoutId,
    exerciseId,
    pos,
  );
  revalidatePath(`/workout/${workoutId}`);
  return {
    ok: true,
    data: {
      id: r.lastInsertRowid,
      exercise_id: exercise.id,
      name: exercise.name,
      muscle_group_id: exercise.muscle_group_id,
      position: pos,
      target_sets: target,
    },
  };
}

export async function removeWorkoutExerciseAction(
  weId: number,
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "No autenticado." };
  const owned = get<{ we: number }>(
    `SELECT we.id AS we FROM workout_exercises we
     JOIN workouts w ON w.id = we.workout_id
     WHERE we.id = ? AND w.user_id = ? AND w.ended_at IS NULL`,
    weId,
    user.id,
  );
  if (!owned) return { ok: false, error: "No encontrado." };
  run("DELETE FROM workout_exercises WHERE id = ?", weId);
  return { ok: true };
}

export async function logSetAction(input: {
  setId?: number | null;
  workoutExerciseId: number;
  reps: number;
  weight: number;
}): Promise<ActionResult<WorkoutSet>> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const reps = Math.round(Number(input.reps));
  const weight = Number(input.weight);
  if (!Number.isFinite(reps) || reps < 1 || reps > 500) {
    return { ok: false, error: "Repeticiones inválidas." };
  }
  if (!Number.isFinite(weight) || weight < 0 || weight > 1000) {
    return { ok: false, error: "Peso inválido." };
  }

  const we = get<{ id: number; workout_id: number }>(
    `SELECT we.id, we.workout_id FROM workout_exercises we
     JOIN workouts w ON w.id = we.workout_id
     WHERE we.id = ? AND w.user_id = ? AND w.ended_at IS NULL`,
    input.workoutExerciseId,
    user.id,
  );
  if (!we)
    return { ok: false, error: "Ejercicio no encontrado en el entrenamiento." };

  if (input.setId != null) {
    const owned = get<{ id: number }>(
      `SELECT s.id FROM workout_sets s JOIN workout_exercises we ON we.id = s.workout_exercise_id
       JOIN workouts w ON w.id = we.workout_id
       WHERE s.id = ? AND w.user_id = ?`,
      input.setId,
      user.id,
    );
    if (!owned) return { ok: false, error: "Serie no encontrada." };
    run(
      "UPDATE workout_sets SET reps = ?, weight = ? WHERE id = ?",
      reps,
      weight,
      input.setId,
    );
    return {
      ok: true,
      data: {
        id: input.setId,
        workout_exercise_id: we.id,
        set_number: getSetNumber(input.setId),
        reps,
        weight,
      },
    };
  }

  const nextNumber =
    get<{ n: number }>(
      "SELECT COALESCE(MAX(set_number), 0) + 1 AS n FROM workout_sets WHERE workout_exercise_id = ?",
      we.id,
    )?.n ?? 1;
  const r = run(
    "INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight) VALUES (?, ?, ?, ?)",
    we.id,
    nextNumber,
    reps,
    weight,
  );
  return {
    ok: true,
    data: {
      id: r.lastInsertRowid,
      workout_exercise_id: we.id,
      set_number: nextNumber,
      reps,
      weight,
    },
  };
}

function getSetNumber(setId: number): number {
  return (
    get<{ set_number: number }>(
      "SELECT set_number FROM workout_sets WHERE id = ?",
      setId,
    )?.set_number ?? 1
  );
}

export async function deleteSetAction(setId: number): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "No autenticado." };
  const r = run(
    `DELETE FROM workout_sets WHERE id IN (
       SELECT s.id FROM workout_sets s
       JOIN workout_exercises we ON we.id = s.workout_exercise_id
       JOIN workouts w ON w.id = we.workout_id
       WHERE s.id = ? AND w.user_id = ? AND w.ended_at IS NULL
     )`,
    setId,
    user.id,
  );
  if (!r.changes) return { ok: false, error: "Serie no encontrada." };
  return { ok: true };
}
