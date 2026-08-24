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
    "SELECT id FROM exercises WHERE name = ? COLLATE NOCASE",
    name,
  );
  if (dup)
    return { ok: false, error: "Ya existe un ejercicio con ese nombre." };

  const r = run(
    "INSERT INTO exercises (muscle_group_id, name, created_at) VALUES (?, ?, ?)",
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

  const exists = get<{ id: number }>(
    "SELECT id FROM exercises WHERE id = ?",
    exerciseId,
  );
  if (!exists) return { ok: false, error: "Ejercicio no encontrado." };

  const inRoutine = get<{ n: number }>(
    "SELECT COUNT(*) AS n FROM routine_exercises WHERE exercise_id = ?",
    exerciseId,
  );
  const inWorkout = get<{ n: number }>(
    "SELECT COUNT(*) AS n FROM workout_exercises WHERE exercise_id = ?",
    exerciseId,
  );
  if ((inRoutine?.n ?? 0) > 0 || (inWorkout?.n ?? 0) > 0) {
    return {
      ok: false,
      error: "No se puede borrar: está en uso en rutinas o entrenamientos.",
    };
  }

  run("DELETE FROM exercises WHERE id = ?", exerciseId);
  revalidatePath("/exercises");
  return { ok: true };
}
