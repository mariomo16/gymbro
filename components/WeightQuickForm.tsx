"use client";

import { useState, useTransition } from "react";
import { IconCheck } from "@/components/icons";
import { saveWeightAction } from "@/lib/actions/weight";

export default function WeightQuickForm({
  date,
  existing,
}: {
  date: string;
  existing?: number | null;
}) {
  const [kg, setKg] = useState(existing != null ? String(existing) : "");
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function save() {
    start(async () => {
      const r = await saveWeightAction({
        date,
        weight: Number(kg.replace(",", ".")),
      });
      if (r.ok) {
        setError(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 1600);
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            value={kg}
            onChange={(e) => setKg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            inputMode="decimal"
            placeholder="72.5"
            aria-label="Peso en kg"
            className="input h-12 pr-9 text-lg font-semibold"
          />
          <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-mute">
            kg
          </span>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={pending || !kg.trim()}
          aria-label="Guardar peso"
          className={`h-12 w-14 shrink-0 rounded-[0.875rem] bg-accent text-black disabled:opacity-40 ${
            saved ? "" : ""
          }`}
        >
          {pending ? (
            <span className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-black/25 border-t-black/70" />
          ) : saved ? (
            <IconCheck className="mx-auto h-6 w-6" />
          ) : (
            <span className="text-sm font-bold">OK</span>
          )}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
