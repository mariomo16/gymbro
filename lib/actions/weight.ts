"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/exercises";
import { getSessionUser } from "@/lib/auth";
import { run } from "@/lib/db";

export async function saveWeightAction(input: {
  date: string;
  weight: number;
}): Promise<ActionResult<{ weight: number; date: string }>> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const date = input.date.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    return { ok: false, error: "Fecha inválida." };
  const weight = Number(input.weight);
  if (!Number.isFinite(weight) || weight < 20 || weight > 400) {
    return { ok: false, error: "Peso inválido (20–400 kg)." };
  }

  run(
    `INSERT INTO body_weights (user_id, date, weight) VALUES (?, ?, ?)
     ON CONFLICT (user_id, date) DO UPDATE SET weight = excluded.weight`,
    user.id,
    date,
    weight,
  );
  revalidatePath("/weight");
  revalidatePath("/");
  return { ok: true, data: { weight, date } };
}

export async function deleteWeightEntryAction(
  id: number,
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "No autenticado." };
  run("DELETE FROM body_weights WHERE id = ? AND user_id = ?", id, user.id);
  revalidatePath("/weight");
  return { ok: true };
}
