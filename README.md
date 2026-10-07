# Freela Tracker

Controle de dias trabalhados, horas extras e gastos de freelancer. PWA **100% client-side**: todos os dados ficam no `localStorage` do navegador — sem backend, sem login.

Reescrita em Next.js do `legacy/index.html` (PWA vanilla JS de arquivo único).

## Stack

Next.js 16 (App Router, `output: 'export'`) · TypeScript · Tailwind v4 · shadcn/ui (Base UI, `base-nova`) · Zustand `persist` · react-hook-form + zod · Recharts · Lucide · Sonner · Vitest + Testing Library.

## Scripts

```bash
npm run dev      # http://localhost:3000
npm test         # Vitest (lib + componentes)
npm run lint
npm run build    # export estático em out/
```

Para publicar, basta servir a pasta `out/` em qualquer host estático (Vercel, Netlify, S3, GitHub Pages…).

## Funcionalidades

- **Registrar** — form manual (data, empresa, entrada/saída, alimentação, uber, obs) ou **voz**: a Web Speech API transcreve e `lib/parse-transcript.ts` extrai os campos offline (sem LLM, sem chave).
- **Tabela** — filtro por mês/empresa, **editar** (Sheet) e **excluir** (confirmação), totais.
- **Finanças** — mensal (cards, % gastos sobre ganhos, por empresa) e 12 meses (3 gráficos + tabela).
- **Resumo** — totais do mês e por empresa.
- **Agenda** — Google Agenda dentro do app: calendário mensal com seus eventos e os dias trabalhados; criar, editar e excluir eventos (veja “Google Agenda” abaixo).
- **Config** — empresas (criar/editar/remover, até 20), exportar **CSV** e **PDF** (`/relatorio` + imprimir) escolhendo **quais dias** entram no relatório, **backup/restauração JSON**, apagar registros.

## Dados

- Chave `freela-tracker` no `localStorage` (`{ companies, entries }`, Zustand persist v1).
- **Migração automática**: se a versão antiga rodou na mesma origem, as chaves `freela_entries` / `freela_companies` são importadas na primeira abertura (e mantidas intactas).
- Origem diferente (ex.: app antigo em `file://`)? Cole no console do app antigo:
  `copy(JSON.stringify({companies: JSON.parse(localStorage.freela_companies||'[]'), entries: JSON.parse(localStorage.freela_entries||'[]')}))`
  salve como `.json` e use **Config → Restaurar backup** (ids numéricos precisam virar string — ou adicione os registros pelo app).

## Estrutura

```
app/            layout, page (5 abas), relatorio/
components/     layout/ entries/ companies/ finance/ summary/ config/ report/ ui/(shadcn)
lib/            types, calc, dates, parse-transcript, store, csv, backup, finance (+ *.test.ts)
hooks/          use-hydrated
legacy/         versão anterior (index.html + manifest.json)
docs/superpowers/  spec e plano de implementação
```

Regras de cálculo (`lib/calc.ts`): `total a cobrar = diária + horas extras × valor`; alimentação (fixa da empresa + extra do dia) e transporte são **gastos particulares** e não entram no total.

## Google Agenda

Sem backend: o login usa o Google Identity Services direto no navegador (escopo `calendar.events`, agenda principal). O token fica só em memória — ao recarregar a página, toque em **Conectar** de novo.

1. No [Google Cloud Console](https://console.cloud.google.com/), crie um projeto e ative a **Google Calendar API**.
2. Em *Tela de consentimento OAuth*, configure o app (tipo Externo) e adicione seu e-mail como **usuário de teste**.
3. Em *Credenciais* → *Criar credenciais* → **ID do cliente OAuth** → *Aplicativo da Web*. Em **Origens JavaScript autorizadas** coloque `http://localhost:3000` e a URL em que o app for publicado.
4. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. No host de produção (Vercel etc.), defina a mesma variável **antes do build**.

O ID de cliente não é segredo (fica visível no JavaScript); o que protege sua agenda é o login com a sua conta.
