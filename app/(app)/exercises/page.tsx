import ExercisesManager from "@/components/ExercisesManager";
import { getSessionUser } from "@/lib/auth";
import { getUserExercises, getUserGroups } from "@/lib/queries";

export const metadata = { title: "Ejercicios" };

export default async function ExercisesPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const [groups, exercises] = [getUserGroups(), getUserExercises(user.id)];

  return (
    <main className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Ejercicios</h1>
        <p className="mt-0.5 text-sm text-mute">
          Tu biblioteca personal por grupo muscular
        </p>
      </header>
      <ExercisesManager groups={groups} exercises={exercises} />
    </main>
  );
}
