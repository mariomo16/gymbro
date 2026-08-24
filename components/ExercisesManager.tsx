"use client";

import { useMemo, useState, useTransition } from "react";
import GroupDot from "@/components/GroupDot";
import { IconPlus, IconTrash } from "@/components/icons";
import {
  createExerciseAction,
  deleteExerciseAction,
} from "@/lib/actions/exercises";
import type { ExerciseLite, MuscleGroup } from "@/lib/types";

export default function ExercisesManager({
  groups,
  exercises,
}: {
  groups: MuscleGroup[];
  exercises: ExerciseLite[];
}) {
  const [name, setName] = useState("");
  const [groupId, setGroupId] = useState<number>(groups[0]?.id ?? 1);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const grouped = useMemo(
    () =>
      groups
        .map((g) => ({
          group: g,
          items: exercises.filter((e) => e.muscle_group_id === g.id),
        }))
        .filter((g) => g.items.length > 0),
    [groups, exercises],
  );

  function create() {
    start(async () => {
      const r = await createExerciseAction({ name, muscleGroupId: groupId });
      if (r.ok) {
        setName("");
        setError(null);
      } else {
        setError(r.error);
      }
    });
  }

  function remove(id: number) {
    if (!window.confirm("¿Borrar este ejercicio?")) return;
    setDeletingId(id);
    start(async () => {
      const r = await deleteExerciseAction(id);
      if (!r.ok) setError(r.error);
      setDeletingId(null);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="card p-4">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-mute">
          Nuevo ejercicio
        </h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && name.trim().length >= 2 && create()
          }
          placeholder="Nombre (ej. Press banca)"
          maxLength={60}
          autoCapitalize="none"
          className="input mb-2"
        />
        <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGroupId(g.id)}
              className={`chip h-9 shrink-0 px-3.5 text-xs ${groupId === g.id ? "chip-active" : ""}`}
            >
              {g.name}
            </button>
          ))}
        </div>
        {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
        <button
          type="button"
          onClick={create}
          disabled={pending || name.trim().length < 2}
          className="btn-primary h-12 w-full"
        >
          <IconPlus className="h-4 w-4" />
          Crear ejercicio
        </button>
      </section>

      {grouped.length === 0 && (
        <p className="card p-6 text-center text-sm text-mute">
          Todavía no tienes ejercicios. Crea el primero arriba.
        </p>
      )}

      {grouped.map(({ group, items }) => (
        <section key={group.id}>
          <h2 className="mb-1.5 flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-widest text-mute">
            <GroupDot groupId={group.id} />
            {group.name}
            <span className="text-mute/50">· {items.length}</span>
          </h2>
          <ul className="overflow-hidden rounded-[1.25rem] border border-line">
            {items.map((e) => (
              <li
                key={e.id}
                className="flex h-13 items-center gap-3 border-b border-line bg-card px-4 last:border-b-0"
              >
                <span className="flex-1 truncate text-sm font-medium">
                  {e.name}
                </span>
                <button
                  type="button"
                  onClick={() => remove(e.id)}
                  disabled={deletingId === e.id && pending}
                  aria-label={`Borrar ${e.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-mute active:bg-raised"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
