"use client";

import { useMemo, useState, useTransition } from "react";
import GroupDot from "@/components/GroupDot";
import { IconCheck, IconPlus, IconSearch, IconX } from "@/components/icons";
import { createExerciseAction } from "@/lib/actions/exercises";
import type { ExerciseLite, MuscleGroup } from "@/lib/types";

export default function ExerciseSheet({
  open,
  onClose,
  onPick,
  groups,
  exercises,
  isPicked,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (exercise: ExerciseLite) => void;
  groups: MuscleGroup[];
  exercises: ExerciseLite[];
  isPicked?: (exerciseId: number) => boolean;
}) {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGroupId, setNewGroupId] = useState<number | null>(null);
  const [extra, setExtra] = useState<ExerciseLite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const allExercises = useMemo(
    () => [
      ...exercises,
      ...extra.filter((e) => !exercises.some((p) => p.id === e.id)),
    ],
    [exercises, extra],
  );
  const effectiveGroupId = newGroupId ?? groups[0]?.id ?? null;

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? allExercises.filter((e) => e.name.toLowerCase().includes(q))
      : allExercises;
    return groups
      .map((g) => ({
        group: g,
        items: filtered.filter((e) => e.muscle_group_id === g.id),
      }))
      .filter((g) => g.items.length > 0);
  }, [allExercises, groups, query]);

  if (!open) return null;

  function pick(exercise: ExerciseLite) {
    onPick(exercise);
    setQuery("");
    onClose();
  }

  function create() {
    if (!effectiveGroupId || newName.trim().length < 2) return;
    start(async () => {
      const r = await createExerciseAction({
        name: newName,
        muscleGroupId: effectiveGroupId,
      });
      if (r.ok && r.data) {
        const created = r.data;
        setExtra((prev) => [...prev, created]);
        setNewName("");
        setCreating(false);
        setError(null);
      } else if (!r.ok) {
        setError(r.error);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="fade-in absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="sheet-in relative mx-auto flex max-h-[82dvh] w-full max-w-md flex-col rounded-t-[1.75rem] border border-line bg-card">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-lg font-bold tracking-tight">Elegir ejercicio</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-raised text-mute"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pb-3">
          <div className="relative">
            <IconSearch className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-mute" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar…"
              autoCapitalize="none"
              className="input pl-10"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
          {creating ? (
            <div className="mb-4 rounded-2xl border border-line bg-raised p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-mute">
                Nuevo ejercicio
              </p>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre del ejercicio"
                maxLength={60}
                className="input mb-2"
              />
              <select
                value={effectiveGroupId ?? ""}
                onChange={(e) => setNewGroupId(Number(e.target.value))}
                className="input mb-3 appearance-none"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="btn-ghost h-11 flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={create}
                  disabled={pending || newName.trim().length < 2}
                  className="btn-primary h-11 flex-1"
                >
                  {pending ? "Creando…" : "Crear"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setNewName(query.trim());
                setCreating(true);
              }}
              className="chip mb-4 h-11 w-full gap-2 px-4 text-sm text-accent"
            >
              <IconPlus className="h-4 w-4" />
              Crear ejercicio nuevo
            </button>
          )}

          {grouped.length === 0 && !creating && (
            <p className="py-8 text-center text-sm text-mute">Sin resultados</p>
          )}

          {grouped.map(({ group, items }) => (
            <div key={group.id} className="mb-4">
              <p className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-mute">
                <GroupDot groupId={group.id} />
                {group.name}
              </p>
              <ul className="overflow-hidden rounded-2xl border border-line">
                {items.map((e) => {
                  const picked = isPicked?.(e.id);
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => !picked && pick(e)}
                        className={`flex h-12 w-full items-center gap-3 border-b border-line px-4 text-left last:border-b-0 ${
                          picked ? "bg-raised/50" : "bg-card active:bg-raised"
                        }`}
                      >
                        <GroupDot groupId={e.muscle_group_id} />
                        <span
                          className={`flex-1 truncate text-sm ${picked ? "text-mute line-through" : ""}`}
                        >
                          {e.name}
                        </span>
                        {picked && (
                          <span className="text-accent">
                            <IconCheck className="h-4 w-4" />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
