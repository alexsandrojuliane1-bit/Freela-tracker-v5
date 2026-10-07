"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, LogOut, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CompanyBadge } from "@/components/layout/company-badge";
import { eventTimeLabel, groupEventsByDay, monthGrid, monthRange, shiftMonth, type CalEvent } from "@/lib/calendar-grid";
import { formatDateBR, monthKey, monthLabel, todayISO } from "@/lib/dates";
import { connectGoogle, disconnectGoogle, GOOGLE_CLIENT_ID, GoogleAuthError, listEvents, useGoogleAuth } from "@/lib/google-calendar";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { EventSheet, type EventSheetTarget } from "./event-sheet";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

export function CalendarView() {
  if (!GOOGLE_CLIENT_ID) return <SetupCard />;
  return <ConnectedCalendar />;
}

function ConnectedCalendar() {
  const token = useGoogleAuth((s) => s.token);
  const entries = useStore((s) => s.entries);
  const companies = useStore((s) => s.companies);
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [selected, setSelected] = useState(() => todayISO());
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<{ key: string; events: CalEvent[] } | null>(null);
  const [sheet, setSheet] = useState<EventSheetTarget | null>(null);
  const [connecting, setConnecting] = useState(false);

  const key = `${month}:${reload}`;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const { timeMin, timeMax } = monthRange(month);
    listEvents(timeMin, timeMax)
      .then((events) => !cancelled && setData({ key, events }))
      .catch((err) => {
        if (cancelled) return;
        toast.error(err instanceof GoogleAuthError ? err.message : err instanceof Error ? err.message : "Erro ao carregar agenda");
        setData({ key, events: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [token, month, key]);

  const loading = Boolean(token) && data?.key !== key;
  const byDay = useMemo(() => groupEventsByDay(data?.events ?? []), [data]);
  const workedByDay = useMemo(() => {
    const out: Record<string, typeof entries> = {};
    for (const e of entries) if (e.data.startsWith(month)) (out[e.data] ??= []).push(e);
    return out;
  }, [entries, month]);
  const cells = useMemo(() => monthGrid(month), [month]);
  const today = todayISO();

  async function connect() {
    setConnecting(true);
    try {
      await connectGoogle();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível conectar");
    } finally {
      setConnecting(false);
    }
  }

  if (!token) {
    return (
      <Card className="py-6">
        <CardContent className="flex flex-col items-center gap-3 px-4 text-center">
          <CalendarDays className="size-8 text-primary" />
          <div className="text-[15px] font-bold">Google Agenda</div>
          <p className="text-[13px] text-muted-foreground">Conecte sua conta para ver, criar, editar e excluir eventos sem sair do app.</p>
          <Button size="lg" className="w-full rounded-xl font-bold" onClick={connect} disabled={connecting}>
            {connecting ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
            Conectar Google Agenda
          </Button>
        </CardContent>
      </Card>
    );
  }

  const dayEvents = byDay[selected] ?? [];
  const dayWorked = workedByDay[selected] ?? [];

  return (
    <>
      <Card className="py-3">
        <CardContent className="flex flex-col gap-2 px-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" aria-label="Mês anterior" onClick={() => setMonth(shiftMonth(month, -1))}>
              <ChevronLeft />
            </Button>
            <button type="button" className="text-sm font-bold" onClick={() => { setMonth(monthKey(new Date())); setSelected(today); }}>
              {monthLabel(month)}
            </button>
            <Button variant="ghost" size="icon" aria-label="Próximo mês" onClick={() => setMonth(shiftMonth(month, 1))}>
              <ChevronRight />
            </Button>
          </div>
          <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-muted-foreground">
            {WEEKDAYS.map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((iso, i) => {
              if (!iso) return <div key={i} />;
              const evs = byDay[iso]?.length ?? 0;
              const worked = (workedByDay[iso]?.length ?? 0) > 0;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelected(iso)}
                  aria-label={formatDateBR(iso)}
                  aria-pressed={iso === selected}
                  className={cn(
                    "flex h-11 flex-col items-center justify-center gap-0.5 rounded-lg border text-[13px] transition-colors",
                    iso === selected ? "border-primary bg-primary/15" : "border-transparent hover:bg-accent",
                    iso === today && "font-extrabold text-primary",
                    worked && "bg-emerald-500/15",
                  )}
                >
                  {Number(iso.slice(8))}
                  <span className="flex h-1.5 gap-0.5">
                    {Array.from({ length: Math.min(evs, 3) }).map((_, k) => (
                      <span key={k} className="size-1.5 rounded-full bg-primary" />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-primary" /> evento</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded bg-emerald-500/40" /> dia trabalhado</span>
            {loading && <Loader2 className="ml-auto size-3.5 animate-spin" />}
          </div>
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardContent className="flex flex-col gap-3 px-4">
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-bold">{formatDateBR(selected)}</div>
            <Button size="sm" className="rounded-lg" onClick={() => setSheet({ date: selected })}>
              <Plus data-icon="inline-start" /> Evento
            </Button>
          </div>
          {dayWorked.map((e) => {
            const co = companies.find((c) => c.id === e.empresa) ?? companies[0];
            return (
              <div key={e.id} className="flex items-center gap-2 text-[13px]">
                <CompanyBadge company={co} />
                <span className="text-muted-foreground">dia trabalhado{e.entrada && e.saida ? ` · ${e.entrada}–${e.saida}` : ""}</span>
              </div>
            );
          })}
          {dayEvents.length === 0 && dayWorked.length === 0 && <p className="text-[13px] text-muted-foreground">Nada neste dia.</p>}
          {dayEvents.map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => setSheet({ event: ev })}
              className="flex flex-col items-start gap-0.5 rounded-xl border border-border bg-background px-3 py-2 text-left hover:bg-accent"
            >
              <span className="text-[11px] font-semibold text-primary">{eventTimeLabel(ev)}</span>
              <span className="text-[14px] font-semibold">{ev.title}</span>
              {ev.location && <span className="text-[12px] text-muted-foreground">{ev.location}</span>}
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setReload((n) => n + 1)}>
          <RefreshCw data-icon="inline-start" /> Atualizar
        </Button>
        <Button variant="outline" className="flex-1 rounded-xl" onClick={disconnectGoogle}>
          <LogOut data-icon="inline-start" /> Desconectar
        </Button>
      </div>

      {sheet && (
        <EventSheet
          key={"event" in sheet ? sheet.event.id : `new-${sheet.date}`}
          target={sheet}
          onClose={() => setSheet(null)}
          onChanged={() => setReload((n) => n + 1)}
        />
      )}
    </>
  );
}

function SetupCard() {
  return (
    <Card className="py-4">
      <CardContent className="flex flex-col gap-2 px-4 text-[13px]">
        <div className="text-[15px] font-bold">Configurar Google Agenda</div>
        <p className="text-muted-foreground">Falta o ID de cliente OAuth do Google. Passo a passo no README (seção “Google Agenda”).</p>
        <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>Crie um <b>ID do cliente OAuth (Aplicativo da Web)</b> no Google Cloud e ative a <b>Google Calendar API</b>.</li>
          <li>Adicione a URL do app em <b>Origens JavaScript autorizadas</b>.</li>
          <li>Crie <code>.env.local</code> com <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID=seu-id</code> e rode o app de novo.</li>
        </ol>
      </CardContent>
    </Card>
  );
}
