"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/exercises";
import { getSessionUser } from "@/lib/auth";
import { get, run, tx } from "@/lib/db";

export type RoutineInput = {
  id?: number;
  name: string;
  days: {
    weekday: number;
    exercises: { exerciseId: number; targetSets: number | null }[];
  }[];
};

export async function saveRoutineAction(
  input: RoutineInput,
): Promise<ActionResult<{ id: number }>> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const name = input.name.trim();
  if (name.length < 1 || name.length > 60) {
    return { ok: false, error: "Ponle un nombre a la rutina." };
  }

  const seenWeekdays = new Set<number>();
  for (const day of input.days) {
    const wd = Number(day.weekday);
    if (!Number.isInteger(wd) || wd < 0 || wd > 6)
      return { ok: false, error: "Día inválido." };
    if (seenWeekdays.has(wd)) return { ok: false, error: "Día duplicado." };
    seenWeekdays.add(wd);
    if (!day.exercises.length)
      return { ok: false, error: "Cada día necesita al menos un ejercicio." };
    for (const row of day.exercises) {
      const exists = get<{ id: number }>(
        "SELECT id FROM exercises WHERE id = ?",
        Number(row.exerciseId),
      );
      if (!exists)
        return { ok: false, error: "Hay ejercicios que no existen." };
      const ts = row.targetSets == null ? null : Number(row.targetSets);
      if (ts != null && (!Number.isInteger(ts) || ts < 1 || ts > 30)) {
        return { ok: false, error: "Series objetivo entre 1 y 30." };
      }
    }
  }
  if (!input.days.length)
    return { ok: false, error: "Elige al menos un día de entrenamiento." };

  let routineId: number;
  if (input.id != null) {
    const owned = get<{ id: number }>(
      "SELECT id FROM routines WHERE id = ? AND user_id = ?",
      Number(input.id),
      user.id,
    );
    if (!owned) return { ok: false, error: "Rutina no encontrada." };
    routineId = owned.id;
    tx(() => {
      run("DELETE FROM routine_days WHERE routine_id = ?", routineId);
      run("UPDATE routines SET name = ? WHERE id = ?", name, routineId);
      insertDays(routineId, input.days);
    });
  } else {
    routineId = tx(() => {
      const r = run(
        "INSERT INTO routines (user_id, name, created_at) VALUES (?, ?, ?)",
        user.id,
        name,
        Date.now(),
      );
      insertDays(r.lastInsertRowid, input.days);
      return r.lastInsertRowid;
    });
  }

  revalidatePath("/routines");
  revalidatePath("/");
  return { ok: true, data: { id: routineId } };
}

function insertDays(routineId: number, days: RoutineInput["days"]) {
  days.sort((a, b) => a.weekday - b.weekday);
  for (const day of days) {
    const rd = run(
      "INSERT INTO routine_days (routine_id, weekday) VALUES (?, ?)",
      routineId,
      day.weekday,
    );
    day.exercises.forEach((row, i) => {
      run(
        "INSERT INTO routine_exercises (routine_day_id, exercise_id, position, target_sets) VALUES (?, ?, ?, ?)",
        rd.lastInsertRowid,
        row.exerciseId,
        i,
        row.targetSets == null ? null : Number(row.targetSets),
      );
    });
  }
}

export async function deleteRoutineAction(
  routineId: number,
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "No autenticado." };
  const r = run(
    "DELETE FROM routines WHERE id = ? AND user_id = ?",
    routineId,
    user.id,
  );
  if (!r.changes) return { ok: false, error: "Rutina no encontrada." };
  revalidatePath("/routines");
  revalidatePath("/");
  return { ok: true };
}
