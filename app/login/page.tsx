import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "Entrar" };

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-10 flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-[26px] font-black text-black shadow-[0_0_60px_rgba(215,245,66,0.25)]">
          G
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GymBro</h1>
          <p className="mt-1 text-sm text-mute">
            Tu compañero de entrenamiento
          </p>
        </div>
      </div>
      <div className="card p-5">
        <LoginForm />
      </div>
    </main>
  );
}
