import { create } from "zustand";
import { addDays, type CalEvent } from "./calendar-grid";

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

const SCOPE = "https://www.googleapis.com/auth/calendar.events";
const GIS_SRC = "https://accounts.google.com/gsi/client";
const API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

type TokenResponse = { access_token?: string; expires_in?: number; error?: string };
type TokenClient = { requestAccessToken(overrides?: { prompt?: string }): void };
type GoogleAccounts = {
  oauth2: {
    initTokenClient(cfg: {
      client_id: string;
      scope: string;
      callback: (r: TokenResponse) => void;
      error_callback?: (e: { type: string }) => void;
    }): TokenClient;
    revoke(token: string, done?: () => void): void;
  };
};
declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
  }
}

export class GoogleAuthError extends Error {}

type AuthState = { token: string | null; expiresAt: number };
/** O token fica só em memória (some ao recarregar a página). */
export const useGoogleAuth = create<AuthState>(() => ({ token: null, expiresAt: 0 }));

export const isConnected = () => {
  const { token, expiresAt } = useGoogleAuth.getState();
  return Boolean(token) && Date.now() < expiresAt;
};

function loadGis(): Promise<GoogleAccounts> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts) return resolve(window.google.accounts);
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    const s = existing ?? Object.assign(document.createElement("script"), { src: GIS_SRC, async: true });
    s.addEventListener("load", () => (window.google?.accounts ? resolve(window.google.accounts) : reject(new Error("Google indisponível"))));
    s.addEventListener("error", () => reject(new Error("Não foi possível carregar o login do Google")));
    if (!existing) document.head.appendChild(s);
  });
}

/** Abre o popup de login/consentimento do Google. Chamar a partir de um clique. */
export async function connectGoogle(): Promise<void> {
  if (!GOOGLE_CLIENT_ID) throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID não configurado");
  const accounts = await loadGis();
  await new Promise<void>((resolve, reject) => {
    const client = accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPE,
      callback: (r) => {
        if (r.error || !r.access_token) return reject(new Error(r.error ?? "Login cancelado"));
        useGoogleAuth.setState({ token: r.access_token, expiresAt: Date.now() + ((r.expires_in ?? 3600) - 60) * 1000 });
        resolve();
      },
      error_callback: (e) => reject(new Error(e.type === "popup_closed" ? "Login cancelado" : "Falha no login do Google")),
    });
    client.requestAccessToken();
  });
}

export function disconnectGoogle() {
  const { token } = useGoogleAuth.getState();
  useGoogleAuth.setState({ token: null, expiresAt: 0 });
  if (token) window.google?.accounts.oauth2.revoke(token);
}

async function gfetch(url: string, init?: RequestInit): Promise<Response> {
  if (!isConnected()) {
    useGoogleAuth.setState({ token: null, expiresAt: 0 });
    throw new GoogleAuthError("Sessão do Google expirou. Conecte de novo.");
  }
  const res = await fetch(url, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${useGoogleAuth.getState().token}`, "Content-Type": "application/json" },
  });
  if (res.status === 401) {
    useGoogleAuth.setState({ token: null, expiresAt: 0 });
    throw new GoogleAuthError("Sessão do Google expirou. Conecte de novo.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Erro do Google Agenda (${res.status})`);
  }
  return res;
}

// ---------- mapeamento API <-> app ----------

type ApiEvent = {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
};

export function fromApi(e: ApiEvent): CalEvent {
  const allDay = Boolean(e.start.date);
  return {
    id: e.id,
    title: e.summary || "(sem título)",
    start: (allDay ? e.start.date : e.start.dateTime) ?? "",
    end: (allDay ? e.end.date : e.end.dateTime) ?? "",
    allDay,
    description: e.description,
    location: e.location,
    htmlLink: e.htmlLink,
  };
}

export type EventInput = {
  title: string;
  allDay: boolean;
  /** YYYY-MM-DD */
  date: string;
  /** YYYY-MM-DD (último dia, inclusive) */
  endDate: string;
  /** HH:MM (ignorado se allDay) */
  startTime: string;
  endTime: string;
  description: string;
  location: string;
};

type ApiBody = {
  summary: string;
  description: string;
  location: string;
  start: { date?: string; dateTime?: string; timeZone?: string };
  end: { date?: string; dateTime?: string; timeZone?: string };
};

export function toApi(i: EventInput): ApiBody {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const base = { summary: i.title.trim(), description: i.description.trim(), location: i.location.trim() };
  if (i.allDay) return { ...base, start: { date: i.date }, end: { date: addDays(i.endDate, 1) } };
  return {
    ...base,
    start: { dateTime: `${i.date}T${i.startTime}:00`, timeZone: tz },
    end: { dateTime: `${i.endDate}T${i.endTime}:00`, timeZone: tz },
  };
}

// ---------- operações ----------

export async function listEvents(timeMin: string, timeMax: string): Promise<CalEvent[]> {
  const params = new URLSearchParams({ timeMin, timeMax, singleEvents: "true", orderBy: "startTime", maxResults: "250" });
  const res = await gfetch(`${API}?${params}`);
  const data = (await res.json()) as { items?: ApiEvent[] };
  return (data.items ?? []).map(fromApi);
}

export async function createEvent(input: EventInput): Promise<CalEvent> {
  const res = await gfetch(API, { method: "POST", body: JSON.stringify(toApi(input)) });
  return fromApi(await res.json());
}

export async function updateEvent(id: string, input: EventInput): Promise<CalEvent> {
  const res = await gfetch(`${API}/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(toApi(input)) });
  return fromApi(await res.json());
}

export async function deleteEvent(id: string): Promise<void> {
  await gfetch(`${API}/${encodeURIComponent(id)}`, { method: "DELETE" });
}
