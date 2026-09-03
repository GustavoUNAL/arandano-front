import type { ProductRow } from '../../api'

/** Combos de la categoría Combos (y SKUs conocidos como respaldo). */
export const POS_FEATURED_COMBO_SKUS = ['4013', '4014'] as const

function isPosComboProduct(product: ProductRow): boolean {
  const slug = (product.category?.slug ?? product.type ?? '').toLowerCase()
  if (slug === 'combos' || slug === 'combo') return true
  const sku = product.sku ?? ''
  return (POS_FEATURED_COMBO_SKUS as readonly string[]).includes(sku)
}

export function pinPosFeaturedCombos(
  products: ProductRow[],
  catalog: ProductRow[] = products,
): ProductRow[] {
  const pinnedIds = new Set<string>()
  const pinned: ProductRow[] = []
  for (const product of catalog) {
    if (product.active === false) continue
    if (!isPosComboProduct(product)) continue
    if (pinnedIds.has(product.id)) continue
    pinned.push(product)
    pinnedIds.add(product.id)
  }
  pinned.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
  return [...pinned, ...products.filter((p) => !pinnedIds.has(p.id))]
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

export function productSearchScore(
  product: ProductRow,
  rawQuery: string,
): { match: boolean; score: number } {
  const query = normalizeText(rawQuery)
  if (!query) return { match: true, score: 0 }

  const name = normalizeText(product.name)
  const sku = normalizeText(product.sku ?? '')
  const tokens = query.split(/\s+/).filter(Boolean)

  if (name === query) return { match: true, score: 100 }
  if (sku && sku === query) return { match: true, score: 95 }
  if (name.startsWith(query)) return { match: true, score: 85 }
  if (sku && sku.startsWith(query)) return { match: true, score: 80 }
  if (name.includes(query)) return { match: true, score: 70 }
  if (sku && sku.includes(query)) return { match: true, score: 65 }

  if (
    tokens.length > 0 &&
    tokens.every((token) => name.includes(token) || sku.includes(token))
  ) {
    const starts = tokens.filter((token) => name.startsWith(token)).length
    return { match: true, score: 55 + starts * 5 + tokens.length }
  }

  return { match: false, score: 0 }
}

export function sortProductsForPos(
  products: ProductRow[],
  opts: {
    search: string
    salesUnitsByProductId: Map<string, number>
  },
): ProductRow[] {
  const { search, salesUnitsByProductId } = opts
  const q = search.trim()

  return [...products].sort((a, b) => {
    if (q) {
      const sa = productSearchScore(a, q).score
      const sb = productSearchScore(b, q).score
      if (sb !== sa) return sb - sa
    }
    const ua = salesUnitsByProductId.get(a.id) ?? 0
    const ub = salesUnitsByProductId.get(b.id) ?? 0
    if (ub !== ua) return ub - ua
    return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  })
}

export function filterProductsForPos(
  products: ProductRow[],
  opts: {
    activeCategoryId: string | null
    search: string
  },
): ProductRow[] {
  const { activeCategoryId, search } = opts
  return products.filter((p) => {
    if (!p.active) return false
    if (activeCategoryId && p.categoryId !== activeCategoryId) return false
    if (search.trim()) {
      return productSearchScore(p, search).match
    }
    return true
  })
}
