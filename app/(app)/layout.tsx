import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import BottomNav from "@/components/BottomNav";
import { getSessionUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-32">
      {children}
      <BottomNav />
    </div>
  );
}
