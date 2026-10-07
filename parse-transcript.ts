import { todayISO } from "./dates";
import type { Company } from "./types";

export type ParsedEntry = {
  data?: string;
  empresa?: string;
  entrada?: string;
  saida?: string;
  alimentacao?: number;
  uber?: number;
};

const squash = (s: string) => s.replace(/\s+/g, " ").trim();

export function normalizeText(s: string) {
  return squash(
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/r\$\s*/g, "")
      .replace(/[,;.!?](?=\s|$)/g, " "),
  );
}

const UNITS: Record<string, number> = {
  zero: 0, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9,
  dez: 10, onze: 11, doze: 12, treze: 13, quatorze: 14, catorze: 14, quinze: 15, dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19,
};
const TENS: Record<string, number> = { vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80, noventa: 90 };
const HUNDREDS: Record<string, number> = {
  cem: 100, cento: 100, duzentos: 200, trezentos: 300, quatrocentos: 400, quinhentos: 500,
  seiscentos: 600, setecentos: 700, oitocentos: 800, novecentos: 900,
};
const isNumWord = (t: string | undefined) => !!t && (t in UNITS || t in TENS || t in HUNDREDS || t === "mil");

function readNumber(tokens: string[], i: number): { value: number; next: number } | null {
  let j = i;
  let value = 0;
  let consumed = false;
  if (tokens[j] in UNITS && tokens[j + 1] === "mil") {
    value = UNITS[tokens[j]] * 1000;
    j += 2;
    consumed = true;
  } else if (tokens[j] === "mil") {
    value = 1000;
    j += 1;
    consumed = true;
  }
  if (consumed && tokens[j] === "e" && isNumWord(tokens[j + 1])) j++;
  if (tokens[j] in HUNDREDS) {
    value += HUNDREDS[tokens[j]];
    j++;
    consumed = true;
    if (tokens[j] === "e" && (tokens[j + 1] in TENS || tokens[j + 1] in UNITS)) j++;
    else return { value, next: j };
  }
  if (tokens[j] in TENS) {
    value += TENS[tokens[j]];
    j++;
    if (tokens[j] === "e" && tokens[j + 1] in UNITS && UNITS[tokens[j + 1]] < 10) {
      value += UNITS[tokens[j + 1]];
      j += 2;
    }
    return { value, next: j };
  }
  if (tokens[j] in UNITS) {
    value += UNITS[tokens[j]];
    return { value, next: j + 1 };
  }
  return consumed ? { value, next: j } : null;
}

export function wordsToDigits(s: string) {
  const tokens = s.split(" ");
  const out: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const r = readNumber(tokens, i);
    if (!r) {
      out.push(tokens[i]);
      i++;
      continue;
    }
    out.push(String(r.value));
    i = r.next;
  }
  return out.join(" ");
}

const MONTHS = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

