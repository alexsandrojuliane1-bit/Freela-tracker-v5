import type { Company } from "@/lib/types";

export function CompanyBadge({ company }: { company: Company }) {
  return (
    <span className="inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap" style={{ background: `${company.cor}22`, color: company.cor }}>
      {company.nome}
    </span>
  );
}
