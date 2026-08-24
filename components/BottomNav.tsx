"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconDumbbell,
  IconGrid,
  IconHistory,
  IconHome,
  IconScale,
} from "@/components/icons";

const items = [
  { href: "/", label: "Hoy", icon: IconHome },
  { href: "/routines", label: "Rutinas", icon: IconDumbbell },
  { href: "/history", label: "Historial", icon: IconHistory },
  { href: "/weight", label: "Peso", icon: IconScale },
  { href: "/exercises", label: "Ejercicios", icon: IconGrid },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/workout/")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto max-w-md px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        <div className="flex items-center justify-between rounded-3xl border border-line bg-card/90 p-1.5 shadow-[0_8px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          {items.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={`flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-semibold transition-colors ${
                  active ? "bg-accent-soft text-accent" : "text-mute"
                }`}
              >
                <Icon className="h-[22px] w-[22px]" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
