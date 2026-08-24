"use client";

import { useEffect, useState } from "react";
import { formatClock } from "@/lib/dates";

export default function LiveTimer({
  startedAt,
  className = "",
}: {
  startedAt: number;
  className?: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const kick = setTimeout(() => {
      setNow(Date.now());
      interval = setInterval(() => setNow(Date.now()), 1000);
    }, 50);
    return () => {
      clearTimeout(kick);
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {now == null ? "--:--" : formatClock(now - startedAt)}
    </span>
  );
}
