import Link from "next/link";
import GroupDot from "@/components/GroupDot";
import {
  IconCheck,
  IconChevronRight,
  IconFlame,
  IconLogout,
  IconPlus,
} from "@/components/icons";
import LiveTimer from "@/components/LiveTimer";
import StartWorkoutButton from "@/components/StartWorkoutButton";
import WeightQuickForm from "@/components/WeightQuickForm";
import { logoutAction } from "@/lib/actions/auth";
import { getSessionUser } from "@/lib/auth";
import {
  DAYS_LONG,
  DAYS_SHORT,
  formatDateLong,
  formatDuration,
  formatVolume,
  mondayIndex,
  todayISO,
} from "@/lib/dates";
import { formatRepRange } from "@/lib/format";
import {
  getActiveWorkout,
  getDoneRoutineDayIdsToday,
  getNextTrainingDay,
  getRecentWorkouts,
  getRoutineDaysForWeekday,
  getWeightOnDate,
} from "@/lib/queries";

function shortName(fullName: string): string {
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return fullName;
  return `${parts[0]} ${parts
    .slice(1)
    .map((p) => `${p[0]}.`)
    .join(" ")}`;
}

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) return null;

  const now = new Date();
  const weekday = mondayIndex(now);
  const today = todayISO();
  const [todaysDays, activeWorkout, nextDay, recent, todayWeight, doneDayIds] =
    await Promise.all([
      getRoutineDaysForWeekday(user.id, weekday),
      getActiveWorkout(user.id),
      getNextTrainingDay(user),
      getRecentWorkouts(user.id, 5),
      Promise.resolve(getWeightOnDate(user.id, today)),
      Promise.resolve(getDoneRoutineDayIdsToday(user.id)),
    ]);
  const doneDays = new Set(doneDayIds);

  const displayName = shortName(user.name?.trim() || user.username);

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm capitalize text-mute">
            {formatDateLong(now.getTime())}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            Hola, {displayName}
          </h1>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            aria-label="Cerrar sesión"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card text-mute"
          >
            <IconLogout className="h-5 w-5" />
          </button>
        </form>
      </header>

      {activeWorkout && (
        <Link
          href={`/workout/${activeWorkout.id}`}
          className="block rounded-[1.25rem] border border-accent/30 bg-accent-soft p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-accent">
                Entrenamiento en curso
              </p>
              <LiveTimer
                startedAt={activeWorkout.started_at}
                className="mt-1 text-2xl font-bold"
              />
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-black">
              <IconChevronRight className="h-5 w-5" />
            </span>
          </div>
        </Link>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-mute">
          Hoy · {DAYS_LONG[weekday]}
        </h2>

        {todaysDays.length > 0 ? (
          todaysDays.map((day) => (
            <div key={day.routine_day_id} className="card p-4">
              <p className="font-semibold">{day.routine_name}</p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {day.exercises.map((ex) => (
                  <li
                    key={ex.exercise_id}
                    className="flex items-center gap-2 text-sm text-mute"
                  >
                    <GroupDot groupId={ex.muscle_group_id} />
                    <span className="truncate">{ex.exercise_name}</span>
                    {ex.target_sets != null && (
                      <span className="ml-auto shrink-0 rounded-md bg-raised px-2 py-0.5 text-[11px] font-semibold">
                        {(() => {
                          const reps = formatRepRange(
                            ex.target_reps_min,
                            ex.target_reps_max,
                          );
                          return reps
                            ? `${ex.target_sets} × ${reps}`
                            : `${ex.target_sets} ×`;
                        })()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                {doneDays.has(day.routine_day_id) ? (
                  <div className="flex h-12 w-full items-center justify-center gap-2 rounded-[0.875rem] bg-raised text-sm font-semibold text-mute">
                    <span className="text-accent">
                      <IconCheck className="h-4 w-4" />
                    </span>
                    Entrenado hoy
                  </div>
                ) : (
                  <StartWorkoutButton routineDayId={day.routine_day_id} />
                )}
              </div>
            </div>
          ))
        ) : nextDay ? (
          <div className="card flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-raised text-mute">
                <IconFlame className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Hoy no toca entrenar</p>
                <p className="text-xs text-mute">
                  Próximo: {DAYS_LONG[nextDay.weekday]}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              {DAYS_SHORT.map((d) => (
                <span
                  key={d}
                  className="text-[10px] font-semibold text-mute/60"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="card p-4 text-sm text-mute">
            Aún no tienes rutinas.{" "}
            <Link href="/routines/new" className="font-semibold text-accent">
              Crea una
            </Link>{" "}
            o entrena libre.
          </p>
        )}

        {!activeWorkout && (
          <StartWorkoutButton routineDayId={null} label="Entreno libre" />
        )}
      </section>

      <section className="card p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-mute">
            Peso de hoy
          </h2>
          <Link href="/weight" className="text-xs font-semibold text-accent">
            Ver progreso
          </Link>
        </div>
        <WeightQuickForm date={today} existing={todayWeight} />
      </section>

      {recent.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-mute">
              Últimos entrenos
            </h2>
            <Link href="/history" className="text-xs font-semibold text-accent">
              Todo el historial
            </Link>
          </div>
          {recent.map((w) => (
            <Link
              key={w.id}
              href={`/history/${w.id}`}
              className="card flex items-center gap-3 p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {w.title ?? "Entreno libre"}
                </p>
                <p className="mt-0.5 text-xs text-mute">
                  {formatDateLong(w.started_at)} ·{" "}
                  {formatDuration(w.duration_seconds)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {formatVolume(w.volume)}
                </p>
                <p className="text-[11px] text-mute">{w.sets} series</p>
              </div>
              <IconChevronRight className="h-4 w-4 shrink-0 text-mute" />
            </Link>
          ))}
        </section>
      )}

      {recent.length === 0 && !todaysDays.length && (
        <Link
          href="/routines/new"
          className="btn-ghost mx-auto mt-2 h-12 gap-2 px-6 text-accent"
        >
          <IconPlus className="h-4 w-4" />
          Crear mi primera rutina
        </Link>
      )}
    </main>
  );
}
