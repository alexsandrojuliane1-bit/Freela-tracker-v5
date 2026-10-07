import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { VoiceCapture } from "./voice-capture";

type Handler = ((e: unknown) => void) | null;

class FakeRecognition {
  static instances: FakeRecognition[] = [];
  lang = "";
  continuous = false;
  interimResults = false;
  onstart: Handler = null;
  onend: Handler = null;
  onerror: Handler = null;
  onresult: Handler = null;
  start = vi.fn();
  stop = vi.fn();
  constructor() {
    FakeRecognition.instances.push(this);
  }
}

const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };

beforeEach(() => {
  FakeRecognition.instances = [];
  w.SpeechRecognition = FakeRecognition;
});
afterEach(() => {
  delete w.SpeechRecognition;
  delete w.webkitSpeechRecognition;
});

describe("VoiceCapture", () => {
  it("mostra que está aguardando permissão ao clicar", async () => {
    render(<VoiceCapture onParsed={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "Gravar" }));
    expect(await screen.findByText(/aguardando permiss/i)).toBeInTheDocument();
    expect(FakeRecognition.instances[0].start).toHaveBeenCalled();
  });

  it("erro not-allowed seguido de end mantém a mensagem de microfone bloqueado", async () => {
    render(<VoiceCapture onParsed={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "Gravar" }));
    await screen.findByText(/aguardando permiss/i);
    const rec = FakeRecognition.instances[0];
    act(() => {
      rec.onerror?.({ error: "not-allowed" });
      rec.onend?.({});
    });
    expect(screen.getByText(/microfone bloqueado/i)).toBeInTheDocument();
    expect(screen.queryByText("Toque para gravar")).not.toBeInTheDocument();
  });

  it("erro network mostra mensagem específica", async () => {
    render(<VoiceCapture onParsed={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "Gravar" }));
    await screen.findByText(/aguardando permiss/i);
    const rec = FakeRecognition.instances[0];
    act(() => {
      rec.onerror?.({ error: "network" });
      rec.onend?.({});
    });
    expect(screen.getByText(/serviço de voz/i)).toBeInTheDocument();
  });

  it("sem resposta do navegador em 6s mostra como liberar o microfone", async () => {
    render(<VoiceCapture onParsed={() => {}} waitTimeoutMs={50} />);
    await userEvent.click(screen.getByRole("button", { name: "Gravar" }));
    await screen.findByText(/aguardando permiss/i);
    expect(await screen.findByText(/não liberou o microfone/i)).toBeInTheDocument();
  });

  it("fluxo feliz: start → result → end mostra o texto e 'Áudio capturado!'", async () => {
    render(<VoiceCapture onParsed={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "Gravar" }));
    await screen.findByText(/aguardando permiss/i);
    const rec = FakeRecognition.instances[0];
    act(() => rec.onstart?.({}));
    expect(screen.getByText("Gravando...")).toBeInTheDocument();
    act(() => {
      const result = Object.assign([{ transcript: "ontem das 8 as 20" }], { isFinal: true });
      rec.onresult?.({ resultIndex: 0, results: [result] });
      rec.onend?.({});
    });
    expect(screen.getByDisplayValue("ontem das 8 as 20")).toBeInTheDocument();
    expect(screen.getByText("Áudio capturado!")).toBeInTheDocument();
  });
});
