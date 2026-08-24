"use client";

import { useTransition } from "react";
import { setRoutineActiveAction } from "@/lib/actions/routines";

export default function RoutineActiveToggle({
  routineId,
  active,
}: {
  routineId: number;
  active: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={active ? "Desactivar rutina" : "Activar rutina"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await setRoutineActiveAction(routineId, !active);
        })
      }
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        active ? "bg-accent" : "border border-line bg-raised"
      } ${pending ? "opacity-60" : ""}`}
    >
      <span
        className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-[left] duration-150 ${
          active ? "left-[1.375rem]" : "left-0.5"
        }`}
      />
    </button>
  );
}