function parseDate(text: string, today: Date): { data: string; rest: string } {
  let rest = text;
  const y = today.getFullYear();
  const m = today.getMonth() + 1;
  const d = today.getDate();
  const shift = (n: number) => {
    const dt = new Date(y, m - 1, d + n);
    return iso(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
  };
  let data = iso(y, m, d);
  if (/\banteontem\b/.test(rest)) data = shift(-2);
  else if (/\bontem\b/.test(rest)) data = shift(-1);
  else if (/\bamanha\b/.test(rest)) data = shift(1);

  const slash = rest.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (slash) {
    const yy = slash[3] ? (slash[3].length === 2 ? 2000 + Number(slash[3]) : Number(slash[3])) : y;
    data = iso(yy, Number(slash[2]), Number(slash[1]));
    rest = squash(rest.replace(slash[0], " "));
  }
  const dia = rest.match(/\bdia (\d{1,2})(?: de ([a-z]+))?/);
  if (dia) {
    const mi = dia[2] ? MONTHS.indexOf(dia[2]) : -1;
    data = iso(y, mi >= 0 ? mi + 1 : m, Number(dia[1]));
    rest = squash(rest.replace(mi >= 0 || !dia[2] ? dia[0] : `dia ${dia[1]}`, " "));
  }
  return { data, rest };
}

const UBER_KW = "uber|transporte|onibus|metro|taxi|99|corrida|passagem|gasolina|combustivel|estacionamento|pedagio";
const ALIM_KW = "alimentacao|comida|almoco|janta|jantar|lanche|refeicao|cafe|marmita";
const NUM = "(\\d+(?:[.,]\\d{1,2})?)";
const MONEY_SUFFIX = "(?:\\s*(?:reais|real|conto|contos|pila|pilas))?";

function parseMoney(text: string, kw: string): { value: number | undefined; rest: string } {
  let rest = text;
  let sum = 0;
  let found = false;
  const before = new RegExp(`\\b${NUM}${MONEY_SUFFIX}\\s+(?:de|no|na|com|em|do|da|pro|pra|para o|para a)\\s+(?:${kw})\\b`, "g");
  const after = new RegExp(`\\b(?:${kw})\\b(?:\\s+(?:foi|deu|custou|ficou|de|em))?\\s+${NUM}${MONEY_SUFFIX}`, "g");
  for (const re of [before, after]) {
    rest = rest.replace(re, (_all, n: string) => {
      sum += Number(n.replace(",", "."));
      found = true;
      return " ";
    });
  }
  return { value: found ? Math.round(sum * 100) / 100 : undefined, rest: squash(rest) };
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function parseCompany(text: string, companies: Pick<Company, "id" | "nome">[]): { empresa?: string; rest: string } {
  const norm = companies.map((c) => ({ id: c.id, nome: wordsToDigits(normalizeText(c.nome)) })).filter((c) => c.nome);
  for (const c of norm) {
    const re = new RegExp(`\\b${escapeRe(c.nome)}\\b`);
    if (re.test(text)) return { empresa: c.id, rest: squash(text.replace(re, " ")) };
  }
  let best: { id: string; hits: string[] } | undefined;
  for (const c of norm) {
    const tokens = c.nome.split(" ").filter((t) => t.length >= 3 && t !== "empresa");
    const hits = tokens.filter((t) => new RegExp(`\\b${escapeRe(t)}\\b`).test(text));
    if (hits.length && (!best || hits.length > best.hits.length)) best = { id: c.id, hits };
  }
  if (!best) return { rest: text };
  let rest = text;
  for (const t of best.hits) rest = rest.replace(new RegExp(`\\b${escapeRe(t)}\\b`), " ");
  return { empresa: best.id, rest: squash(rest) };
}

const TIME_RE =
  /\b(\d{1,2})(?::|h)(\d{2})\b|\b(\d{1,2}) e meia\b|\b(\d{1,2}) e (\d{1,2})\b(?! (?:reais|real|de|da|do|das|dos|no|na|horas de))|\b(\d{1,2})(?: ?(?:horas?|hrs?|h))?\b/g;
const PERIOD_RE = /^\s*(?:da|de|pela)\s+(manha|madrugada|tarde|noite)\b/;
const DURATION_BEFORE = /(?:trabalhei|fiquei|por|durante|foram|total de)\s*$/;

function parseTimes(text: string): string[] {
  const times: string[] = [];
  for (const m of text.matchAll(TIME_RE)) {
    let h: number;
    let min = 0;
    if (m[1] !== undefined) {
      h = +m[1];
      min = +m[2];
    } else if (m[3] !== undefined) {
      h = +m[3];
      min = 30;
    } else if (m[4] !== undefined) {
      h = +m[4];
      min = +m[5];
    } else {
      h = +m[6];
      if (DURATION_BEFORE.test(text.slice(0, m.index))) continue;
    }
    if (h > 24 || min > 59) continue;
    const tail = text.slice((m.index ?? 0) + m[0].length).match(PERIOD_RE);
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
    const comp = parseCompany(text, companies);
    text = comp.rest;
    const date = parseDate(text, today);
    text = date.rest;
    const uber = parseMoney(text, UBER_KW);
    text = uber.rest;
    const alim = parseMoney(text, ALIM_KW);
    text = alim.rest;
    const times = parseTimes(text);

    const out: ParsedEntry = { data: date.data };
    if (comp.empresa) out.empresa = comp.empresa;
    if (times.length >= 2) {
      out.entrada = times[0];
      out.saida = times[1];
    } else if (times.length === 1) {
      if (/\b(sai|saida|saindo|terminei|ate|encerrei|acabei)\b/.test(text)) out.saida = times[0];
      else out.entrada = times[0];
    }
    if (uber.value !== undefined) out.uber = uber.value;
    if (alim.value !== undefined) out.alimentacao = alim.value;
    return out;
  } catch {
    return { data: todayISO(today) };
  }
}

export function hasParsedFields(p: ParsedEntry) {
  return Boolean(p.empresa || p.entrada || p.saida || p.uber !== undefined || p.alimentacao !== undefined);
}
