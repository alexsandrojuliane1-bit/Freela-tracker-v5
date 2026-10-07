# Freela Tracker — migração para Next.js (client-side, localStorage)

Data: 2026-08-20

## Objetivo

Reescrever o `index.html` (PWA vanilla JS de arquivo único) na stack padrão do desenvolvedor — Next.js App Router + TypeScript + shadcn/ui + Tailwind — mantendo o app **100% no navegador**: todos os dados (registros de dias trabalhados e empresas) são salvos, editados e excluídos no `localStorage`. Sem backend, sem banco, sem autenticação.

Entregas além da paridade com o HTML atual:

- **Editar registro** (hoje só existe criar/apagar).
- **Parser offline** de transcrição de voz (substitui a chamada quebrada à API da Anthropic).
- **Exportar PDF** via página de impressão (hoje o botão chama uma função inexistente).
- **Backup/restauração JSON** dos dados.
- **Migração automática** das chaves antigas `freela_entries` / `freela_companies` do localStorage na primeira abertura.

Fora de escopo: backend, sync entre dispositivos, multiusuário, LLM.

## Stack e decisões

| Item | Escolha | Motivo |
|---|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript | Padrão do portfólio (govcon-frontend) |
| Build | `output: 'export'` (estático) | Continua PWA instalável; hospeda em qualquer static host |
| UI | shadcn/ui `new-york` (Radix), Tailwind v4, Lucide, Sonner | Padrão do portfólio |
| Forms | react-hook-form + zod | Padrão do portfólio |
| Estado/persistência | Zustand + middleware `persist` (localStorage) | Já usado no credenpass; resolve hidratação SSR e serialização |
| Gráficos | Recharts via componente `chart` do shadcn | Substitui Chart.js CDN |
| Testes | Vitest (+ @testing-library/react onde necessário) | Obrigatório pela stack |
| Voz → campos | Web Speech API (transcrição nativa) + parser TS determinístico | Offline, sem chave, testável |
| PDF | Rota `/relatorio` com CSS de impressão + `window.print()` | Zero dependências |

Sem NextAuth, sem Prisma, sem API routes (não há servidor).

## Modelo de dados

```ts
type Company = {
  id: string        // 'c' + Date.now() (compatível com dados legados 'c1', 'c2')
  nome: string
  diaria: number    // R$ por dia
  extra: number     // R$ por hora extra
  horas: number     // horas base do dia (ex.: 12)
  almoco: number    // R$/dia (gasto particular fixo)
  janta: number     // R$/dia (gasto particular fixo)
  cor: string       // hex, escolhido de PALETTE
}

type Entry = {
  id: string        // string (legado usa number; migração converte com String())
  data: string      // 'YYYY-MM-DD'
  empresa: string   // Company.id
  entrada?: string  // 'HH:MM'
  saida?: string    // 'HH:MM'
  alimentacao: number  // gasto extra de alimentação do dia
  uber: number         // gasto de transporte do dia
  obs?: string
}
```

Chave única no localStorage: `freela-tracker` (objeto `{ companies, entries }` gerenciado pelo Zustand persist, `version: 1`).

**Migração:** no `onRehydrateStorage`/primeiro load, se `freela-tracker` não existir e `freela_entries`/`freela_companies` existirem, importar (convertendo `id` numérico → string e números em string → number) e manter as chaves antigas intactas.

Empresas padrão (quando não há nenhuma): as duas do HTML atual (`c1` Empresa 1, `c2` Empresa 2).

## Regras de cálculo (`lib/calc.ts`)

Portadas sem alteração de `calcEntry`:

- `extraHours = max(0, (saida − entrada em horas, com virada de meia-noite) − company.horas)`; 0 se faltar entrada ou saída.
- `base = diaria`; `extraVal = extraHours × extra`.
- `alimConf = almoco + janta` (fixo da empresa); `alimExtra = entry.alimentacao`; `uber = entry.uber`.
- `total (a cobrar) = base + extraVal` — gastos **não** entram.
- `totalGasto = alimConf + alimExtra + uber`; `totalComGastos = total + alimConf + alimExtra + uber`.
- Líquido (Finanças): `total − uber − alimExtra` por registro; no anual `ganhos − (alimConf+alimExtra) − transporte`.

Funções puras adicionais: agregação por mês (`summarizeMonth`), por empresa, últimos 12 meses (`last12Months`), `fmtBRL`, `fmtHours`. Todas com testes.

## Parser de transcrição (`lib/parse-transcript.ts`)

Entrada: texto pt-BR informal + lista de empresas + data de hoje. Saída: `Partial<Entry>` com só os campos reconhecidos.

Regras (mesmas do prompt antigo):

- **Data:** "hoje" → hoje; "ontem"/"anteontem"; "dia N" / "dia N do mês M" → mês atual (ou M); default hoje.
- **Horários:** números por extenso e dígitos ("oito", "sete e meia", "nove e trinta", "vinte e duas", "meia-noite", "meio-dia", "X da manhã/tarde/noite", "18h", "8:30"). Primeira hora = entrada, segunda = saída; "das X às Y" / "de X a Y" / "entrei às X … saí às Y".
- **Empresa:** match por nome (case/acento-insensível, por token); sem match → `undefined` (a UI mantém a empresa já selecionada).
- **Gastos:** "gastei 30 de uber/transporte/ônibus/99" → `uber`; "… de alimentação/comida/almoço/janta/lanche" → `alimentacao`. Valores "trinta reais", "R$ 30", "30,50".
- **Obs:** não inferida (o usuário preenche).

