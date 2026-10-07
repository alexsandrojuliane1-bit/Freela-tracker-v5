import { cn } from "@/lib/utils";

const tones = {
  default: "text-foreground",
  green: "text-emerald-400",
  accent: "text-primary",
  yellow: "text-amber-400",
  red: "text-red-400",
  orange: "text-orange-400",
} as const;

export type Tone = keyof typeof tones;

export function StatCard({
  label,
  value,
  tone = "default",
  small,
  danger,
}: {
  label: string;
  value: string | number;
  tone?: Tone;
  small?: boolean;
  danger?: boolean;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-3", danger && "border-red-400/30")}>
      <div className={cn("mb-1 text-[11px] text-muted-foreground", danger && "text-red-400")}>{label}</div>
      <div className={cn("font-bold tracking-tight", small ? "text-sm" : "text-lg", tones[tone])}>{value}</div>
    </div>
  );
}
