import WeightChart from "@/components/WeightChart";
import WeightList from "@/components/WeightList";
import WeightQuickForm from "@/components/WeightQuickForm";
import { getSessionUser } from "@/lib/auth";
import { shiftDaysISO, signed, todayISO } from "@/lib/dates";
import { getWeightEntries } from "@/lib/queries";

export const metadata = { title: "Peso" };

function avgInRange(
  entries: { date: string; weight: number }[],
  fromISO: string,
  toISODate: string,
) {
  const list = entries.filter((e) => e.date >= fromISO && e.date <= toISODate);
  if (!list.length) return null;
  return list.reduce((a, e) => a + e.weight, 0) / list.length;
}

export default async function WeightPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const entries = getWeightEntries(user.id).map((e) => ({ ...e }));
  const today = todayISO();

  const weekAvg = avgInRange(entries, shiftDaysISO(today, -6), today);
  const prevWeekAvg = avgInRange(
    entries,
    shiftDaysISO(today, -13),
    shiftDaysISO(today, -7),
  );
  const monthAvg = avgInRange(entries, shiftDaysISO(today, -29), today);
  const prevMonthAvg = avgInRange(
    entries,
    shiftDaysISO(today, -59),
    shiftDaysISO(today, -30),
  );

  const latest = entries.length ? entries[entries.length - 1] : null;
  const weekDelta =
    weekAvg != null && prevWeekAvg != null ? weekAvg - prevWeekAvg : null;
  const monthDelta =
    monthAvg != null && prevMonthAvg != null ? monthAvg - prevMonthAvg : null;

  const withDiff = [...entries].reverse().map((e, i, arr) => ({
    ...e,
    diff: i < arr.length - 1 ? e.weight - arr[i + 1].weight : null,
  }));

  const chartPoints = entries.slice(-60);

  return (
    <main className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Peso corporal</h1>
        <p className="mt-0.5 text-sm text-mute">
          Registra a diario y mira tu evolución
        </p>
      </header>

      <section className="card p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-mute">
            Hoy
          </h2>
          <span className="text-[11px] text-mute">
            {entries.length} registros
          </span>
        </div>
        <WeightQuickForm
          date={today}
          existing={latest?.date === today ? latest.weight : null}
        />
      </section>

      <section className="grid grid-cols-3 gap-2.5">
        <div className="card flex flex-col items-center gap-1 p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-mute">
            Actual
          </span>
          <span className="text-lg font-bold tabular-nums">
            {latest ? `${latest.weight.toFixed(1)} kg` : "—"}
          </span>
        </div>
        <div className="card flex flex-col items-center gap-1 p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-mute">
            Semana
          </span>
          <span
            className={`text-lg font-bold tabular-nums ${
              weekDelta == null
                ? "text-mute"
                : weekDelta <= 0
                  ? "text-sky-400"
                  : "text-orange-400"
            }`}
          >
            {weekDelta == null ? "—" : signed(weekDelta)}
          </span>
        </div>
        <div className="card flex flex-col items-center gap-1 p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-mute">
            Mes
          </span>
          <span
            className={`text-lg font-bold tabular-nums ${
              monthDelta == null
                ? "text-mute"
                : monthDelta <= 0
                  ? "text-sky-400"
                  : "text-orange-400"
            }`}
          >
            {monthDelta == null ? "—" : signed(monthDelta)}
          </span>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-mute">
          Progreso
        </h2>
        <WeightChart
          points={chartPoints.map((p) => ({ date: p.date, weight: p.weight }))}
        />
      </section>

      {withDiff.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-[11px] font-bold uppercase tracking-widest text-mute">
            Registros recientes
          </h2>
          <WeightList entries={withDiff.slice(0, 20)} />
        </section>
      )}
    </main>
  );
}
