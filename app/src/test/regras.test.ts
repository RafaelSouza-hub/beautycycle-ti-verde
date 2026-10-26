import { describe, expect, it } from "vitest";
import { mesParaData, parseDecimal, somarMeses, formatMes, formatPct, periodoAtalho } from "@/lib/format";
import { traduzirErro } from "@/lib/errors";
import { agregar } from "@/lib/dashboard";
import { nomeDoArquivo } from "@/lib/relatorioPdf";
import type { AuditoriaCompleta } from "@/lib/types";

describe("regras BeautyCycle", () => {
  it("grava o mês sempre como dia 1", () => expect(mesParaData("2026-10")).toBe("2026-10-01"));
  it("aceita vírgula ou ponto", () => {
    expect(parseDecimal("1.234,56")).toBe(1234.56);
    expect(parseDecimal("12.5")).toBe(12.5);
  });
  it("soma meses sem fuso", () => expect(somarMeses("2026-01", -1)).toBe("2025-12"));
  it("atalhos de período", () => {
    expect(periodoAtalho("2026-10", 3)).toEqual({ inicio: "2026-08", fim: "2026-10" });
    expect(periodoAtalho("2026-10", 12)).toEqual({ inicio: "2025-11", fim: "2026-10" });
  });
  it("mês em pt-BR", () => expect(formatMes("2026-10-01")).toBe("Outubro/2026"));
  it("traduz duplicidade", () => expect(traduzirErro({ code: "23505" })).toBe("Já existe uma auditoria ativa para este mês."));
  it("ignora auditorias inativas no dashboard", () => {
    const base = { salao_id: "s", observacoes: null, criado_em: "" };
    const r = agregar([
      { ...base, id: "1", mes_referencia: "2026-09-01", ativo: true, consumos: [{ id: "c", auditoria_id: "1", tipo: "agua", valor_reais: 100, quantidade: 1, unidade: "m3", produto: null }], desperdicios: [] },
      { ...base, id: "2", mes_referencia: "2026-10-01", ativo: false, consumos: [{ id: "d", auditoria_id: "2", tipo: "agua", valor_reais: 999, quantidade: 1, unidade: "m3", produto: null }], desperdicios: [] },
    ]);
    expect(r.gastoTotal).toBe(100);
  });
  it("soma várias entradas de produtos na mesma auditoria", () => {
    const base = { salao_id: "s", observacoes: null, criado_em: "" };
    const r = agregar([
      {
        ...base, id: "1", mes_referencia: "2026-10-01", ativo: true,
        consumos: [
          { id: "c1", auditoria_id: "1", tipo: "produtos", valor_reais: 50, quantidade: 2, unidade: "unidades", produto: "Shampoo" },
          { id: "c2", auditoria_id: "1", tipo: "produtos", valor_reais: 30, quantidade: 1, unidade: "unidades", produto: null },
        ],
        desperdicios: [],
      },
    ]);
    expect(r.gastoTotal).toBe(80);
    expect(r.meses[0]?.produtos).toBe(80);
  });
  it("inclui auditorias inativas quando o PDF pede", () => {
    const base = { salao_id: "s", observacoes: null, criado_em: "" };
    const lista: AuditoriaCompleta[] = [
      { ...base, id: "1", mes_referencia: "2026-09-01", ativo: true, consumos: [{ id: "c", auditoria_id: "1", tipo: "agua", valor_reais: 100, quantidade: 1, unidade: "m3", produto: null }], desperdicios: [] },
      { ...base, id: "2", mes_referencia: "2026-10-01", ativo: false, consumos: [{ id: "d", auditoria_id: "2", tipo: "agua", valor_reais: 999, quantidade: 1, unidade: "m3", produto: null }], desperdicios: [] },
    ];
    expect(agregar(lista).gastoTotal).toBe(100);
    expect(agregar(lista, { incluirInativas: true }).gastoTotal).toBe(1099);
  });
  it("RN05: percentual de desperdício sobre gasto com produtos", () => {
    const base = { salao_id: "s", observacoes: null, criado_em: "" };
    const r = agregar([
      {
        ...base, id: "1", mes_referencia: "2026-10-01", ativo: true,
        consumos: [{ id: "c", auditoria_id: "1", tipo: "produtos", valor_reais: 200, quantidade: 4, unidade: "unidades", produto: "Shampoo" }],
        desperdicios: [{ id: "d", auditoria_id: "1", produto: "Shampoo", quantidade: 1, unidade: "unidades", valor_estimado: 25, motivo: "validade" }],
      },
    ]);
    expect(r.pctDesperdicioProdutos).toBe(12.5);
    expect(r.meses[0]?.pctProdutos).toBe(12.5);
    expect(formatPct(r.pctDesperdicioProdutos)).toBe("12,5%");
  });
  it("RN05: mostra travessão quando o gasto com produtos é zero", () => {
    const base = { salao_id: "s", observacoes: null, criado_em: "" };
    const r = agregar([
      {
        ...base, id: "1", mes_referencia: "2026-10-01", ativo: true,
        consumos: [{ id: "c", auditoria_id: "1", tipo: "agua", valor_reais: 100, quantidade: 1, unidade: "m3", produto: null }],
        desperdicios: [{ id: "d", auditoria_id: "1", produto: "Shampoo", quantidade: 1, unidade: "unidades", valor_estimado: 25, motivo: "validade" }],
      },
    ]);
    expect(r.pctDesperdicioProdutos).toBeNull();
    expect(r.meses[0]?.pctProdutos).toBeNull();
    expect(formatPct(r.pctDesperdicioProdutos)).toBe("—");
  });
  it("RN05: ignora auditorias inativas no percentual", () => {
    const base = { salao_id: "s", observacoes: null, criado_em: "" };
    const r = agregar([
      {
        ...base, id: "1", mes_referencia: "2026-10-01", ativo: true,
        consumos: [{ id: "c", auditoria_id: "1", tipo: "produtos", valor_reais: 200, quantidade: 4, unidade: "unidades", produto: null }],
        desperdicios: [{ id: "d", auditoria_id: "1", produto: "Shampoo", quantidade: 1, unidade: "unidades", valor_estimado: 20, motivo: "sobra" }],
      },
      {
        ...base, id: "2", mes_referencia: "2026-10-01", ativo: false,
        consumos: [{ id: "e", auditoria_id: "2", tipo: "produtos", valor_reais: 800, quantidade: 9, unidade: "unidades", produto: null }],
        desperdicios: [{ id: "f", auditoria_id: "2", produto: "Tinta", quantidade: 1, unidade: "unidades", valor_estimado: 80, motivo: "sobra" }],
      },
    ]);
    expect(r.pctDesperdicioProdutos).toBe(10);
  });
  it("nome do arquivo do PDF", () => {
    expect(nomeDoArquivo({ inicio: "2026-05", fim: "2026-10" })).toBe("BeautyCycle_Relatorio_2026-05_a_2026-10.pdf");
    expect(nomeDoArquivo({ mes: "2026-10", inicio: "2026-10", fim: "2026-10" })).toBe("BeautyCycle_Auditoria_2026-10.pdf");
  });
});

import { schemaNovaSenha } from "@/routes/reset-password";
import { isRateLimit } from "@/routes/esqueci-senha";
describe("Recuperação de senha", () => {
  it("exige mínimo de 8 caracteres", () => {
    expect(schemaNovaSenha.safeParse({ senha: "1234567", confirmar: "1234567" }).success).toBe(false);
    expect(schemaNovaSenha.safeParse({ senha: "12345678", confirmar: "12345678" }).success).toBe(true);
  });
  it("exige senhas iguais", () => {
    expect(schemaNovaSenha.safeParse({ senha: "12345678", confirmar: "12345679" }).success).toBe(false);
  });
  it("reconhece limite de envios", () => {
    expect(isRateLimit({ status: 429, message: "x" })).toBe(true);
    expect(isRateLimit({ status: 400, message: "invalid" })).toBe(false);
  });
});
