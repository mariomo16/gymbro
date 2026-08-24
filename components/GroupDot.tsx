const COLORS = [
  "bg-lime-400",
  "bg-sky-400",
  "bg-violet-400",
  "bg-amber-400",
  "bg-rose-400",
  "bg-emerald-400",
  "bg-cyan-400",
  "bg-fuchsia-400",
  "bg-orange-400",
  "bg-teal-400",
  "bg-indigo-400",
  "bg-pink-400",
  "bg-yellow-400",
];

export default function GroupDot({
  groupId,
  className = "",
}: {
  groupId: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${COLORS[groupId % COLORS.length]} ${className}`}
    />
  );
}
