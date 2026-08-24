import Link from "next/link";
import { IconChevronRight, IconPlus } from "@/components/icons";
import RoutineActiveToggle from "@/components/RoutineActiveToggle";
import { getSessionUser } from "@/lib/auth";
import { DAYS_SHORT } from "@/lib/dates";
import { all } from "@/lib/db";

export const metadata = { title: "Rutinas" };

type RoutineRow = {
  id: number;
  name: string;
  active: number;
  days: string;
};

export default async function RoutinesPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const routines = all<RoutineRow>(
    `SELECT r.id, r.name, r.active
    FROM routines r WHERE r.user_id = ? ORDER BY r.active DESC, r.created_at DESC`,
    user.id,
  );
  const dayMap = new Map<number, number[]>();
  for (const row of all<{ routine_id: number; weekday: number }>(
    `SELECT rd.routine_id, rd.weekday FROM routine_days rd JOIN routines r ON r.id = rd.routine_id WHERE r.user_id = ?`,
    user.id,
  )) {
    const list = dayMap.get(row.routine_id) ?? [];
    list.push(row.weekday);
    dayMap.set(row.routine_id, list);
  }

  return (
    <main className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rutinas</h1>
          <p className="mt-0.5 text-sm text-mute">
            Planifica tus días de entreno
          </p>
        </div>
        <Link
          href="/routines/new"
          aria-label="Nueva rutina"
          className="btn-primary h-11 w-11 p-0!"
        >
          <IconPlus className="h-5 w-5" />
        </Link>
      </header>

      {routines.length === 0 && (
        <div className="card flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-sm text-mute">
            Todavía no tienes rutinas. Crea una eligiendo días y ejercicios.
          </p>
          <Link href="/routines/new" className="btn-primary h-12 gap-2 px-6">
            <IconPlus className="h-4 w-4" />
            Nueva rutina
          </Link>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {routines.map((r) => (
          <li key={r.id}>
            <div className="card flex items-center gap-3 p-4">
              <Link
                href={`/routines/${r.id}`}
                className="min-w-0 flex-1 active:opacity-80"
              >
                <p className="truncate font-semibold">{r.name}</p>
                <div className="mt-2 flex gap-1">
                  {DAYS_SHORT.map((d, wd) => (
                    <span
                      key={d}
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                        (dayMap.get(r.id) ?? []).includes(wd)
                          ? "bg-accent text-black"
                          : "bg-raised text-mute/50"
                      }`}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </Link>
              <RoutineActiveToggle routineId={r.id} active={r.active === 1} />
              <IconChevronRight className="h-5 w-5 shrink-0 text-mute" />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
