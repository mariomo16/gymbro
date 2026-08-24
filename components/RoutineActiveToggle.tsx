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
      disabled={pending}
      aria-pressed={active}
      onClick={() =>
        start(async () => {
          await setRoutineActiveAction(routineId, !active);
        })
      }
      className={`h-8 shrink-0 rounded-full px-3 text-[11px] font-bold uppercase tracking-wide transition-colors ${
        active
          ? "bg-accent text-black"
          : "border border-line bg-raised text-mute"
      } ${pending ? "opacity-60" : ""}`}
    >
      {active ? "Activa" : "Activar"}
    </button>
  );
}
