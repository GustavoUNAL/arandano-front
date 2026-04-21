import { describe, expect, it } from 'vitest'
import {
  assertPatchTotalValueCoherentWithLines,
  lineTotalFromPurchaseParts,
  purchaseTotalMatchesLines,
  quantityConsumed,
  sumLineTotalsCOP,
  totalValueVsLinesPurchaseMismatch,
} from './purchase-lot-line-math'

describe('lineTotalFromPurchaseParts', () => {
  it('multiplica y redondea COP', () => {
    expect(lineTotalFromPurchaseParts(10, 4000)).toBe(40000)
    expect(lineTotalFromPurchaseParts(1.5, 3333.33)).toBe(5000)
  })
})

describe('quantityConsumed', () => {
  it('es comprado − restante, nunca negativo', () => {
    expect(quantityConsumed(100, 30)).toBe(70)
    expect(quantityConsumed(100, 100)).toBe(0)
    expect(quantityConsumed(100, 120)).toBe(0)
  })
})

describe('sumLineTotalsCOP', () => {
  it('suma líneas', () => {
    expect(sumLineTotalsCOP([4000, 6000])).toBe(10000)
  })
})

describe('purchaseTotalMatchesLines', () => {
  it('admite tolerancia 1 COP', () => {
    expect(purchaseTotalMatchesLines(10001, 10000, 1)).toBe(true)
    expect(purchaseTotalMatchesLines(10002, 10000, 1)).toBe(false)
  })
})

describe('totalValueVsLinesPurchaseMismatch', () => {
  it('expone delta', () => {
    expect(totalValueVsLinesPurchaseMismatch(5000, 8000).deltaCOP).toBe(-3000)
  })
})

describe('assertPatchTotalValueCoherentWithLines', () => {
  it('no lanza si no hay líneas o no envían total', () => {
    expect(() =>
      assertPatchTotalValueCoherentWithLines(false, 999, 10000),
    ).not.toThrow()
    expect(() => assertPatchTotalValueCoherentWithLines(true, null, 10000)).not.toThrow()
    expect(() => assertPatchTotalValueCoherentWithLines(true, undefined, 10000)).not.toThrow()
  })

  it('lanza si total no cuadra con líneas', () => {
    expect(() =>
      assertPatchTotalValueCoherentWithLines(true, 5000, 10000),
    ).toThrow(/no cuadra con la suma de líneas/)
  })

  it('no lanza si total cuadra', () => {
    expect(() =>
      assertPatchTotalValueCoherentWithLines(true, 10000, 10000),
    ).not.toThrow()
  })
})
