"use client";

import { useMemo } from "react";
import { monthOptions } from "@/lib/dates";
import { SimpleSelect } from "./simple-select";

export function MonthSelect({ value, onChange, className, id }: { value: string; onChange: (v: string) => void; className?: string; id?: string }) {
  const options = useMemo(() => monthOptions(), []);
  return <SimpleSelect id={id} value={value} onChange={onChange} options={options} className={className} />;
}
