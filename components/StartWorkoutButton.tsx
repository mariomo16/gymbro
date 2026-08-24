"use client";

import { useState, useTransition } from "react";
import { IconPlay } from "@/components/icons";
import { startWorkoutAction } from "@/lib/actions/workouts";

export default function StartWorkoutButton({
  routineDayId,
  label = "Empezar entreno",
  compact = false,
}: {
  routineDayId?: number | null;
  label?: string;
  compact?: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={compact ? "" : "w-full"}>
      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await startWorkoutAction({
              routineDayId: routineDayId ?? null,
            });
            if (!r.ok) setError(r.error);
          })
        }
        className={`btn-primary ${compact ? "h-10 px-4 text-sm" : "h-12 w-full"}`}
      >
        {pending ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/25 border-t-black/70" />
        ) : (
          <>
            <IconPlay className="h-4 w-4" />
            {label}
          </>
        )}
      </button>
    </div>
  );
}
