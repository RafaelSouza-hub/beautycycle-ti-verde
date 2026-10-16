import { describe, expect, it } from "vitest";
import { mesParaData, parseDecimal, somarMeses, formatMes } from "@/lib/format";
import { traduzirErro } from "@/lib/errors";
import { agregar } from "@/lib/dashboard";

describe("regras BeautyCycle", () => {
  it("grava o mês sempre como dia 1", () => expect(mesParaData("2026-10")).toBe("2026-10-01"));
  it("aceita vírgula ou ponto", () => {
    expect(parseDecimal("1.234,56")).toBe(1234.56);
    expect(parseDecimal("12.5")).toBe(12.5);
  });
  it("soma meses sem fuso", () => expect(somarMeses("2026-01", -1)).toBe("2025-12"));
  it("mês em pt-BR", () => expect(formatMes("2026-10-01")).toBe("Outubro/2026"));
  it("traduz duplicidade", () => expect(traduzirErro({ code: "23505" })).toBe("Já existe uma auditoria ativa para este mês."));
  it("ignora auditorias inativas no dashboard", () => {
    const base = { salao_id: "s", observacoes: null, criado_em: "" };
    const r = agregar([
      { ...base, id: "1", mes_referencia: "2026-09-01", ativo: true, consumos: [{ id: "c", auditoria_id: "1", tipo: "agua", valor_reais: 100, quantidade: 1, unidade: "m3" }], desperdicios: [] },
      { ...base, id: "2", mes_referencia: "2026-10-01", ativo: false, consumos: [{ id: "d", auditoria_id: "2", tipo: "agua", valor_reais: 999, quantidade: 1, unidade: "m3" }], desperdicios: [] },
    ]);
    expect(r.gastoTotal).toBe(100);
  });
});
