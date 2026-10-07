# Freela Tracker → Next.js Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reescrever a PWA `index.html` do Freela Tracker em Next.js + TypeScript + shadcn/ui, 100% client-side, com CRUD completo (criar/editar/excluir) de registros e empresas persistido no localStorage.

**Architecture:** App estático (`output: 'export'`) com uma página-shell de 5 abas e uma rota `/relatorio` de impressão. Domínio puro em `lib/` (cálculo, datas, parser de voz, CSV) testado com Vitest; estado em Zustand `persist` (chave `freela-tracker`) com migração das chaves legadas `freela_entries`/`freela_companies`. UI em shadcn (Radix) + Tailwind v4, gráficos em Recharts.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui new-york, Zustand, react-hook-form + zod, Recharts, Lucide, Sonner, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-20-freela-tracker-nextjs-design.md`

## Global Constraints

- Sem backend, sem Prisma, sem NextAuth, sem API routes. `next.config.ts` com `output: 'export'`.
- Estrutura sem `src/`; alias `@/*`; npm; shadcn style `new-york`, baseColor `neutral`, ícones Lucide (igual ao govcon-frontend).
- Sem comentários desnecessários; sem abstrações além do necessário.
- Não inicializar git (pasta não é repo; o dono decide). Portanto os passos "Commit" deste plano são substituídos por "rodar `npm test` / `npm run build`".
- Regras de cálculo idênticas ao `legacy/index.html` (`calcEntry`).
- Textos da UI em pt-BR, mesmos rótulos do app atual.
- Tema escuro: bg `#0a0d14`, surface `#12151f`, card `#181c2a`, border `#232840`, accent `#4f8ef7`, accent2 `#a78bfa`, green `#34d399`, yellow `#fbbf24`, red `#f87171`, orange `#fb923c`, text `#e8eaf0`, muted `#6b7494`.

---

### Task 1: Scaffold do projeto e toolchain de testes

**Files:**
- Move: `index.html` → `legacy/index.html`, `manifest.json` → `legacy/manifest.json`
- Create (via CLI): projeto Next.js na raiz, `components.json`, `components/ui/*`
- Create: `vitest.config.mts`, `vitest.setup.ts`, `next.config.ts`, `public/manifest.json`, `lib/types.ts`
- Modify: `package.json` (scripts `test`), `tsconfig.json` (exclude legacy)

**Interfaces:**
- Produces: `lib/types.ts` exportando `Company`, `Entry`, `PALETTE`, `DEFAULT_COMPANIES`, `MAX_COMPANIES = 20`.

- [ ] **Step 1: Mover legado**

```powershell
New-Item -ItemType Directory -Force legacy; Move-Item index.html legacy\; Move-Item manifest.json legacy\
```

- [ ] **Step 2: create-next-app na raiz**

```powershell
npx --yes create-next-app@latest . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --disable-git --yes
```
(A pasta contém `docs/` e `legacy/`; se o CLI reclamar de conflito, rodar em `..\freela-tracker-next` e mover o conteúdo para cá.)

- [ ] **Step 3: shadcn init + componentes**

```powershell
npx --yes shadcn@latest init -d
npx --yes shadcn@latest add button card input label select textarea dialog sheet tabs table checkbox badge separator alert-dialog sonner chart
```
Verificar que `components.json` tem `"style": "new-york"`, `"baseColor": "neutral"`, `"iconLibrary": "lucide"`.

- [ ] **Step 4: deps de runtime e teste**

```powershell
npm i zustand react-hook-form @hookform/resolvers zod
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event vite-tsconfig-paths
```

- [ ] **Step 5: `vitest.config.mts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "legacy", ".next"],
  },
});
```

`vitest.setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

`package.json` scripts: adicionar `"test": "vitest run"` e `"test:watch": "vitest"`. Em `tsconfig.json` `exclude` adicionar `"legacy"`.

- [ ] **Step 6: `next.config.ts` + manifest**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
```

`public/manifest.json` = cópia de `legacy/manifest.json` com `"start_url": "/"` e `"theme_color": "#0a0d14"`.

- [ ] **Step 7: `lib/types.ts`**

```ts
export type Company = {
  id: string;
  nome: string;
  diaria: number;
  extra: number;
  horas: number;
  almoco: number;
  janta: number;
  cor: string;
};

export type Entry = {
  id: string;
  data: string;
  empresa: string;
  entrada?: string;
  saida?: string;
  alimentacao: number;
  uber: number;
  obs?: string;
};

export const MAX_COMPANIES = 20;

export const PALETTE = ["#4f8ef7","#a78bfa","#34d399","#fbbf24","#fb923c","#f87171","#38bdf8","#e879f9","#4ade80","#facc15","#60a5fa","#c084fc","#2dd4bf","#f472b6","#818cf8","#fb7185","#a3e635","#fdba74","#67e8f9","#d946ef"];

export const DEFAULT_COMPANIES: Company[] = [
  { id: "c1", nome: "Empresa 1", diaria: 550, extra: 45.83, horas: 12, almoco: 0, janta: 0, cor: "#4f8ef7" },
  { id: "c2", nome: "Empresa 2", diaria: 500, extra: 41.67, horas: 12, almoco: 50, janta: 50, cor: "#a78bfa" },
];
```

- [ ] **Step 8: Verificar**

Run: `npm test` → "No test files found" (ok) ; `npm run build` → sucesso com export estático.

---

### Task 2: `lib/dates.ts` e `lib/calc.ts` (TDD)

**Files:**
- Create: `lib/dates.ts`, `lib/calc.ts`, `lib/dates.test.ts`, `lib/calc.test.ts`

**Interfaces:**
- Produces:
  - `MONTHS_PT: string[]`, `MONTHS_SHORT_PT: string[]`
  - `monthKey(d: Date): string` → `'YYYY-MM'`
  - `monthOptions(now?: Date, fromYear = 2024): {value: string; label: string}[]` (mais recente primeiro, igual ao legado)
  - `last12Months(now?: Date): {key: string; label: string}[]` (ordem cronológica)
  - `todayISO(now?: Date): string` (local, `YYYY-MM-DD`)
  - `calcEntry(e: Entry, c: Company): EntryCalc` com `{extraHours, base, extraVal, alimConf, alimExtra, totalAlim, uber, totalGasto, total, totalComGastos}`
  - `summarizeEntries(entries: Entry[], getCompany: (id: string) => Company): Totals` com `{dias, base, extra, alimConf, alimExtra, uber, total, gasto, liquido}`
  - `groupByCompany(entries, getCompany): Record<string, Totals>`
  - `fmtBRL(n: number): string` (`'R$ 1.234,56'`), `fmtHours(h: number): string` (`'1.5h'` / `'0h'`)

- [ ] **Step 1: testes de datas**

```ts
// lib/dates.test.ts
import { describe, it, expect } from "vitest";
import { monthKey, monthOptions, last12Months, todayISO } from "./dates";

describe("dates", () => {
  const now = new Date(2026, 7, 20);
  it("monthKey", () => expect(monthKey(now)).toBe("2026-08"));
  it("todayISO usa data local", () => expect(todayISO(now)).toBe("2026-08-20"));
  it("monthOptions começa no mês atual e termina em jan/2024", () => {
    const o = monthOptions(now);
    expect(o[0]).toEqual({ value: "2026-08", label: "Agosto 2026" });
    expect(o.at(-1)).toEqual({ value: "2024-01", label: "Janeiro 2024" });
  });
  it("last12Months termina no mês atual", () => {
    const m = last12Months(now);
    expect(m).toHaveLength(12);
    expect(m[0]).toEqual({ key: "2025-09", label: "Set 2025" });
    expect(m[11]).toEqual({ key: "2026-08", label: "Ago 2026" });
  });
});
```

- [ ] **Step 2: testes de cálculo**

```ts
// lib/calc.test.ts
import { describe, it, expect } from "vitest";
import { calcEntry, summarizeEntries, groupByCompany, fmtBRL, fmtHours } from "./calc";
import type { Company, Entry } from "./types";

const c: Company = { id: "c1", nome: "A", diaria: 550, extra: 45.83, horas: 12, almoco: 20, janta: 30, cor: "#000" };
const getCompany = () => c;
const base: Entry = { id: "1", data: "2026-08-01", empresa: "c1", alimentacao: 0, uber: 0 };

describe("calcEntry", () => {
  it("sem horário → sem extra", () => {
    const r = calcEntry(base, c);
    expect(r.extraHours).toBe(0);
    expect(r.total).toBe(550);
    expect(r.totalGasto).toBe(50);
    expect(r.totalComGastos).toBe(600);
  });
  it("14h trabalhadas → 2h extra", () => {
    const r = calcEntry({ ...base, entrada: "08:00", saida: "22:00" }, c);
    expect(r.extraHours).toBe(2);
    expect(r.extraVal).toBeCloseTo(91.66);
    expect(r.total).toBeCloseTo(641.66);
  });
  it("virada de meia-noite", () => {
    const r = calcEntry({ ...base, entrada: "20:00", saida: "09:00" }, c);
    expect(r.extraHours).toBe(1);
  });
  it("jornada menor que base não dá extra negativo", () => {
    expect(calcEntry({ ...base, entrada: "08:00", saida: "12:00" }, c).extraHours).toBe(0);
  });
  it("gastos particulares não entram no total", () => {
    const r = calcEntry({ ...base, alimentacao: 15, uber: 40 }, c);
    expect(r.total).toBe(550);
    expect(r.totalGasto).toBe(105);
    expect(r.totalAlim).toBe(65);
  });
});

describe("summarizeEntries / groupByCompany", () => {
  const entries: Entry[] = [
    { ...base, id: "1", entrada: "08:00", saida: "22:00", uber: 10 },
    { ...base, id: "2", alimentacao: 5 },
  ];
  it("soma totais", () => {
    const t = summarizeEntries(entries, getCompany);
    expect(t.dias).toBe(2);
    expect(t.base).toBe(1100);
    expect(t.extra).toBeCloseTo(91.66);
    expect(t.total).toBeCloseTo(1191.66);
    expect(t.uber).toBe(10);
    expect(t.alimExtra).toBe(5);
    expect(t.alimConf).toBe(100);
    expect(t.gasto).toBe(115);
    expect(t.liquido).toBeCloseTo(1191.66 - 10 - 5);
  });
  it("agrupa por empresa", () => {
    const g = groupByCompany(entries, getCompany);
    expect(Object.keys(g)).toEqual(["c1"]);
    expect(g.c1.dias).toBe(2);
  });
});

describe("fmt", () => {
  it("fmtBRL", () => expect(fmtBRL(1234.5)).toBe("R$ 1.234,50"));
  it("fmtHours", () => { expect(fmtHours(1.5)).toBe("1.5h"); expect(fmtHours(0)).toBe("0h"); });
});
```

- [ ] **Step 3: Rodar → FAIL** (`npm test`)

- [ ] **Step 4: Implementar `lib/dates.ts`**

```ts
export const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
export const MONTHS_SHORT_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const pad = (n: number) => String(n).padStart(2, "0");

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function todayISO(now = new Date()) {
  return `${monthKey(now)}-${pad(now.getDate())}`;
}

export function monthOptions(now = new Date(), fromYear = 2024) {
  const out: { value: string; label: string }[] = [];
  for (let y = now.getFullYear(); y >= fromYear; y--) {
    const maxM = y === now.getFullYear() ? now.getMonth() : 11;
    for (let m = maxM; m >= 0; m--) out.push({ value: `${y}-${pad(m + 1)}`, label: `${MONTHS_PT[m]} ${y}` });
  }
  return out;
}

export function last12Months(now = new Date()) {
  const out: { key: string; label: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: monthKey(d), label: `${MONTHS_SHORT_PT[d.getMonth()]} ${d.getFullYear()}` });
  }
  return out;
}

export function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return `${MONTHS_PT[m - 1]} ${y}`;
}
```

- [ ] **Step 5: Implementar `lib/calc.ts`**

```ts
import type { Company, Entry } from "./types";

export type EntryCalc = {
  extraHours: number; base: number; extraVal: number; alimConf: number; alimExtra: number;
  totalAlim: number; uber: number; totalGasto: number; total: number; totalComGastos: number;
};

export function calcEntry(e: Entry, c: Company): EntryCalc {
  let extraHours = 0;
  if (e.entrada && e.saida) {
    const [eh, em] = e.entrada.split(":").map(Number);
    const [sh, sm] = e.saida.split(":").map(Number);
    let mins = sh * 60 + sm - (eh * 60 + em);
    if (mins < 0) mins += 24 * 60;
    extraHours = Math.max(0, mins / 60 - c.horas);
  }
  const base = c.diaria;
  const extraVal = extraHours * c.extra;
  const alimConf = (c.almoco || 0) + (c.janta || 0);
  const alimExtra = Number(e.alimentacao) || 0;
  const uber = Number(e.uber) || 0;
  const totalAlim = alimConf + alimExtra;
  const totalGasto = totalAlim + uber;
  const total = base + extraVal;
  return { extraHours, base, extraVal, alimConf, alimExtra, totalAlim, uber, totalGasto, total, totalComGastos: total + totalGasto };
}

export type Totals = {
  dias: number; base: number; extra: number; extraHours: number; alimConf: number; alimExtra: number;
  uber: number; total: number; gasto: number; liquido: number;
};

const emptyTotals = (): Totals => ({ dias: 0, base: 0, extra: 0, extraHours: 0, alimConf: 0, alimExtra: 0, uber: 0, total: 0, gasto: 0, liquido: 0 });

function accumulate(t: Totals, r: EntryCalc) {
  t.dias++; t.base += r.base; t.extra += r.extraVal; t.extraHours += r.extraHours;
  t.alimConf += r.alimConf; t.alimExtra += r.alimExtra; t.uber += r.uber;
  t.total += r.total; t.gasto += r.totalGasto; t.liquido += r.total - r.uber - r.alimExtra;
}

export function summarizeEntries(entries: Entry[], getCompany: (id: string) => Company): Totals {
  const t = emptyTotals();
  for (const e of entries) accumulate(t, calcEntry(e, getCompany(e.empresa)));
  return t;
}

export function groupByCompany(entries: Entry[], getCompany: (id: string) => Company): Record<string, Totals> {
  const out: Record<string, Totals> = {};
  for (const e of entries) {
    const key = getCompany(e.empresa).id;
    out[key] ??= emptyTotals();
    accumulate(out[key], calcEntry(e, getCompany(e.empresa)));
  }
  return out;
}

export function fmtBRL(n: number) {
  return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtHours(h: number) {
  return h > 0 ? `${h.toFixed(1)}h` : "0h";
}
```

- [ ] **Step 6: Rodar → PASS** (`npm test`)

---

### Task 3: `lib/parse-transcript.ts` (TDD)

**Files:**
- Create: `lib/parse-transcript.ts`, `lib/parse-transcript.test.ts`

**Interfaces:**
- Produces: `parseTranscript(text: string, companies: Pick<Company,"id"|"nome">[], today?: Date): ParsedEntry` onde `ParsedEntry = { data?: string; empresa?: string; entrada?: string; saida?: string; alimentacao?: number; uber?: number }`. Nunca lança. `data` sempre preenchida (default hoje).
- Também exporta `normalizeText(s: string): string` e `wordsToDigits(s: string): string` (úteis nos testes).

- [ ] **Step 1: Testes (tabela)**

```ts
// lib/parse-transcript.test.ts
import { describe, it, expect } from "vitest";
import { parseTranscript, wordsToDigits } from "./parse-transcript";

const companies = [
  { id: "c1", nome: "Empresa 1" },
  { id: "c2", nome: "Empresa 2" },
  { id: "c3", nome: "Credentech Eventos" },
];
const today = new Date(2026, 7, 20);
const p = (t: string) => parseTranscript(t, companies, today);

describe("wordsToDigits", () => {
  it.each([
    ["vinte e duas horas", "22 horas"],
    ["sete e meia", "7 e meia"],
    ["oito e quinze", "8 e 15"],
    ["nove e trinta", "9 e 30"],
    ["cento e vinte reais", "120 reais"],
    ["duzentos e cinquenta", "250"],
    ["mil e duzentos", "1200"],
    ["uma hora", "1 hora"],
    ["dez", "10"],
  ])("%s → %s", (a, b) => expect(wordsToDigits(a)).toBe(b));
});

describe("data", () => {
  it("default hoje", () => expect(p("trabalhei na empresa 1").data).toBe("2026-08-20"));
  it("ontem", () => expect(p("ontem trabalhei das 8 as 20").data).toBe("2026-08-19"));
  it("anteontem", () => expect(p("anteontem trabalhei").data).toBe("2026-08-18"));
  it("dia N", () => expect(p("dia 5 trabalhei na empresa 2").data).toBe("2026-08-05"));
  it("dia N por extenso", () => expect(p("dia cinco trabalhei").data).toBe("2026-08-05"));
  it("dia N de mês", () => expect(p("dia 3 de julho das 8 às 18").data).toBe("2026-07-03"));
  it("dd/mm", () => expect(p("no 15/07 fiz a empresa 1").data).toBe("2026-07-15"));
  it("dia N não vira horário", () => {
    const r = p("dia 5 entrei às 8 e saí às 20");
    expect(r.entrada).toBe("08:00"); expect(r.saida).toBe("20:00");
  });
});

describe("horários", () => {
  it.each([
    ["entrei às 8 e saí às 22", "08:00", "22:00"],
    ["das oito às vinte e duas", "08:00", "22:00"],
    ["de sete e meia a seis da tarde", "07:30", "18:00"],
    ["entrei nove e trinta e saí quatro da manhã", "09:30", "04:00"],
    ["das 8:30 às 18h45", "08:30", "18:45"],
    ["comecei ao meio-dia e terminei meia-noite", "12:00", "00:00"],
    ["entrei 7h saí 19h", "07:00", "19:00"],
    ["das 10 da manhã às 11 da noite", "10:00", "23:00"],
  ])("%s", (t, ent, sai) => {
    const r = p(t);
    expect(r.entrada).toBe(ent);
    expect(r.saida).toBe(sai);
  });
  it("só saída quando dito", () => {
    const r = p("saí às 22");
    expect(r.entrada).toBeUndefined(); expect(r.saida).toBe("22:00");
  });
  it("sem horário", () => {
    const r = p("trabalhei hoje na empresa 1");
    expect(r.entrada).toBeUndefined(); expect(r.saida).toBeUndefined();
  });
});

describe("empresa", () => {
  it("por nome exato", () => expect(p("hoje na empresa 2 das 8 as 20").empresa).toBe("c2"));
  it("por token", () => expect(p("trabalhei pra credentech das 8 as 20").empresa).toBe("c3"));
  it("sem menção → undefined", () => expect(p("das 8 as 20").empresa).toBeUndefined());
  it("número da empresa não vira horário", () => {
    const r = p("empresa 2 das 8 as 20");
    expect(r.entrada).toBe("08:00"); expect(r.saida).toBe("20:00");
  });
});

describe("gastos", () => {
  it("uber", () => expect(p("gastei 30 de uber").uber).toBe(30));
  it("uber por extenso com reais", () => expect(p("gastei trinta reais de uber").uber).toBe(30));
  it("transporte com vírgula", () => expect(p("paguei 12,50 de ônibus").uber).toBe(12.5));
  it("alimentação", () => expect(p("gastei 25 de almoço").alimentacao).toBe(25));
  it("ordem invertida", () => expect(p("uber foi 40 reais").uber).toBe(40));
  it("soma duas refeições", () => expect(p("gastei 20 de almoço e 25 de janta").alimentacao).toBe(45));
  it("gasto não vira horário", () => {
    const r = p("das 8 as 20 gastei 30 de uber");
    expect(r.entrada).toBe("08:00"); expect(r.saida).toBe("20:00"); expect(r.uber).toBe(30);
  });
  it("R$ prefixado", () => expect(p("R$ 18 de comida").alimentacao).toBe(18));
});

describe("frase completa", () => {
  it("tudo junto", () => {
    const r = p("ontem trabalhei na empresa 2 das sete e meia às vinte e duas, gastei 35 de uber e 20 de janta");
    expect(r).toEqual({ data: "2026-08-19", empresa: "c2", entrada: "07:30", saida: "22:00", uber: 35, alimentacao: 20 });
  });
  it("texto vazio não lança", () => expect(p("")).toEqual({ data: "2026-08-20" }));
});
```

- [ ] **Step 2: Rodar → FAIL**

- [ ] **Step 3: Implementar**

```ts
// lib/parse-transcript.ts
import { todayISO } from "./dates";

export type ParsedEntry = { data?: string; empresa?: string; entrada?: string; saida?: string; alimentacao?: number; uber?: number };

export function normalizeText(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/r\$\s*/g, "").replace(/[,;.](?=\s|$)/g, " ").replace(/\s+/g, " ").trim();
}

