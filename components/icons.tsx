type IconProps = {
  className?: string;
};

function base(className?: string) {
  return {
    className: className ?? "h-5 w-5",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
}

export function IconHome({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

export function IconDumbbell({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M6.5 6.5v11" />
      <path d="M3.5 8.5v7" />
      <path d="M17.5 6.5v11" />
      <path d="M20.5 8.5v7" />
      <path d="M6.5 12h11" />
    </svg>
  );
}

export function IconHistory({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
      <path d="M3.5 4.5V9H8" />
      <path d="M12 8v4.5l3 1.8" />
    </svg>
  );
}

export function IconScale({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M8.5 10.5 12 7.5l3.5 3" />
      <path d="M12 7.5V12" />
    </svg>
  );
}

export function IconGrid({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="4" y="4" width="7" height="7" rx="2" />
      <rect x="13" y="4" width="7" height="7" rx="2" />
      <rect x="4" y="13" width="7" height="7" rx="2" />
      <rect x="13" y="13" width="7" height="7" rx="2" />
    </svg>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="m5 13 4.2 4L19 7" />
    </svg>
  );
}

export function IconX({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconTrash({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
      <path d="M6.5 7 7.4 19a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9L17.5 7" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function IconPlay({ className }: IconProps) {
  return (
    <svg {...base(className)} fill="currentColor" stroke="none">
      <path d="M8.5 5.8c0-.9 1-1.5 1.8-1L18.4 9c.8.5.8 1.6 0 2l-8.1 5.2c-.8.5-1.8-.1-1.8-1Z" />
    </svg>
  );
}

export function IconChevronRight({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function IconChevronLeft({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

export function IconLogout({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M14 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" />
      <path d="M10 12h10" />
      <path d="m16.5 8.5 3.5 3.5-3.5 3.5" />
    </svg>
  );
}

export function IconSearch({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.8-3.8" />
    </svg>
  );
}

export function IconStop({ className }: IconProps) {
  return (
    <svg {...base(className)} fill="currentColor" stroke="none">
      <rect x="6.5" y="6.5" width="11" height="11" rx="2.5" />
    </svg>
  );
}

export function IconFlame({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 3s5.5 4.2 5.5 9a5.5 5.5 0 0 1-11 0c0-1.8.8-3.4 1.8-4.7.3 1 .9 1.9 1.9 2.2C10.5 7.6 12 3 12 3Z" />
    </svg>
  );
}
