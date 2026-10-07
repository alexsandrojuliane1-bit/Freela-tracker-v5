import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { EntryForm, toEntry, fromEntry } from "./entry-form";
import { DEFAULT_COMPANIES } from "@/lib/types";

describe("EntryForm", () => {
  it("exige data e envia números", async () => {
    const onSubmit = vi.fn();
    render(
      <EntryForm
        companies={DEFAULT_COMPANIES}
        defaultValues={{ data: "", empresa: "c1", entrada: "", saida: "", alimentacao: "", uber: "", obs: "" }}
        onSubmit={onSubmit}
        submitLabel="Salvar"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText("Informe a data")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Data"), { target: { value: "2026-08-20" } });
    await userEvent.type(screen.getByLabelText("Uber/Transp. (R$)"), "12.5");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ data: "2026-08-20", empresa: "c1", uber: 12.5, alimentacao: 0 }));
  });
});

describe("toEntry / fromEntry", () => {
  it("round-trip", () => {
    const e = { id: "1", data: "2026-08-01", empresa: "c2", entrada: "08:00", saida: undefined, alimentacao: 0, uber: 12.5, obs: "x" };
    expect(toEntry(fromEntry(e))).toEqual({ data: "2026-08-01", empresa: "c2", entrada: "08:00", saida: undefined, alimentacao: 0, uber: 12.5, obs: "x" });
  });
});
