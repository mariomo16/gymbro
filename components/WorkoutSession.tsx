"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import ExerciseSheet from "@/components/ExerciseSheet";
import GroupDot from "@/components/GroupDot";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconTrash,
  IconX,
} from "@/components/icons";
import LiveTimer from "@/components/LiveTimer";
import {
  addWorkoutExerciseAction,
  deleteSetAction,
  discardWorkoutAction,
  finishWorkoutAction,
  logSetAction,
  removeWorkoutExerciseAction,
} from "@/lib/actions/workouts";
import { formatVolume } from "@/lib/dates";
import { formatRepRange } from "@/lib/format";
import type { ExerciseLite, MuscleGroup } from "@/lib/types";

type Row = {
  key: string;
  id: number | null;
  reps: string;
  weight: string;
  snapReps: string;
  snapWeight: string;
};

type SessionExercise = {
  id: number;
  exercise_id: number;
  name: string;
  muscle_group_id: number;
  target_sets: number | null;
  target_reps_min: number | null;
  target_reps_max: number | null;
  rows: Row[];
};

function toRows(sets: { id: number; reps: number; weight: number }[]): Row[] {
  return sets.map((s) => ({
    key: `s${s.id}`,
    id: s.id,
    reps: String(s.reps),
    weight: String(s.weight),
    snapReps: String(s.reps),
    snapWeight: String(s.weight),
  }));
}

let tempKey = 0;
function newKey() {
  return `t${++tempKey}-${Date.now()}`;
}

