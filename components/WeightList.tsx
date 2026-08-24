"use client";

import { useState, useTransition } from "react";
import { IconTrash } from "@/components/icons";
import { deleteWeightEntryAction } from "@/lib/actions/weight";
import { formatDateShort } from "@/lib/dates";

export default function WeightList({
  entries,
}: {
  entries: { id: number; date: string; weight: number; diff: number | null }[];
}) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove(id: number) {
    if (!window.confirm("¿Borrar este registro?")) return;
    setDeletingId(id);
    start(async () => {
      const r = await deleteWeightEntryAction(id);
      if (!r.ok) setError(r.error);
      setDeletingId(null);
    });
  }

  return (
    <ul className="overflow-hidden rounded-[1.25rem] border border-line">
      {entries.map((e) => (
        <li
          key={e.id}
          className="flex h-13 items-center gap-3 border-b border-line bg-card px-4 last:border-b-0"
        >
          <span className="w-20 text-xs font-semibold text-mute">
            {formatDateShort(e.date)}
          </span>
          <span className="text-sm font-bold tabular-nums">
            {e.weight.toFixed(1)} kg
          </span>
          {e.diff != null && e.diff !== 0 && (
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                e.diff < 0
                  ? "bg-sky-400/10 text-sky-400"
                  : "bg-orange-400/10 text-orange-400"
              }`}
            >
              {e.diff > 0 ? "+" : ""}
              {e.diff.toFixed(1)}
            </span>
          )}
          <button
            type="button"
            onClick={() => remove(e.id)}
            disabled={deletingId === e.id && pending}
            aria-label="Borrar registro"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-mute active:bg-raised"
          >
            <IconTrash className="h-4 w-4" />
          </button>
        </li>
      ))}
      {error && (
        <li className="bg-card px-4 py-2 text-xs text-red-400">{error}</li>
      )}
    </ul>
  );
}
