import { describe, expect, it } from 'vitest'
import { assertPatchTotalValueCoherentWithLines } from './purchase-lot-line-math'

/**
 * Espejo del caso Nest: PATCH /purchase-lots/:id con totalValue incoherente → BadRequestException.
 * En el servicio: mapeá el Error de assertPatchTotalValueCoherentWithLines a BadRequestException.
 */
describe('PATCH purchase-lot totalValue vs líneas (contrato API)', () => {
  it('rechaza total que implica borrar costo por consumo', () => {
    const linesSum = 120_000
    const patchTotal = 50_000
    expect(() =>
      assertPatchTotalValueCoherentWithLines(true, patchTotal, linesSum),
    ).toThrow(/no cuadra con la suma de líneas/)
  })

  it('acepta total alineado con líneas', () => {
    expect(() =>
      assertPatchTotalValueCoherentWithLines(true, 120_000, 120_000),
    ).not.toThrow()
  })
})
