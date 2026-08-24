import Link from "next/link";
import { IconChevronLeft } from "@/components/icons";
import RoutineBuilder from "@/components/RoutineBuilder";
import { getSessionUser } from "@/lib/auth";
import { getUserExercises, getUserGroups } from "@/lib/queries";

export const metadata = { title: "Nueva rutina" };

export default async function NewRoutinePage() {
  const user = await getSessionUser();
  if (!user) return null;

  return (
    <main className="flex flex-col gap-5">
      <header className="flex items-center gap-2">
        <Link
          href="/routines"
          aria-label="Volver"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-mute"
        >
          <IconChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Nueva rutina</h1>
      </header>
      <RoutineBuilder
        groups={getUserGroups()}
        exercises={getUserExercises(user.id)}
      />
    </main>
  );
}
