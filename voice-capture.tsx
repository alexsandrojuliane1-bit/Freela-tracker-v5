"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mic, Sparkles, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { hasParsedFields, parseTranscript, type ParsedEntry } from "@/lib/parse-transcript";
import { formatDateBR } from "@/lib/dates";
import { cn } from "@/lib/utils";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  start(): void;
  stop(): void;
};

function getRecognitionCtor(): (new () => Recognition) | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const noopSubscribe = () => () => {};
const isSupported = () => Boolean(getRecognitionCtor());

const MIC_BLOCKED = "❌ Microfone bloqueado — clique no ícone à esquerda do endereço (cadeado/⚙), permita o microfone e recarregue.";
const MIC_STUCK =
  "⏳ O navegador não liberou o microfone. Clique no ícone à esquerda do endereço (cadeado/⚙) → Configurações do site → Microfone → Permitir, recarregue e tente de novo.";

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": MIC_BLOCKED,
  "service-not-allowed": MIC_BLOCKED,
  network: "❌ Sem conexão com o serviço de voz do navegador. Verifique a internet e tente de novo.",
  "no-speech": "Não ouvi nada. Toque e fale de novo.",
  "audio-capture": "❌ Nenhum microfone encontrado.",
  "language-not-supported": "❌ Português não suportado neste navegador.",
};

async function micDenied() {
  try {
    const p = await navigator.permissions.query({ name: "microphone" as PermissionName });
    return p.state === "denied";
  } catch {
    return false;
  }
}

export function VoiceCapture({ onParsed, waitTimeoutMs = 6000 }: { onParsed: (p: ParsedEntry) => void; waitTimeoutMs?: number }) {
  const companies = useStore((s) => s.companies);
  const getCompany = useStore((s) => s.getCompany);
  const supported = useSyncExternalStore(noopSubscribe, isSupported, () => false);
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("Toque para gravar");
  const recRef = useRef<Recognition | null>(null);
  const finalRef = useRef("");
  const errorRef = useRef<string | null>(null);

  useEffect(() => () => recRef.current?.stop(), []);

  async function toggle() {
    if (recording) {
      recRef.current?.stop();
      return;
    }
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    if (recRef.current) {
      recRef.current.onend = null;
      recRef.current.onerror = null;
      recRef.current.stop();
    }
    if (await micDenied()) {
      setStatus(MIC_BLOCKED);
      return;
    }
    const rec = new Ctor();
    rec.lang = "pt-BR";
    rec.continuous = true;
    rec.interimResults = true;
    finalRef.current = "";
    errorRef.current = null;
    const watchdog = setTimeout(() => {
      if (recRef.current === rec && !errorRef.current) setStatus(MIC_STUCK);
    }, waitTimeoutMs);
    rec.onstart = () => {
      clearTimeout(watchdog);
      setRecording(true);
      setStatus("Gravando...");
    };
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      setText((finalRef.current + interim).trim());
    };
    rec.onerror = (e) => {
      clearTimeout(watchdog);
      if (e.error === "aborted") return;
      errorRef.current = ERROR_MESSAGES[e.error ?? ""] ?? `❌ Erro ao gravar (${e.error ?? "desconhecido"}). Tente de novo.`;
      setStatus(errorRef.current);
    };
    rec.onend = () => {
      clearTimeout(watchdog);
      setRecording(false);
      recRef.current = null;
      if (errorRef.current) return;
      setStatus(finalRef.current ? "Áudio capturado!" : "Toque para gravar");
    };
    recRef.current = rec;
    setStatus("Aguardando permissão do microfone… Se o navegador não perguntou, clique no ícone de microfone/cadeado na barra de endereço e permita.");
    try {
      rec.start();
    } catch {
      clearTimeout(watchdog);
      setStatus("❌ Não foi possível iniciar a gravação. Tente de novo.");
      recRef.current = null;
    }
  }

  function handleParse() {
    const t = text.trim();
    if (!t) {
      setStatus("Grave ou digite algo primeiro");
      return;
    }
    const p = parseTranscript(t, companies);
    if (!hasParsedFields(p)) {
      setStatus("❌ Não entendi — preencha manualmente");
      return;
    }
    onParsed(p);
    const parts: string[] = [];
    if (p.data) parts.push(`📅 ${formatDateBR(p.data).slice(0, 5)}`);
    if (p.empresa) parts.push(`🏢 ${getCompany(p.empresa).nome}`);
    if (p.entrada) parts.push(`▶ ${p.entrada}`);
    if (p.saida) parts.push(`⏹ ${p.saida}`);
    if (p.alimentacao) parts.push(`🍽 R$${p.alimentacao}`);
    if (p.uber) parts.push(`🚗 R$${p.uber}`);
    setStatus(`✅ ${parts.join(" · ")}`);
  }

  return (
    <Card className="gap-3 py-4">
      <CardContent className="flex flex-col gap-3 px-4">
        <div className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">🎙 Falar ou digitar</div>
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-4">
          <button
            type="button"
            onClick={toggle}
            disabled={!supported}
            aria-label={recording ? "Parar gravação" : "Gravar"}
            className={cn(
              "flex size-16 items-center justify-center rounded-full border-2 transition-all disabled:opacity-40",
              recording ? "animate-pulse border-red-400 bg-red-400/15 text-red-400" : "border-primary bg-primary/15 text-primary active:scale-95",
            )}
          >
            {recording ? <Square className="size-6" /> : <Mic className="size-7" />}
          </button>
          <span className="text-center text-xs text-muted-foreground">
            {supported ? status : "Reconhecimento de voz indisponível neste navegador — digite abaixo"}
          </span>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Ex: "ontem na Empresa 2 das 8 às 22, gastei 30 de uber"'
            rows={2}
            className="bg-card text-[13px]"
          />
        </div>
        <Button type="button" variant="outline" className="w-full rounded-xl" onClick={handleParse}>
          <Sparkles data-icon="inline-start" /> Preencher com voz
        </Button>
      </CardContent>
    </Card>
  );
}