export default function WorkoutSession({
  workoutId,
  startedAt,
  title,
  initialExercises,
  groups,
  exercises,
}: {
  workoutId: number;
  startedAt: number;
  title: string;
  initialExercises: {
    id: number;
    exercise_id: number;
    name: string;
    muscle_group_id: number;
    target_sets: number | null;
    target_reps_min: number | null;
    target_reps_max: number | null;
    prev: { reps: number; weight: number } | null;
    sets: { id: number; reps: number; weight: number }[];
  }[];
  groups: MuscleGroup[];
  exercises: ExerciseLite[];
}) {
  const [exs, setExs] = useState<SessionExercise[]>(() =>
    initialExercises.map((we) => ({
      id: we.id,
      exercise_id: we.exercise_id,
      name: we.name,
      muscle_group_id: we.muscle_group_id,
      target_sets: we.target_sets,
      target_reps_min: we.target_reps_min,
      target_reps_max: we.target_reps_max,
      rows: toRows(we.sets),
    })),
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const totalVolume = exs.reduce(
    (acc, we) =>
      acc +
      we.rows.reduce(
        (a, r) => a + (Number(r.snapWeight) || 0) * (Number(r.snapReps) || 0),
        0,
      ),
    0,
  );
  const totalSets = exs.reduce(
    (a, we) => a + we.rows.filter((r) => r.id != null).length,
    0,
  );

  function patchRow(weId: number, key: string, patch: Partial<Row>) {
    setExs((prev) =>
      prev.map((we) =>
        we.id !== weId
          ? we
          : {
              ...we,
              rows: we.rows.map((r) =>
                r.key === key ? { ...r, ...patch } : r,
              ),
            },
      ),
    );
  }

  function addRow(we: SessionExercise) {
    const lastFilled = [...we.rows].reverse().find((r) => Number(r.reps) > 0);
    const prev = initialExercises.find((x) => x.id === we.id)?.prev ?? null;
    const reps = lastFilled?.reps ?? (prev ? String(prev.reps) : "");
    const weight = lastFilled?.weight ?? (prev ? String(prev.weight) : "");
    setExs((prevExs) =>
      prevExs.map((x) =>
        x.id === we.id
          ? {
              ...x,
              rows: [
                ...x.rows,
                {
                  key: newKey(),
                  id: null,
                  reps,
                  weight,
                  snapReps: "",
                  snapWeight: "",
                },
              ],
            }
          : x,
      ),
    );
  }

  function commit(we: SessionExercise, row: Row) {
    const reps = parseInt(row.reps, 10);
    const weight = parseFloat(row.weight.replace(",", "."));
    if (!Number.isFinite(reps) || reps < 1) return;
    if (!Number.isFinite(weight) || weight < 0) return;
    if (
      row.id != null &&
      row.reps === row.snapReps &&
      row.weight === row.snapWeight
    )
      return;

    start(async () => {
      const r = await logSetAction({
        setId: row.id,
        workoutExerciseId: we.id,
        reps,
        weight,
      });
      if (r.ok && r.data) {
        patchRow(we.id, row.key, {
          id: r.data.id,
          key: `s${r.data.id}`,
          snapReps: row.reps,
          snapWeight: row.weight,
        });
        setError(null);
      } else if (!r.ok) {
        setError(r.error);
      }
    });
  }

  function delSet(weId: number, row: Row) {
    setExs((prev) =>
      prev.map((we) =>
        we.id === weId
          ? { ...we, rows: we.rows.filter((r) => r.key !== row.key) }
          : we,
      ),
    );
    const setId = row.id;
    if (setId == null) return;
    start(async () => {
      const r = await deleteSetAction(setId);
      if (!r.ok) setError(r.error);
    });
  }

  function removeExercise(we: SessionExercise) {
    if (!window.confirm(`¿Quitar ${we.name} del entrenamiento?`)) return;
    setExs((prev) => prev.filter((x) => x.id !== we.id));
    start(async () => {
      const r = await removeWorkoutExerciseAction(we.id);
      if (!r.ok) setError(r.error);
    });
  }

  function toggleCollapse(weId: number) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(weId)) {
        next.delete(weId);
      } else {
        next.add(weId);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="sticky top-0 z-30 -mx-5 border-b border-line bg-bg/90 px-5 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            aria-label="Volver"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-mute"
          >
            <IconChevronLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-bold">{title}</p>
            <p className="text-[11px] text-mute">
              {totalSets} series · {formatVolume(totalVolume)}
            </p>
          </div>
          <button
            type="button"
            aria-label="Descartar entreno"
            onClick={() => {
              if (
                window.confirm(
                  "¿Descartar este entrenamiento? Se borrará todo.",
                )
              ) {
                start(() => discardWorkoutAction(workoutId));
              }
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-mute"
          >
            <IconTrash className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex flex-col items-center">
          <LiveTimer
            startedAt={startedAt}
            className="text-[44px] leading-none font-bold tracking-tight"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => start(() => finishWorkoutAction(workoutId))}
            className="btn-primary mt-3 h-11 w-full max-w-56"
          >
            Finalizar entreno
          </button>
        </div>
      </header>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
          {error}
        </p>
      )}

      {exs.length === 0 && (
        <div className="card p-6 text-center text-sm text-mute">
          Añade ejercicios para empezar a registrar series.
        </div>
      )}

      {exs.map((we) => {
        const isCollapsed = collapsed.has(we.id);
        const savedSets = we.rows.filter((r) => r.id != null).length;
        const totalSets = we.rows.length;

        return (
          <section key={we.id} className="card overflow-hidden">
            <div
              role="button"
              tabIndex={0}
              className="flex cursor-pointer items-center gap-2 border-b border-line px-4 py-3 active:bg-raised/50"
              onClick={() => toggleCollapse(we.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  toggleCollapse(we.id);
                }
              }}
            >
              <GroupDot groupId={we.muscle_group_id} />
              <h3 className="min-w-0 flex-1 truncate font-semibold">
                {we.name}
              </h3>
              {we.target_sets != null && !isCollapsed && (
                <span className="rounded-md bg-raised px-2 py-0.5 text-[11px] font-semibold text-mute">
                  {(() => {
                    const reps = formatRepRange(
                      we.target_reps_min,
                      we.target_reps_max,
                    );
                    return reps
                      ? `objetivo ${we.target_sets} × ${reps}`
                      : `objetivo ${we.target_sets} ×`;
                  })()}
                </span>
              )}
              {isCollapsed ? (
                <>
                  <span className="text-xs text-mute">
                    {savedSets}/{totalSets} series
                  </span>
                  <IconChevronDown className="h-4 w-4 text-mute" />
                </>
              ) : (
                <IconChevronRight className="h-4 w-4 text-mute" />
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeExercise(we);
                }}
                aria-label={`Quitar ${we.name}`}
                className="-mr-1.5 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-mute active:bg-raised"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>

            <div
              className="collapse-content"
              data-state={isCollapsed ? "collapsed" : "expanded"}
            >
              <div>
                <ul className="px-3 pt-2">
                  {we.rows.map((row, i) => {
                    const saved =
                      row.id != null &&
                      row.reps === row.snapReps &&
                      row.weight === row.snapWeight;
                    return (
                      <li
                        key={row.key}
                        className="mb-1.5 flex items-center gap-2"
                      >
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                            saved
                              ? "bg-accent-soft text-accent"
                              : "bg-raised text-mute"
                          }`}
                        >
                          S{i + 1}
                        </span>
                        <input
                          value={row.reps}
                          onChange={(e) =>
                            patchRow(we.id, row.key, { reps: e.target.value })
                          }
                          onBlur={() => commit(we, row)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && commit(we, row)
                          }
                          inputMode="numeric"
                          placeholder="reps"
                          aria-label="Repeticiones"
                          className={`input h-11 flex-1 px-3 text-center font-semibold ${
                            row.id != null && row.reps !== row.snapReps
                              ? "border-accent/60"
                              : ""
                          }`}
                        />
                        <span className="text-mute">×</span>
                        <input
                          value={row.weight}
                          onChange={(e) =>
                            patchRow(we.id, row.key, { weight: e.target.value })
                          }
                          onBlur={() => commit(we, row)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && commit(we, row)
                          }
                          inputMode="decimal"
                          placeholder="kg"
                          aria-label="Peso en kg"
                          className={`input h-11 w-20 px-3 text-center font-semibold ${
                            row.id != null && row.weight !== row.snapWeight
                              ? "border-accent/60"
                              : ""
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => delSet(we.id, row)}
                          aria-label="Borrar serie"
                          className="flex h-11 w-8 shrink-0 items-center justify-center rounded-xl text-mute/60 active:text-red-400"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="p-3 pt-1">
                  <button
                    type="button"
                    onClick={() => addRow(we)}
                    className="chip h-10 w-full gap-1.5 text-sm text-accent"
                  >
                    <IconPlus className="h-4 w-4" />
                    Serie
                  </button>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="btn-ghost h-12 gap-2"
      >
        <IconPlus className="h-4 w-4" />
        Añadir ejercicio
      </button>

      {sheetOpen && (
        <ExerciseSheet
          open
          onClose={() => setSheetOpen(false)}
          onPick={(exercise) => {
            start(async () => {
              const r = await addWorkoutExerciseAction(workoutId, exercise.id);
              if (!r.ok || !r.data) {
                if (!r.ok) setError(r.error);
                return;
              }
              const added = r.data;
              setExs((prev) => [
                ...prev,
                {
                  id: added.id,
                  exercise_id: added.exercise_id,
                  name: added.name,
                  muscle_group_id: added.muscle_group_id,
                  target_sets: added.target_sets,
                  target_reps_min: added.target_reps_min,
                  target_reps_max: added.target_reps_max,
                  rows: [],
                },
              ]);
              setError(null);
            });
          }}
          groups={groups}
          exercises={exercises}
          isPicked={(id) => exs.some((we) => we.exercise_id === id)}
        />
      )}

      <div className="pb-2" />
    </div>
  );
}