const UNITS: Record<string, number> = { zero:0, um:1, uma:1, dois:2, duas:2, tres:3, quatro:4, cinco:5, seis:6, sete:7, oito:8, nove:9, dez:10, onze:11, doze:12, treze:13, quatorze:14, catorze:14, quinze:15, dezesseis:16, dezessete:17, dezoito:18, dezenove:19 };
const TENS: Record<string, number> = { vinte:20, trinta:30, quarenta:40, cinquenta:50, sessenta:60, setenta:70, oitenta:80, noventa:90 };
const HUNDREDS: Record<string, number> = { cem:100, cento:100, duzentos:200, trezentos:300, quatrocentos:400, quinhentos:500, seiscentos:600, setecentos:700, oitocentos:800, novecentos:900 };

export function wordsToDigits(s: string) {
  const tokens = s.split(" ");
  const out: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (!(t in UNITS || t in TENS || t in HUNDREDS || t === "mil")) { out.push(t); i++; continue; }
    let value = 0, j = i, consumed = false;
    let thousands = 0;
    if (tokens[j] in UNITS && tokens[j + 1] === "mil") { thousands = UNITS[tokens[j]]; j += 2; consumed = true; }
    else if (tokens[j] === "mil") { thousands = 1; j += 1; consumed = true; }
    if (thousands) { value = thousands * 1000; if (tokens[j] === "e") j++; }
    if (tokens[j] in HUNDREDS) {
      value += HUNDREDS[tokens[j]]; j++; consumed = true;
      if (tokens[j] === "e" && (tokens[j + 1] in TENS || tokens[j + 1] in UNITS)) j++;
      else if (tokens[j] === "e") { /* "cento e meia" etc: leave "e" */ }
    }
    if (tokens[j] in TENS) {
      value += TENS[tokens[j]]; j++; consumed = true;
      if (tokens[j] === "e" && tokens[j + 1] in UNITS && UNITS[tokens[j + 1]] < 10) { value += UNITS[tokens[j + 1]]; j += 2; }
    } else if (tokens[j] in UNITS && (consumed ? thousands > 0 || tokens[j - 1] === "e" || !(tokens[j-1] in HUNDREDS) : true)) {
      value += UNITS[tokens[j]]; j++; consumed = true;
    }
    if (!consumed) { out.push(t); i++; continue; }
    if (j > i && tokens[j - 1] === "e") j--;
    out.push(String(value));
    i = j;
  }
  return out.join(" ");
}
```

(Continua no mesmo arquivo:)

```ts
const MONTHS = ["janeiro","fevereiro","marco","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

function parseDate(text: string, today: Date): { data: string; rest: string } {
  let rest = text;
  const y = today.getFullYear(), m = today.getMonth() + 1, d = today.getDate();
  const shift = (n: number) => { const dt = new Date(y, m - 1, d + n); return iso(dt.getFullYear(), dt.getMonth() + 1, dt.getDate()); };
  let data = iso(y, m, d);
  if (/\banteontem\b/.test(rest)) data = shift(-2);
  else if (/\bontem\b/.test(rest)) data = shift(-1);
  else if (/\bamanha\b/.test(rest)) data = shift(1);
  const slash = rest.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (slash) {
    const yy = slash[3] ? (slash[3].length === 2 ? 2000 + Number(slash[3]) : Number(slash[3])) : y;
    data = iso(yy, Number(slash[2]), Number(slash[1]));
    rest = rest.replace(slash[0], " ");
  }
  const dia = rest.match(/\bdia (\d{1,2})(?: de (\w+))?/);
  if (dia) {
    const mi = dia[2] ? MONTHS.indexOf(dia[2]) : -1;
    data = iso(y, mi >= 0 ? mi + 1 : m, Number(dia[1]));
    rest = rest.replace(dia[0], " ");
  }
  return { data, rest };
}

const UBER_KW = "uber|transporte|onibus|metro|taxi|99|corrida|passagem|gasolina|combustivel|estacionamento";
const ALIM_KW = "alimentacao|comida|almoco|janta|jantar|lanche|refeicao|cafe|marmita";
const NUM = "(\\d+(?:[.,]\\d{1,2})?)";
const MONEY_SUFFIX = "(?:\\s*(?:reais|real|conto|contos|pila|pilas))?";

function parseMoney(text: string, kw: string): { value: number | undefined; rest: string } {
  let rest = text, sum = 0, found = false;
  const before = new RegExp(`\\b${NUM}${MONEY_SUFFIX}\\s+(?:de|no|na|com|em|do|da|pro|pra|para o|para a)\\s+(?:${kw})\\b`, "g");
  const after = new RegExp(`\\b(?:${kw})\\b(?:\\s+(?:foi|deu|custou|ficou|de|em))?\\s+${NUM}${MONEY_SUFFIX}`, "g");
  for (const re of [before, after]) {
    rest = rest.replace(re, (_all, n: string) => { sum += Number(n.replace(",", ".")); found = true; return " "; });
  }
  return { value: found ? sum : undefined, rest };
}

function parseCompany(text: string, companies: Pick<Company, "id" | "nome">[]): { empresa?: string; rest: string } {
  const norm = companies.map((c) => ({ id: c.id, nome: wordsToDigits(normalizeText(c.nome)) }));
  for (const c of norm) {
    const re = new RegExp(`\\b${escapeRe(c.nome)}\\b`);
    if (re.test(text)) return { empresa: c.id, rest: text.replace(re, " ") };
  }
  let best: { id: string; score: number; tokens: string[] } | undefined;
  for (const c of norm) {
    const tokens = c.nome.split(" ").filter((t) => t.length >= 3 && t !== "empresa");
    const hit = tokens.filter((t) => new RegExp(`\\b${escapeRe(t)}\\b`).test(text));
    if (hit.length && (!best || hit.length > best.score)) best = { id: c.id, score: hit.length, tokens: hit };
  }
  if (!best) return { rest: text };
  let rest = text;
  for (const t of best.tokens) rest = rest.replace(new RegExp(`\\b${escapeRe(t)}\\b`), " ");
  return { empresa: best.id, rest };
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const TIME_RE = /\b(\d{1,2})(?::|h)(\d{2})\b|\b(\d{1,2}) e meia\b|\b(\d{1,2}) e (\d{1,2})\b(?!\s*(?:reais|real|de|da|do|horas? de))|\b(\d{1,2})(?:\s*(?:horas?|hrs?|h))?\b/g;
const PERIOD_RE = /^\s*(?:da|de|pela)\s+(manha|madrugada|tarde|noite)\b/;
const DURATION_BEFORE = /(?:trabalhei|fiquei|por|durante|foram|deu|total de)\s*$/;

function parseTimes(text: string): string[] {
  const times: string[] = [];
  for (const m of text.matchAll(TIME_RE)) {
    let h: number, min = 0;
    if (m[1] !== undefined) { h = +m[1]; min = +m[2]; }
    else if (m[3] !== undefined) { h = +m[3]; min = 30; }
    else if (m[4] !== undefined) { h = +m[4]; min = +m[5]; }
    else { h = +m[6]; if (DURATION_BEFORE.test(text.slice(0, m.index))) continue; }
    if (h > 24 || min > 59) continue;
    const tail = text.slice(m.index! + m[0].length).match(PERIOD_RE);
    if (tail && (tail[1] === "tarde" || tail[1] === "noite") && h < 12) h += 12;
    if (h === 24) h = 0;
    times.push(`${pad(h)}:${pad(min)}`);
  }
  return times;
}

export function parseTranscript(raw: string, companies: Pick<Company, "id" | "nome">[], today = new Date()): ParsedEntry {
  try {
    let text = wordsToDigits(normalizeText(raw));
    text = text.replace(/\bmeio[- ]dia\b/g, "12:00").replace(/\bmeia[- ]noite\b/g, "00:00");
    const comp = parseCompany(text, companies); text = comp.rest;
    const date = parseDate(text, today); text = date.rest;
    const uber = parseMoney(text, UBER_KW); text = uber.rest;
    const alim = parseMoney(text, ALIM_KW); text = alim.rest;
    const times = parseTimes(text);
    const out: ParsedEntry = { data: date.data };
    if (comp.empresa) out.empresa = comp.empresa;
    if (times.length >= 2) { out.entrada = times[0]; out.saida = times[1]; }
    else if (times.length === 1) {
      if (/\b(sai|saida|saindo|terminei|ate|encerrei)\b/.test(text)) out.saida = times[0]; else out.entrada = times[0];
    }
    if (uber.value !== undefined) out.uber = uber.value;
    if (alim.value !== undefined) out.alimentacao = alim.value;
    return out;
  } catch {
    return { data: todayISO(today) };
  }
}
```

`import type { Company } from "./types";` no topo.

- [ ] **Step 4: Rodar → PASS.** Se um caso falhar, ajustar regex até passar (os testes são o contrato), sem afrouxar os testes.

---

### Task 4: `lib/store.ts` (Zustand persist + migração legado) e `lib/csv.ts` (TDD)

**Files:**
- Create: `lib/store.ts`, `lib/store.test.ts`, `lib/csv.ts`, `lib/csv.test.ts`, `lib/backup.ts`, `hooks/use-hydrated.ts`

**Interfaces:**
- Produces:
  - `useStore` (Zustand) com `companies`, `entries`, `addCompany`, `updateCompany`, `removeCompany`, `addEntry`, `updateEntry`, `removeEntry`, `clearEntries`, `importData`, `getCompany(id)`.
  - `STORAGE_KEY = "freela-tracker"`; `migrateLegacy(companiesRaw: string|null, entriesRaw: string|null): {companies: Company[]; entries: Entry[]} | null`.
  - `entriesToCSV(entries, getCompany): string`; `downloadText(filename, text, mime)`.
  - `backupSchema` (zod) e `serializeBackup(state)`, `parseBackup(json: string)` → `{companies, entries}` ou lança `ZodError`.
  - `useHydrated(): boolean`.

- [ ] **Step 1: testes do store**

```ts
// lib/store.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useStore, migrateLegacy, STORAGE_KEY } from "./store";
import { DEFAULT_COMPANIES } from "./types";

beforeEach(() => {
  localStorage.clear();
  useStore.setState({ companies: DEFAULT_COMPANIES, entries: [] });
});

describe("companies", () => {
  it("addCompany gera id e cor", () => {
    const c = useStore.getState().addCompany({ nome: "Nova", diaria: 600, extra: 50, horas: 12, almoco: 0, janta: 0 });
    expect(c.id).toMatch(/^c/);
    expect(c.cor).toBe("#34d399");
    expect(useStore.getState().companies).toHaveLength(3);
  });
  it("updateCompany", () => {
    useStore.getState().updateCompany("c1", { nome: "X", diaria: 1 });
    expect(useStore.getState().getCompany("c1")).toMatchObject({ nome: "X", diaria: 1 });
  });
  it("removeCompany mantém registros e não remove a última", () => {
    useStore.getState().addEntry({ data: "2026-08-01", empresa: "c2", alimentacao: 0, uber: 0 });
    useStore.getState().removeCompany("c2");
    expect(useStore.getState().companies.map((c) => c.id)).toEqual(["c1"]);
    expect(useStore.getState().entries).toHaveLength(1);
    useStore.getState().removeCompany("c1");
    expect(useStore.getState().companies).toHaveLength(1);
  });
  it("getCompany cai para a primeira quando id não existe", () => {
    expect(useStore.getState().getCompany("zzz").id).toBe("c1");
  });
  it("limite de 20", () => {
    for (let i = 0; i < 25; i++) useStore.getState().addCompany({ nome: `E${i}`, diaria: 1, extra: 1, horas: 1, almoco: 0, janta: 0 });
    expect(useStore.getState().companies).toHaveLength(20);
  });
});

describe("entries", () => {
  it("add/update/remove", () => {
    const e = useStore.getState().addEntry({ data: "2026-08-01", empresa: "c1", alimentacao: 0, uber: 0 });
    expect(typeof e.id).toBe("string");
    useStore.getState().updateEntry(e.id, { uber: 12, obs: "x" });
    expect(useStore.getState().entries[0]).toMatchObject({ uber: 12, obs: "x" });
    useStore.getState().removeEntry(e.id);
    expect(useStore.getState().entries).toHaveLength(0);
  });
  it("clearEntries", () => {
    useStore.getState().addEntry({ data: "2026-08-01", empresa: "c1", alimentacao: 0, uber: 0 });
    useStore.getState().clearEntries();
    expect(useStore.getState().entries).toHaveLength(0);
  });
  it("importData substitui tudo", () => {
    useStore.getState().importData({ companies: [DEFAULT_COMPANIES[1]], entries: [{ id: "9", data: "2026-01-01", empresa: "c2", alimentacao: 0, uber: 0 }] });
    expect(useStore.getState().companies).toHaveLength(1);
    expect(useStore.getState().entries[0].id).toBe("9");
  });
});

describe("persist + legado", () => {
  it("persiste em localStorage", () => {
    useStore.getState().addEntry({ data: "2026-08-01", empresa: "c1", alimentacao: 0, uber: 0 });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).state.entries).toHaveLength(1);
  });
  it("migrateLegacy converte ids numéricos e strings", () => {
    const r = migrateLegacy(
      JSON.stringify([{ id: "c1", nome: "A", diaria: "550", extra: 45.83, horas: 12, almoco: 0, janta: 0, cor: "#000" }]),
      JSON.stringify([{ id: 1723000000000, data: "2026-08-01", empresa: "c1", entrada: "08:00", saida: "20:00", alimentacao: "10", uber: "", obs: "" }]),
    );
    expect(r!.companies[0].diaria).toBe(550);
    expect(r!.entries[0]).toEqual({ id: "1723000000000", data: "2026-08-01", empresa: "c1", entrada: "08:00", saida: "20:00", alimentacao: 10, uber: 0, obs: "" });
  });
  it("migrateLegacy retorna null sem dados", () => expect(migrateLegacy(null, null)).toBeNull());
  it("migrateLegacy usa empresas padrão se só houver registros", () => {
    const r = migrateLegacy(null, JSON.stringify([{ id: 1, data: "2026-08-01", empresa: "c1" }]));
    expect(r!.companies).toEqual(DEFAULT_COMPANIES);
  });
});
```

- [ ] **Step 2: testes de CSV/backup**

```ts
// lib/csv.test.ts
import { describe, it, expect } from "vitest";
import { entriesToCSV } from "./csv";
import { parseBackup, serializeBackup } from "./backup";
import { DEFAULT_COMPANIES } from "./types";

