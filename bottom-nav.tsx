"use client";

import { BarChart3, CalendarDays, FolderKanban, Plus, Settings, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tab = "registrar" | "tabela" | "agenda" | "financas" | "resumo" | "config";

export const TABS: { id: Tab; label: string; icon: typeof Plus }[] = [
  { id: "registrar", label: "Registrar", icon: Plus },
  { id: "tabela", label: "Tabela", icon: Table2 },
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "financas", label: "Finanças", icon: BarChart3 },
  { id: "resumo", label: "Resumo", icon: FolderKanban },
  { id: "config", label: "Config", icon: Settings },
];

export function BottomNav({ value, onChange }: { value: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-50 grid grid-cols-6 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => onChange(id)}
            className={cn(
              "flex flex-col items-center gap-1 py-2 text-[10px] font-semibold transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-5" />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
