import {
  createProduct,
  fetchProducts,
  type CategoryRef,
  type ProductRow,
} from '../../api'
import { isPosDemoMode } from '../services/posApi'

/** SKU interno: no aparece en la carta; solo vía «Costo adicional». */
export const POS_EXTRA_CHARGE_SKU = 'POS-EXTRA'

export const POS_EXTRA_CHARGE_NAME = 'Costo adicional'

export const POS_EXTRA_CHARGE_PRESETS = [
  'Copa / vaso roto',
  'Plato / vajilla rota',
  'Daño a propiedad',
  'Otro cargo',
] as const

const DEMO_EXTRA_PRODUCT: ProductRow = {
  id: 'demo-p-pos-extra',
  name: POS_EXTRA_CHARGE_NAME,
  description: 'Cargos ocasionales (roturas, daños, etc.)',
  price: 0,
  categoryId: 'demo-cat-cafe',
  type: 'PRODUCT',
  active: true,
  sku: POS_EXTRA_CHARGE_SKU,
  category: { id: 'demo-cat-cafe', name: 'Café', type: 'PRODUCT' },
}

export function isPosExtraChargeProduct(product: {
  id?: string
  sku?: string | null
  name?: string
}): boolean {
  if (product.sku?.trim() === POS_EXTRA_CHARGE_SKU) return true
  if (product.id === DEMO_EXTRA_PRODUCT.id) return true
  return product.name?.trim() === POS_EXTRA_CHARGE_NAME
}

export function isPosExtraChargeLine(line: {
  productId: string
  productName: string
}): boolean {
  return (
    line.productId === DEMO_EXTRA_PRODUCT.id ||
    line.productName.trim() === POS_EXTRA_CHARGE_NAME ||
    line.productName.trim().startsWith(`${POS_EXTRA_CHARGE_NAME}:`)
  )
}

export function formatExtraChargeLineName(reason: string): string {
  const r = reason.trim()
  if (!r) return POS_EXTRA_CHARGE_NAME
  const short = r.length > 48 ? `${r.slice(0, 45)}…` : r
  return `${POS_EXTRA_CHARGE_NAME}: ${short}`
}

/**
 * Resuelve (o crea) el producto de sistema para cargos adicionales.
 * En modo demo/local usa un id fijo sin llamar al API.
 */
export async function ensurePosExtraChargeProduct(
  baseUrl: string,
  products: ProductRow[],
  categories: CategoryRef[],
): Promise<ProductRow> {
  const existing = products.find((p) => isPosExtraChargeProduct(p))
  if (existing) return existing

  if (isPosDemoMode()) return DEMO_EXTRA_PRODUCT

  try {
    const search = await fetchProducts(baseUrl, {
      page: 1,
      limit: 20,
      search: POS_EXTRA_CHARGE_NAME,
      active: true,
    })
    const found = search.data.find((p) => isPosExtraChargeProduct(p))
    if (found) return found
  } catch {
    /* seguir a create */
  }

  const categoryId = categories[0]?.id
  if (!categoryId) {
    throw new Error(
      'No hay categorías de productos. Cree al menos una en «Productos» para registrar costos adicionales.',
    )
  }

  try {
    return await createProduct(baseUrl, {
      name: POS_EXTRA_CHARGE_NAME,
      price: 0,
      categoryId,
      type: 'PRODUCT',
      description:
        'Producto de sistema para cargos ocasionales en punto de venta (roturas, daños, etc.). No usar en la carta.',
      sku: POS_EXTRA_CHARGE_SKU,
      active: true,
      unitCost: 0,
      costSource: 'MANUAL',
    })
  } catch (e) {
    try {
      const search = await fetchProducts(baseUrl, {
        page: 1,
        limit: 20,
        search: POS_EXTRA_CHARGE_NAME,
        active: true,
      })
      const found = search.data.find((p) => isPosExtraChargeProduct(p))
      if (found) return found
    } catch {
      /* ignore */
    }
    throw e instanceof Error
      ? e
      : new Error('No se pudo preparar el producto de costo adicional.')
  }
}

export { DEMO_EXTRA_PRODUCT }