const getCompany = () => DEFAULT_COMPANIES[0];

describe("entriesToCSV", () => {
  it("cabeçalho e linha", () => {
    const csv = entriesToCSV([{ id: "1", data: "2026-08-01", empresa: "c1", entrada: "08:00", saida: "22:00", alimentacao: 5, uber: 10, obs: 'ok "x"' }], getCompany);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Data,Empresa,Entrada,Saída,H.Extra,Base,Extra R$,Alim.Extra,Transporte,Total,Obs");
    expect(lines[1]).toBe('2026-08-01,"Empresa 1",08:00,22:00,2.0,550.00,91.66,5.00,10.00,641.66,"ok ""x"""');
  });
});

describe("backup", () => {
  it("round-trip", () => {
    const json = serializeBackup({ companies: DEFAULT_COMPANIES, entries: [] });
    expect(parseBackup(json)).toEqual({ companies: DEFAULT_COMPANIES, entries: [] });
  });
  it("rejeita inválido", () => expect(() => parseBackup('{"companies":[{"nome":1}]}')).toThrow());
});
```

- [ ] **Step 3: Rodar → FAIL**

- [ ] **Step 4: Implementar `lib/store.ts`**

```ts
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { DEFAULT_COMPANIES, MAX_COMPANIES, PALETTE, type Company, type Entry } from "./types";

