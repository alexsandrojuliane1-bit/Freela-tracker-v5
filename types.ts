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

export const PALETTE = [
  "#4f8ef7", "#a78bfa", "#34d399", "#fbbf24", "#fb923c", "#f87171", "#38bdf8", "#e879f9", "#4ade80", "#facc15",
  "#60a5fa", "#c084fc", "#2dd4bf", "#f472b6", "#818cf8", "#fb7185", "#a3e635", "#fdba74", "#67e8f9", "#d946ef",
];

export const DEFAULT_COMPANIES: Company[] = [
  { id: "c1", nome: "Empresa 1", diaria: 550, extra: 45.83, horas: 12, almoco: 0, janta: 0, cor: "#4f8ef7" },
  { id: "c2", nome: "Empresa 2", diaria: 500, extra: 41.67, horas: 12, almoco: 50, janta: 50, cor: "#a78bfa" },
];
