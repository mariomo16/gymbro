"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import ExerciseSheet from "@/components/ExerciseSheet";
import GroupDot from "@/components/GroupDot";
import { IconCheck, IconPlus, IconTrash, IconX } from "@/components/icons";
import { deleteRoutineAction, saveRoutineAction } from "@/lib/actions/routines";
import { DAYS_LONG, DAYS_SHORT } from "@/lib/dates";
import type { ExerciseLite, MuscleGroup } from "@/lib/types";

type BuilderRow = {
  uid: string;
  exercise: ExerciseLite;
  targetSets: number | null;
};

type Props = {
  groups: MuscleGroup[];
  exercises: ExerciseLite[];
  initial?: {
    id: number;
    name: string;
    days: {
      weekday: number;
      rows: { exercise: ExerciseLite; targetSets: number | null }[];
    }[];
  } | null;
};

const MAX_SETS = 15;
let uidCounter = 0;
function nextUid(prefix: string) {
  return `${prefix}-${++uidCounter}`;
}

export default function RoutineBuilder({ groups, exercises, initial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [enabledDays, setEnabledDays] = useState<number[]>(
    initial ? initial.days.map((d) => d.weekday).sort((a, b) => a - b) : [],
  );
  const [days, setDays] = useState<Record<number, BuilderRow[]>>(() => {
    const map: Record<number, BuilderRow[]> = {};
    for (const d of initial?.days ?? []) {
      map[d.weekday] = d.rows.map((row) => ({
        ...row,
        uid: nextUid(`init${d.weekday}`),
      }));
    }
    return map;
  });
  const [pickerDay, setPickerDay] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function toggleDay(wd: number) {
    setError(null);
    setEnabledDays((prev) =>
      prev.includes(wd)
        ? prev.filter((d) => d !== wd)
        : [...prev, wd].sort((a, b) => a - b),
    );
    setDays((prev) => ({ ...prev, [wd]: prev[wd] ?? [] }));
  }

  function addExercise(wd: number, exercise: ExerciseLite) {
    setDays((prev) => ({
      ...prev,
      [wd]: [
        ...(prev[wd] ?? []),
        { uid: nextUid(`add${wd}`), exercise, targetSets: null },
      ],
    }));
  }

  function removeRow(wd: number, index: number) {
    setDays((prev) => ({
      ...prev,
      [wd]: (prev[wd] ?? []).filter((_, i) => i !== index),
    }));
  }

  function bumpSets(wd: number, index: number, delta: number) {
    setDays((prev) => ({
      ...prev,
      [wd]: (prev[wd] ?? []).map((row, i) =>
        i === index
          ? {
              ...row,
              targetSets:
                Math.min(
                  MAX_SETS,
                  Math.max(0, (row.targetSets ?? 0) + delta),
                ) || null,
            }
          : row,
      ),
    }));
  }

  function moveUp(wd: number, index: number) {
    if (index === 0) return;
    setDays((prev) => {
      const rows = [...(prev[wd] ?? [])];
      [rows[index - 1], rows[index]] = [rows[index], rows[index - 1]];
      return { ...prev, [wd]: rows };
    });
  }

  function save() {
    setError(null);
    if (!name.trim()) return setError("Ponle un nombre a la rutina.");
    if (!enabledDays.length) return setError("Elige al menos un día.");
    for (const wd of enabledDays) {
      if (!days[wd]?.length)
        return setError(`Añade ejercicios al ${DAYS_LONG[wd].toLowerCase()}.`);
    }
    start(async () => {
      const r = await saveRoutineAction({
        id: initial?.id,
        name,
        days: enabledDays.map((wd) => ({
          weekday: wd,
          exercises: (days[wd] ?? []).map((row) => ({
            exerciseId: row.exercise.id,
            targetSets: row.targetSets,
          })),
        })),
      });
      if (r.ok) router.push("/routines");
      else setError(r.error);
    });
  }

  function removeRoutine() {
    if (!initial) return;
    if (!window.confirm("¿Borrar esta rutina?")) return;
    start(async () => {
      const r = await deleteRoutineAction(initial.id);
      if (r.ok) router.push("/routines");
      else setError(r.error);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="card p-4">
        <label
          htmlFor="routine-name"
          className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-mute"
        >
          Nombre de la rutina
        </label>
        <input
          id="routine-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ej. Torso – Pierna"
          maxLength={60}
          className="input"
        />
      </section>

      <section className="card p-4">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-mute">
          Días de entrenamiento
        </h2>
        <div className="grid grid-cols-7 gap-1.5">
          {DAYS_SHORT.map((d, wd) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(wd)}
              aria-pressed={enabledDays.includes(wd)}
              className={`chip h-12 w-full text-sm ${
                enabledDays.includes(wd) ? "chip-active" : ""
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      {enabledDays.map((wd) => {
        const rows = days[wd] ?? [];
        return (
          <section key={wd} className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h3 className="text-sm font-bold">{DAYS_LONG[wd]}</h3>
              <span className="text-xs text-mute">
                {rows.length} ejercicios
              </span>
            </div>

            <ul>
              {rows.map((row, i) => (
                <li
                  key={row.uid}
                  className="border-b border-line px-4 py-3 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <GroupDot groupId={row.exercise.muscle_group_id} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {row.exercise.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRow(wd, i)}
                      aria-label="Quitar ejercicio"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-mute active:bg-raised"
                    >
                      <IconX className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2 pl-[18px]">
                    <span className="text-xs text-mute">Series objetivo</span>
                    <div className="ml-auto flex items-center gap-1 rounded-full border border-line bg-raised p-0.5">
                      <button
                        type="button"
                        onClick={() => bumpSets(wd, i, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-mute active:bg-card"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-xs font-bold tabular-nums">
                        {row.targetSets == null ? "—" : row.targetSets}
                      </span>
                      <button
                        type="button"
                        onClick={() => bumpSets(wd, i, 1)}
                        disabled={
                          (row.targetSets ?? 0) >= MAX_SETS &&
                          row.targetSets != null
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-full text-mute active:bg-card disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => moveUp(wd, i)}
                      disabled={i === 0}
                      className="rounded-lg px-1.5 py-1 text-[10px] font-bold uppercase tracking-wide text-mute disabled:opacity-20"
                    >
                      ↑
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => setPickerDay(wd)}
              className="chip m-3 h-11 w-[calc(100%-1.5rem)] gap-2 text-sm text-accent"
            >
              <IconPlus className="h-4 w-4" />
              Añadir ejercicio
            </button>
          </section>
        );
      })}

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="sticky bottom-24 flex flex-col gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="btn-primary h-13 w-full shadow-xl"
        >
          {pending ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/25 border-t-black/70" />
          ) : (
            <>
              <IconCheck className="h-5 w-5" />
              Guardar rutina
            </>
          )}
        </button>
        {initial && (
          <button
            type="button"
            onClick={removeRoutine}
            disabled={pending}
            className="btn-ghost h-11 w-full text-sm text-red-400"
          >
            <IconTrash className="h-4 w-4" />
            Borrar rutina
          </button>
        )}
      </div>

      {pickerDay != null && (
        <ExerciseSheet
          open
          onClose={() => setPickerDay(null)}
          onPick={(exercise) =>
            pickerDay != null && addExercise(pickerDay, exercise)
          }
          groups={groups}
          exercises={exercises}
          isPicked={(id) =>
            (days[pickerDay] ?? []).some((r) => r.exercise.id === id)
          }
        />
      )}
    </div>
  );
}