export const STORAGE_KEY = "freela-tracker";

type Data = { companies: Company[]; entries: Entry[] };

type State = Data & {
  addCompany(input: Omit<Company, "id" | "cor">): Company;
  updateCompany(id: string, patch: Partial<Omit<Company, "id">>): void;
  removeCompany(id: string): void;
  addEntry(input: Omit<Entry, "id">): Entry;
  updateEntry(id: string, patch: Partial<Omit<Entry, "id">>): void;
  removeEntry(id: string): void;
  clearEntries(): void;
  importData(data: Data): void;
  getCompany(id: string): Company;
};

const num = (v: unknown, fallback = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fallback; };

export function migrateLegacy(companiesRaw: string | null, entriesRaw: string | null): Data | null {
  if (!companiesRaw && !entriesRaw) return null;
  let companies: Company[] = DEFAULT_COMPANIES;
  let entries: Entry[] = [];
  try {
    if (companiesRaw) {
      const arr = JSON.parse(companiesRaw);
      if (Array.isArray(arr) && arr.length) companies = arr.map((c, i) => ({
        id: String(c.id), nome: String(c.nome ?? `Empresa ${i + 1}`), diaria: num(c.diaria, 550), extra: num(c.extra, 45.83),
        horas: num(c.horas, 12), almoco: num(c.almoco), janta: num(c.janta), cor: String(c.cor ?? PALETTE[i % PALETTE.length]),
      }));
    }
    if (entriesRaw) {
      const arr = JSON.parse(entriesRaw);
      if (Array.isArray(arr)) entries = arr.filter((e) => e && e.data).map((e) => ({
        id: String(e.id), data: String(e.data), empresa: String(e.empresa ?? companies[0].id),
        entrada: e.entrada || undefined, saida: e.saida || undefined,
        alimentacao: num(e.alimentacao), uber: num(e.uber), obs: e.obs ?? "",
      }));
    }
  } catch { return null; }
  return { companies, entries };
}