O parser é puro e coberto por uma tabela de casos no Vitest (≥ 20 frases).

## Estrutura de arquivos

```
app/
  layout.tsx               # tema dark, fonte Inter, <Toaster/>, manifest link
  page.tsx                 # shell com as 5 abas (client) — estado de aba na URL hash (#registrar etc.)
  relatorio/page.tsx       # página de impressão (?mes=YYYY-MM&gastos=1)
  globals.css
components/
  ui/…                     # shadcn: button, card, input, label, select, textarea, dialog, sheet, tabs, table, checkbox, chart, badge, separator, alert-dialog
  layout/bottom-nav.tsx
  layout/month-select.tsx
  entries/entry-form.tsx   # form RHF+zod usado em criar e editar
  entries/voice-capture.tsx
  entries/entries-table.tsx
  entries/edit-entry-sheet.tsx
  companies/company-card.tsx
  companies/add-company-dialog.tsx
  finance/finance-monthly.tsx
  finance/finance-annual.tsx   # 3 gráficos Recharts + tabela 12 meses
  summary/summary-view.tsx
  config/backup-card.tsx       # exportar/importar JSON
  config/export-card.tsx       # CSV + PDF
  config/danger-zone.tsx
lib/
  types.ts
  calc.ts
  dates.ts                 # meses pt-BR, lista de meses desde 2024, last12Months
  parse-transcript.ts
  csv.ts
  store.ts                 # Zustand persist + migração legado
  utils.ts                 # cn()
tests/ (ou *.test.ts ao lado)   # Vitest
public/manifest.json, icons
legacy/index.html, legacy/manifest.json   # versão antiga preservada
docs/superpowers/specs/…
```

## Store (`lib/store.ts`)

```ts
type State = {
  companies: Company[]
  entries: Entry[]
  addCompany(input: Omit<Company,'id'|'cor'>): Company
  updateCompany(id, patch: Partial<Company>): void
  removeCompany(id): void           // não apaga registros (igual ao atual)
  addEntry(input: Omit<Entry,'id'>): Entry
  updateEntry(id, patch): void
  removeEntry(id): void
  clearEntries(): void
  importData(data: {companies, entries}): void   // restauração JSON (substitui tudo)
}
```

Limite de 20 empresas e cor automática pela PALETTE mantidos. `getCompany(id)` cai para a primeira empresa se o id não existir (registros órfãos continuam aparecendo).

Hidratação: componentes que leem o store só renderizam dados após `useHydrated()` para evitar mismatch na exportação estática.

## Telas

1. **Registrar** — card de voz (botão mic, status, transcript, botão "Preencher com voz" → parser preenche o form) + form manual (data, empresa, entrada, saída, alimentação, uber, obs) → `addEntry` + toast + limpa form.
2. **Tabela** — filtros mês/empresa; tabela com dia, empresa (badge colorido), horário, h.extra, base, extra R$, total, gasto part.; ações **editar** (abre Sheet com `EntryForm` preenchido → `updateEntry`) e **excluir** (AlertDialog → `removeEntry`); rodapé com totais.
3. **Finanças** — tabs Mensal (cards + barras de % gasto/ganho + por empresa) e 12 Meses (3 gráficos de barras Recharts + tabela anual).
4. **Resumo** — cards do mês + por empresa.
5. **Config** — cards de empresa editáveis inline + "Salvar configurações"; dialog "Nova empresa"; remover empresa (AlertDialog); **Exportar relatório** (mês, checkbox "incluir gastos", botões PDF → abre `/relatorio?mes=&gastos=`, CSV → download); **Backup** (baixar JSON / importar JSON com confirmação); **Zona de perigo** (apagar todos os registros).

`/relatorio` — tabela do mês (dia, empresa, horário, h.extra, base, extra, total [com gastos se flag]) + totais por empresa e geral; `@media print` esconde botões; botão "Imprimir / salvar PDF" chama `window.print()`.

Visual: manter o tema escuro atual (bg `#0a0d14`, accent `#4f8ef7`) via tokens do shadcn; layout mobile-first com bottom-nav fixa e `safe-area-inset`.

## Tratamento de erros

- Form: validação zod (data obrigatória, números ≥ 0, horários `HH:MM`); erros inline.
- Importar JSON: valida com zod (`{companies: Company[], entries: Entry[]}`); inválido → toast de erro, nada alterado.
- Parser: nunca lança; se não reconhecer nada, a UI mostra "Não entendi — preencha manualmente".
- Web Speech API ausente → botão mic desabilitado com texto explicativo; a textarea do transcript fica editável para digitar.
- localStorage cheio/indisponível → toast de erro (Zustand persist `onError`).

## Testes

- `calc.test.ts`: horas extras (incl. virada de meia-noite, sem horário), totais, agregações mensais/anuais.
- `parse-transcript.test.ts`: tabela de frases → campos esperados.
- `store.test.ts`: CRUD de empresas e registros, limite 20, migração das chaves legadas, importData.
- `csv.test.ts`: cabeçalho e escape de aspas.
- Componentes críticos (EntryForm submit/edit) com Testing Library, se o tempo permitir; o resto validado manualmente no browser.

## Migração da pasta

`index.html` e `manifest.json` atuais → `legacy/`. Scaffold do Next.js na raiz da pasta `freela-tracker`. Git não é inicializado (não há repositório hoje; fica a critério do dono).
