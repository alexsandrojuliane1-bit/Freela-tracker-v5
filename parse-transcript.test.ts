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
    ["vinte e cinco de almoco", "25 de almoco"],
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
    expect(r.entrada).toBe("08:00");
    expect(r.saida).toBe("20:00");
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
    expect(r.entrada).toBeUndefined();
    expect(r.saida).toBe("22:00");
  });
  it("sem horário", () => {
    const r = p("trabalhei hoje na empresa 1");
    expect(r.entrada).toBeUndefined();
    expect(r.saida).toBeUndefined();
  });
});

describe("empresa", () => {
  it("por nome exato", () => expect(p("hoje na empresa 2 das 8 as 20").empresa).toBe("c2"));
  it("por token", () => expect(p("trabalhei pra credentech das 8 as 20").empresa).toBe("c3"));
  it("sem menção → undefined", () => expect(p("das 8 as 20").empresa).toBeUndefined());
  it("número da empresa não vira horário", () => {
    const r = p("empresa 2 das 8 as 20");
    expect(r.entrada).toBe("08:00");
    expect(r.saida).toBe("20:00");
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
    expect(r.entrada).toBe("08:00");
    expect(r.saida).toBe("20:00");
    expect(r.uber).toBe(30);
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