const legacyAwareStorage: StateStorage = {
  getItem: (name) => {
    const v = localStorage.getItem(name);
    if (v) return v;
    const migrated = migrateLegacy(localStorage.getItem("freela_companies"), localStorage.getItem("freela_entries"));
    return migrated ? JSON.stringify({ state: migrated, version: 1 }) : null;
  },
  setItem: (name, value) => localStorage.setItem(name, value),
  removeItem: (name) => localStorage.removeItem(name),
};

const newId = (prefix = "") => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      companies: DEFAULT_COMPANIES,
      entries: [],
      addCompany: (input) => {
        const { companies } = get();
        const c: Company = { ...input, id: newId("c"), cor: PALETTE[companies.length % PALETTE.length] };
        if (companies.length >= MAX_COMPANIES) return c;
        set({ companies: [...companies, c] });
        return c;
      },
      updateCompany: (id, patch) => set((s) => ({ companies: s.companies.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeCompany: (id) => set((s) => (s.companies.length <= 1 ? s : { companies: s.companies.filter((c) => c.id !== id) })),
      addEntry: (input) => {
        const e: Entry = { ...input, id: newId() };
        set((s) => ({ entries: [...s.entries, e] }));
        return e;
      },
      updateEntry: (id, patch) => set((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      removeEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      clearEntries: () => set({ entries: [] }),
      importData: (data) => set({ companies: data.companies, entries: data.entries }),
      getCompany: (id) => { const { companies } = get(); return companies.find((c) => c.id === id) ?? companies[0]; },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => legacyAwareStorage),
      partialize: (s) => ({ companies: s.companies, entries: s.entries }),
    },
  ),
);
```

`hooks/use-hydrated.ts`:
```ts
"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

export function useHydrated() {
  const [hydrated, setHydrated] = useState(useStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useStore.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}
```

- [ ] **Step 5: Implementar `lib/csv.ts` e `lib/backup.ts`**

```ts
// lib/csv.ts
import { calcEntry } from "./calc";
import type { Company, Entry } from "./types";

const q = (s: string) => `"${s.replace(/"/g, '""')}"`;

export function entriesToCSV(entries: Entry[], getCompany: (id: string) => Company) {
  let csv = "Data,Empresa,Entrada,Saída,H.Extra,Base,Extra R$,Alim.Extra,Transporte,Total,Obs\n";
  for (const e of entries) {
    const co = getCompany(e.empresa); const c = calcEntry(e, co);
    csv += `${e.data},${q(co.nome)},${e.entrada ?? ""},${e.saida ?? ""},${c.extraHours.toFixed(1)},${c.base.toFixed(2)},${c.extraVal.toFixed(2)},${c.alimExtra.toFixed(2)},${c.uber.toFixed(2)},${c.total.toFixed(2)},${q(e.obs ?? "")}\n`;
  }
  return csv;
}

export function downloadText(filename: string, text: string, mime = "text/plain") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
```

```ts
// lib/backup.ts
import { z } from "zod";
import type { Company, Entry } from "./types";

const companySchema = z.object({ id: z.string(), nome: z.string(), diaria: z.number(), extra: z.number(), horas: z.number(), almoco: z.number(), janta: z.number(), cor: z.string() });
const entrySchema = z.object({ id: z.string(), data: z.string(), empresa: z.string(), entrada: z.string().optional(), saida: z.string().optional(), alimentacao: z.number(), uber: z.number(), obs: z.string().optional() });
export const backupSchema = z.object({ companies: z.array(companySchema).min(1), entries: z.array(entrySchema) });

export function serializeBackup(data: { companies: Company[]; entries: Entry[] }) {
  return JSON.stringify({ app: "freela-tracker", exportedAt: new Date().toISOString(), ...data }, null, 2);
}

export function parseBackup(json: string): { companies: Company[]; entries: Entry[] } {
  return backupSchema.parse(JSON.parse(json));
}
```

- [ ] **Step 6: Rodar → PASS** (`npm test`)

---

### Task 5: Shell, tema, layout e navegação

**Files:**
- Modify: `app/layout.tsx`, `app/globals.css`
- Create: `app/page.tsx`, `components/layout/bottom-nav.tsx`, `components/layout/month-select.tsx`, `components/layout/stat-card.tsx`, `components/layout/company-badge.tsx`

**Interfaces:**
- Produces: `type Tab = "registrar"|"tabela"|"financas"|"resumo"|"config"`; `<BottomNav value onChange/>`; `<MonthSelect value onChange/>` (usa `monthOptions()`); `<StatCard label value tone?="green"|"accent"|"yellow"|"red"|"orange" small?/>`; `<CompanyBadge company/>`.
- Consumes: `monthOptions`, `useHydrated`.

- [ ] **Step 1: `app/globals.css`** — manter o import do Tailwind/shadcn gerado e sobrescrever os tokens `:root`/`.dark` com a paleta das Global Constraints (`--background: #0a0d14; --card: #181c2a; --border: #232840; --primary: #4f8ef7; --muted-foreground: #6b7494; --foreground: #e8eaf0; --destructive: #f87171; --radius: 0.875rem` etc.). Adicionar `html{color-scheme:dark}` e classe `.safe-bottom{padding-bottom:calc(64px + env(safe-area-inset-bottom))}`. Bloco `@media print { .no-print{display:none} body{background:#fff;color:#000} }`.

- [ ] **Step 2: `app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Freela Tracker",
  description: "Controle de horas e pagamentos freelancer",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Freela", statusBarStyle: "black-translucent" },
};
export const viewport: Viewport = { themeColor: "#0a0d14", viewportFit: "cover", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`dark ${inter.variable}`}>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        {children}
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: `components/layout/bottom-nav.tsx`** — 5 botões (`Plus`, `Table2`, `BarChart3`, `FolderKanban`, `Settings` do lucide) fixos no rodapé, `aria-current` no ativo, classes: `fixed bottom-0 inset-x-0 z-50 grid grid-cols-5 border-t border-border bg-[#12151f] pb-[env(safe-area-inset-bottom)]`; item ativo `text-primary`, inativo `text-muted-foreground`.

- [ ] **Step 4: `components/layout/month-select.tsx`** — wrapper do `Select` do shadcn sobre `monthOptions()` (`useMemo`), prop `className`.

- [ ] **Step 5: `components/layout/stat-card.tsx`** e `company-badge.tsx`

```tsx
const tones = { green: "text-emerald-400", accent: "text-primary", yellow: "text-amber-400", red: "text-red-400", orange: "text-orange-400", default: "text-foreground" } as const;
export function StatCard({ label, value, tone = "default", small, danger }: { label: string; value: string | number; tone?: keyof typeof tones; small?: boolean; danger?: boolean }) {
  return (
    <div className={cn("rounded-xl border bg-card p-3", danger && "border-red-400/30")}>
      <div className={cn("text-[11px] text-muted-foreground", danger && "text-red-400")}>{label}</div>
      <div className={cn("font-bold", small ? "text-sm" : "text-lg", tones[tone])}>{value}</div>
    </div>
  );
}
```
```tsx
export function CompanyBadge({ company }: { company: Company }) {
  return <span className="rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: `${company.cor}22`, color: company.cor }}>{company.nome}</span>;
}
```

- [ ] **Step 6: `app/page.tsx`** — `"use client"`; estado `tab` inicializado do `location.hash` (em `useEffect`) e gravado no hash ao trocar; header `Freela <span className="text-primary">Tracker</span>`; renderiza a view da aba (componentes das Tasks 6–10; até lá, placeholders `<div/>`); `<BottomNav/>`. Enquanto `!useHydrated()` mostra um spinner simples.

- [ ] **Step 7: `npm run build`** passa; `npm run dev` abre com header + nav.

---

### Task 6: Aba Registrar — `EntryForm` + `VoiceCapture`

**Files:**
- Create: `components/entries/entry-form.tsx`, `components/entries/voice-capture.tsx`, `components/entries/register-view.tsx`, `components/entries/entry-form.test.tsx`

**Interfaces:**
- Produces: `entrySchema` (zod) e `type EntryFormValues`; `<EntryForm defaultValues onSubmit(values) submitLabel formRef?/>` — `EntryForm` expõe `reset`/`setValues` via `useImperativeHandle` (`EntryFormHandle = { setValues(p: Partial<EntryFormValues>): void; reset(): void }`); `<VoiceCapture onParsed(p: ParsedEntry)/>`; `<RegisterView/>`.
- Consumes: `useStore.addEntry`, `parseTranscript`, `todayISO`, `CompanyBadge`.

- [ ] **Step 1: Teste do form**

```tsx
// components/entries/entry-form.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { EntryForm } from "./entry-form";
import { DEFAULT_COMPANIES } from "@/lib/types";

describe("EntryForm", () => {
  it("exige data e envia números", async () => {
    const onSubmit = vi.fn();
    render(<EntryForm companies={DEFAULT_COMPANIES} defaultValues={{ data: "", empresa: "c1", entrada: "", saida: "", alimentacao: "", uber: "", obs: "" }} onSubmit={onSubmit} submitLabel="Salvar" />);
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Informe a data")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Data"), "2026-08-20");
    await userEvent.type(screen.getByLabelText("Uber/Transp. (R$)"), "12.5");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ data: "2026-08-20", empresa: "c1", uber: 12.5, alimentacao: 0 }));
  });
});
```

- [ ] **Step 2: Rodar → FAIL**

- [ ] **Step 3: Implementar `entry-form.tsx`**

Schema:
```ts
export const entrySchema = z.object({
  data: z.string().min(1, "Informe a data"),
  empresa: z.string().min(1),
  entrada: z.string().regex(/^(\d{2}:\d{2})?$/, "HH:MM"),
  saida: z.string().regex(/^(\d{2}:\d{2})?$/, "HH:MM"),
  alimentacao: z.string(),
  uber: z.string(),
  obs: z.string(),
});
export type EntryFormValues = z.infer<typeof entrySchema>;
export type EntrySubmit = Omit<Entry, "id">;
export function toEntry(v: EntryFormValues): EntrySubmit {
  return { data: v.data, empresa: v.empresa, entrada: v.entrada || undefined, saida: v.saida || undefined, alimentacao: Number(v.alimentacao) || 0, uber: Number(v.uber) || 0, obs: v.obs || undefined };
}
export function fromEntry(e: Entry): EntryFormValues {
  return { data: e.data, empresa: e.empresa, entrada: e.entrada ?? "", saida: e.saida ?? "", alimentacao: e.alimentacao ? String(e.alimentacao) : "", uber: e.uber ? String(e.uber) : "", obs: e.obs ?? "" };
}
```
Componente: `forwardRef<EntryFormHandle, Props>` com `useForm({ resolver: zodResolver(entrySchema), defaultValues })`; campos em grid 2 colunas (`Label htmlFor` + `Input id`): Data (`type=date`), Empresa (`Select` com `Controller`), Entrada/Saída (`type=time`), Alimentação/Uber (`type=number step=0.01 min=0 inputMode=decimal`), Observação (`Textarea`); mensagens de erro abaixo do campo; botão `submit` full width. `onSubmit={(v) => props.onSubmit(toEntry(v))}`. Para o select shadcn em jsdom, o label "Empresa" pode ser só visual — o teste não interage com ele.

- [ ] **Step 4: Rodar → PASS**

- [ ] **Step 5: `voice-capture.tsx`**

```tsx
"use client";
export function VoiceCapture({ onParsed }: { onParsed: (p: ParsedEntry) => void }) {
  const companies = useStore((s) => s.companies);
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("Toque para gravar");
  const recRef = useRef<SpeechRecognition | null>(null);
  const supported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  // toggle(): cria new SR(), lang pt-BR, continuous, interimResults; onresult acumula finais em `text`; onend seta recording=false.
  // handleParse(): const p = parseTranscript(text, companies); se só tem `data` (nada mais reconhecido) → setStatus("Não entendi — preencha manualmente"); senão onParsed(p) e status com resumo "📅 20/08 · 🏢 Empresa 2 · ▶ 08:00 · ⏹ 22:00 · 🚗 R$35".
  // UI: Card "🎙 Falar ou digitar": botão redondo mic (Mic/Square do lucide; `animate-pulse` gravando; disabled se !supported com texto "Reconhecimento de voz indisponível neste navegador — digite abaixo"), status, Textarea editável com o transcript, Button outline "✨ Preencher com voz".
}
```
Declarar tipos mínimos em `types/speech.d.ts` se o TS não conhecer `SpeechRecognition` (`declare global { interface Window { webkitSpeechRecognition: typeof SpeechRecognition } }`).

- [ ] **Step 6: `register-view.tsx`** — monta `VoiceCapture` + Card "✏️ Manual" com `EntryForm` (ref), `defaultValues` com `data: todayISO()`, `empresa: companies[0].id`; `onSubmit` → `addEntry(values)`, `toast.success("Registro adicionado!")`, `ref.reset()` mantendo data e empresa; `onParsed` → `ref.setValues({...})` convertendo números para string.

- [ ] **Step 7: Plugar em `app/page.tsx`**; `npm test` e teste manual no browser: gravar/digitar "ontem das 8 às 22 gastei 30 de uber" → form preenchido → adicionar.

---

### Task 7: Aba Tabela — listar, editar (Sheet) e excluir

**Files:**
- Create: `components/entries/entries-table.tsx`, `components/entries/edit-entry-sheet.tsx`, `components/entries/table-view.tsx`

**Interfaces:**
- Consumes: `useStore` (entries, companies, getCompany, updateEntry, removeEntry), `calcEntry`, `fmtBRL`, `fmtHours`, `MonthSelect`, `CompanyBadge`, `EntryForm` + `fromEntry`.
- Produces: `<TableView/>`; `<EditEntrySheet entry onOpenChange/>`.

- [ ] **Step 1: `table-view.tsx`** — estado `month` (default `monthKey(new Date())`) e `empresa` (`""` = todas); filtros em Card (`MonthSelect` + `Select` de empresas com item "Todas empresas"); `filtered = entries.filter(data.startsWith(month) && (!empresa || e.empresa===empresa)).sort(by data)`; passa para `EntriesTable`.

- [ ] **Step 2: `entries-table.tsx`** — `Table` shadcn dentro de `overflow-x-auto`; colunas: Data(dia), Empresa, Horário, H.Extra, Base, Extra R$, Total, Gasto part., ações. Ações: `Button ghost size=icon` `Pencil` → `setEditing(entry)`; `AlertDialog` com `Trash2` → "Apagar este registro?" → `removeEntry(id)` + `toast("Registro apagado")`. Vazio: "📭 Nenhum registro". `TableFooter`: linha "TOTAL A COBRAR (N dias)" com `summarizeEntries` (h.extra, base, extra, total) e linha vermelha "⚠️ Gastos particulares (alim. + transp.) — não cobrado" com `gasto`.

- [ ] **Step 3: `edit-entry-sheet.tsx`** — `Sheet side="bottom"` com `EntryForm defaultValues={fromEntry(entry)} submitLabel="Salvar alterações" onSubmit={(v)=>{updateEntry(entry.id, v); toast.success("Registro atualizado!"); onOpenChange(false)}}`. `key={entry.id}` para resetar o form.

- [ ] **Step 4: Plugar em `page.tsx`; teste manual: editar horário → total recalcula; excluir.**

---

### Task 8: Abas Resumo e Finanças (mensal + 12 meses com Recharts)

**Files:**
- Create: `components/summary/summary-view.tsx`, `components/finance/finance-view.tsx`, `components/finance/finance-monthly.tsx`, `components/finance/finance-annual.tsx`, `lib/finance.ts`, `lib/finance.test.ts`

**Interfaces:**
- Produces: `annualSeries(entries, getCompany, now?): {label, dias, ganhos, alim, transporte, liquido}[]` (12 meses; `liquido = ganhos − alim − transporte`, `alim = alimConf + alimExtra`).
- Consumes: `summarizeEntries`, `groupByCompany`, `last12Months`, `StatCard`, `CompanyBadge`, `MonthSelect`, `ChartContainer`/`BarChart` (shadcn chart + recharts).

- [ ] **Step 1: Teste `lib/finance.test.ts`**

```ts
import { annualSeries } from "./finance";
import { DEFAULT_COMPANIES } from "./types";
it("annualSeries soma por mês", () => {
  const now = new Date(2026, 7, 20);
  const s = annualSeries([
    { id: "1", data: "2026-08-01", empresa: "c2", alimentacao: 10, uber: 5 },
    { id: "2", data: "2025-09-10", empresa: "c1", alimentacao: 0, uber: 0 },
  ], () => DEFAULT_COMPANIES[1], now);
  expect(s).toHaveLength(12);
  expect(s[11]).toEqual({ label: "Ago 2026", dias: 1, ganhos: 500, alim: 110, transporte: 5, liquido: 385 });
  expect(s[0].dias).toBe(1);
});
```

- [ ] **Step 2: Implementar `lib/finance.ts`**

```ts
export function annualSeries(entries: Entry[], getCompany: (id: string) => Company, now = new Date()) {
  return last12Months(now).map((m) => {
    const t = summarizeEntries(entries.filter((e) => e.data.startsWith(m.key)), getCompany);
    const alim = t.alimConf + t.alimExtra;
    return { label: m.label, dias: t.dias, ganhos: t.total, alim, transporte: t.uber, liquido: t.total - alim - t.uber };
  });
}
```

- [ ] **Step 3: `summary-view.tsx`** — Card "📅 Período" com `MonthSelect`; grid 2 col de `StatCard`: "💰 A cobrar" (green), "📅 Dias trabalhados" (accent), "⏰ H. extras" (yellow, `fmtBRL(extra)`), "⚠️ Gasto particular" (red, danger) ; Card "Por empresa": para cada `groupByCompany`, linha com `CompanyBadge` + "N dias" e grid de 4 `StatCard small` (Base, H. extras, 💰 A cobrar, ⚠️ Gasto part.). Vazio: "Nenhum dado ainda".

- [ ] **Step 4: `finance-view.tsx`** — `Tabs` ("Mensal" | "12 Meses"); `MonthSelect` visível só na mensal.

- [ ] **Step 5: `finance-monthly.tsx`** — totals do mês: cards "💰 A cobrar", "📅 Dias", "🍽 Alim. (gasto part.)" = `alimConf+alimExtra` (red), "🚗 Transp. (gasto part.)" (red). Card "📉 Gastos sobre ganhos": duas barras (`div` com `h-2 rounded bg-border` e filho `bg-orange-400`/`bg-amber-400` com `width: pct%`, `pct = min(100, valor/ganhos*100)`), linha "Total gastos". Card "Por empresa": `CompanyBadge` + 4 `StatCard small` (Ganho green, Alim. fixa orange=`alimConf`, Transp. yellow=`uber`, Líquido accent=`liquido`).

- [ ] **Step 6: `finance-annual.tsx`** — `const data = useMemo(() => annualSeries(entries, getCompany), [entries, companies])`; três Cards ("📈 Ganhos mensais — últimos 12 meses" `#34d399`, "💸 Gastos mensais (alim + transporte)" `#f87171`, "📊 Lucro líquido (ganhos − gastos)" `#4f8ef7`) cada um com:

```tsx
<ChartContainer config={{ v: { label, color } }} className="h-44 w-full">
  <BarChart data={data.map(d => ({ label: d.label, v: d[key] }))}>
    <CartesianGrid vertical={false} stroke="#232840" />
    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: "#6b7494" }} />
    <YAxis tickLine={false} axisLine={false} width={48} tick={{ fontSize: 9, fill: "#6b7494" }} tickFormatter={(v) => "R$" + Number(v).toLocaleString("pt-BR")} />
    <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmtBRL(Number(v))} />} />
    <Bar dataKey="v" fill={color} radius={6} />
  </BarChart>
</ChartContainer>
```
Depois uma `Table` (Mês, Dias, Ganhos, Alim., Transporte, Líquido) com rodapé TOTAL.

- [ ] **Step 7: `npm test`; plugar em `page.tsx`; checar gráficos no browser.**

---

### Task 9: Aba Config — empresas, exportar, backup, zona de perigo

**Files:**
- Create: `components/config/config-view.tsx`, `components/companies/company-card.tsx`, `components/companies/add-company-dialog.tsx`, `components/config/export-card.tsx`, `components/config/backup-card.tsx`, `components/config/danger-zone.tsx`

**Interfaces:**
- Consumes: `useStore` (companies, addCompany, updateCompany, removeCompany, clearEntries, importData, entries, getCompany), `entriesToCSV`, `downloadText`, `serializeBackup`, `parseBackup`, `MonthSelect`, `MAX_COMPANIES`.

- [ ] **Step 1: `company-card.tsx`** — Card com bolinha da cor + nome; inputs controlados localmente (`useState` inicializado da empresa; `key={company.id}`): Nome, Diária (R$), Hora extra (R$), Horas/dia base, Almoço (R$/dia), Janta (R$/dia). Expõe `getValues()` via ref, ou mais simples: `onChange(patch)` para o pai acumular em `drafts: Record<id, Partial<Company>>`. Botão "✕ Remover" (só se `companies.length > 1`) com `AlertDialog` "Remover esta empresa? Os registros não serão apagados." → `removeCompany`.

- [ ] **Step 2: `config-view.tsx`** — lista de `CompanyCard`; botão tracejado "＋ Adicionar empresa" (oculto se `>= MAX_COMPANIES`) abre `AddCompanyDialog`; botão verde "💾 Salvar configurações" aplica `updateCompany` para cada draft (nome vazio mantém o anterior; números inválidos mantêm o anterior; almoço/janta vazios = 0), `toast.success("Configurações salvas!")`; depois `ExportCard`, `BackupCard`, `DangerZone`.

- [ ] **Step 3: `add-company-dialog.tsx`** — `Dialog` com campos Nome (default `Empresa ${n+1}`), Diária (placeholder 550), Hora extra (45.83), Horas/dia (12), Alim. almoço, Alim. janta; "Adicionar" → `addCompany({ nome, diaria: Number(..)||550, extra: ..||45.83, horas: ..||12, almoco: ..||0, janta: ..||0 })`, toast `${nome} adicionada!`. Nome vazio → erro inline "Informe o nome".

- [ ] **Step 4: `export-card.tsx`** — "📤 Exportar relatório": `MonthSelect`, `Checkbox` "Incluir alimentação e transporte no total", botões "📄 Exportar PDF" → `window.open(`/relatorio?mes=${month}&gastos=${inc?1:0}`, "_blank")` e "📊 CSV" → `downloadText(`freela-${month}.csv`, entriesToCSV(filtered, getCompany), "text/csv")`.

- [ ] **Step 5: `backup-card.tsx`** — "💾 Backup": botão "Baixar backup (.json)" → `downloadText(`freela-backup-${todayISO()}.json`, serializeBackup({companies, entries}), "application/json")`; botão "Restaurar backup" → `<input type=file accept=".json" hidden>` → lê `file.text()` → `parseBackup` → `AlertDialog` "Substituir todos os dados atuais por este backup (N registros, M empresas)?" → `importData` + toast; erro de parse → `toast.error("Arquivo de backup inválido")`.

- [ ] **Step 6: `danger-zone.tsx`** — Card título vermelho "⚠️ Zona de perigo", `AlertDialog` "Apagar TODOS os registros?" → `clearEntries()` + toast "Dados apagados".

- [ ] **Step 7: Plugar em `page.tsx`; teste manual de cada ação; `npm run build`.**

---

### Task 10: Página de impressão `/relatorio`

**Files:**
- Create: `app/relatorio/page.tsx`, `components/report/report-view.tsx`

**Interfaces:**
- Consumes: `useStore`, `calcEntry`, `summarizeEntries`, `groupByCompany`, `monthLabel`, `fmtBRL`, `fmtHours`, `useHydrated`.

- [ ] **Step 1: `app/relatorio/page.tsx`** — `export default function Page(){ return <Suspense><ReportView/></Suspense> }` (obrigatório para `useSearchParams` em export estático).

- [ ] **Step 2: `report-view.tsx`** — `"use client"`; lê `mes` (default mês atual) e `gastos` de `useSearchParams`; filtra entries; layout claro para impressão (`bg-white text-black` forçado via classe `print-page` + `color-scheme: light`): título "Relatório — {monthLabel}", tabela (Dia, Empresa, Horário, H. extra, Base, Extra, [Alim.+Transp. se gastos], Total), subtotais por empresa e total geral (total = `totalComGastos` quando `gastos=1`, senão `total`), rodapé "Gerado em dd/mm/aaaa". Barra superior `no-print` com botões "Imprimir / salvar PDF" (`window.print()`) e "Voltar" (`history.back()`).

- [ ] **Step 3: `npm run build`** (rota `/relatorio` exportada) e teste manual com `?mes=2026-08&gastos=1`.

---

### Task 11: PWA, limpeza e verificação final

**Files:**
- Modify: `public/manifest.json`, `app/layout.tsx` (ícone), `README.md`
- Delete: arquivos de exemplo do create-next-app não usados (`public/*.svg`, `app/page.module.css` se existir)

- [ ] **Step 1:** `public/icon.svg` (💼 em fundo `#0a0d14`, mesmo do manifest legado) e referenciar no manifest (`icons[0].src = "/icon.svg"`) e `metadata.icons`.
- [ ] **Step 2:** README curto: o que é, `npm run dev`, `npm test`, `npm run build` (saída em `out/`), como restaurar dados legados (abrir o app na mesma origem do antigo migra sozinho; senão, usar backup JSON).
- [ ] **Step 3:** `npm run lint`, `npm test`, `npm run build` — todos verdes. Smoke test manual no browser (abas, criar/editar/excluir registro e empresa, export CSV, relatório, backup/restore, recarregar a página e confirmar persistência).
- [ ] **Step 4:** Atualizar a nota do vault `Projetos - Visão Geral.md` com a entrada "Freela Tracker" (caminho, stack, o que é, particularidades: 100% client-side/localStorage, parser de voz offline).
