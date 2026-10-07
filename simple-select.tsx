"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

export function SimpleSelect({
  value,
  onChange,
  options,
  className,
  id,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  className?: string;
  id?: string;
  placeholder?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(String(v ?? ""))} items={options}>
      <SelectTrigger id={id} className={cn("h-10 w-full rounded-xl border-border bg-background text-sm", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
