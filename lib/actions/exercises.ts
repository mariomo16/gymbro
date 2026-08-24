"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { get, run } from "@/lib/db";
import type { ExerciseLite } from "@/lib/types";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export async function createExerciseAction(input: {
  name: string;
  muscleGroupId: number;
}): Promise<ActionResult<ExerciseLite>> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const name = input.name.trim();
  if (name.length < 2 || name.length > 60) {
    return {
      ok: false,
      error: "El nombre debe tener entre 2 y 60 caracteres.",
    };
  }
  const group = get<{ id: number }>(
    "SELECT id FROM muscle_groups WHERE id = ?",
    Number(input.muscleGroupId),
  );
  if (!group) return { ok: false, error: "Grupo muscular inválido." };

  const dup = get<{ id: number }>(
    "SELECT id FROM exercises WHERE user_id = ? AND name = ? COLLATE NOCASE",
    user.id,
    name,
  );
  if (dup)
    return { ok: false, error: "Ya tienes un ejercicio con ese nombre." };

  const r = run(
    "INSERT INTO exercises (user_id, muscle_group_id, name, created_at) VALUES (?, ?, ?, ?)",
    user.id,
    group.id,
    name,
    Date.now(),
  );
  revalidatePath("/exercises");
  return {
    ok: true,
    data: { id: r.lastInsertRowid, name, muscle_group_id: group.id },
  };
}

export async function deleteExerciseAction(
  exerciseId: number,
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const owned = get<{ id: number }>(
    "SELECT id FROM exercises WHERE id = ? AND user_id = ?",
    exerciseId,
    user.id,
  );
  if (!owned) return { ok: false, error: "Ejercicio no encontrado." };

  const inRoutine = get<{ n: number }>(
    `SELECT COUNT(*) AS n FROM routine_exercises rex
     JOIN routine_days rd ON rd.id = rex.routine_day_id
     JOIN routines r ON r.id = rd.routine_id
     WHERE rex.exercise_id = ? AND r.user_id = ?`,
    exerciseId,
    user.id,
  );
  const inWorkout = get<{ n: number }>(
    `SELECT COUNT(*) AS n FROM workout_exercises we
     JOIN workouts w ON w.id = we.workout_id
     WHERE we.exercise_id = ? AND w.user_id = ?`,
    exerciseId,
    user.id,
  );
  if ((inRoutine?.n ?? 0) > 0 || (inWorkout?.n ?? 0) > 0) {
    return {
      ok: false,
      error: "No puedes borrarlo: está usado en rutinas o entrenamientos.",
    };
  }

  run(
    "DELETE FROM exercises WHERE id = ? AND user_id = ?",
    exerciseId,
    user.id,
  );
  revalidatePath("/exercises");
  return { ok: true };
}
