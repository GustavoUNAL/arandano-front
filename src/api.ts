const STORAGE_KEY = 'arandano_api_base'

export function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined
  if (fromEnv?.trim()) {
    return fromEnv.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored?.trim()) {
      return stored.replace(/\/$/, '')
    }
  }
  return 'http://localhost:3000'
}

export function setApiBase(url: string): void {
  window.localStorage.setItem(STORAGE_KEY, url.replace(/\/$/, ''))
}

export type TableInfo = { slug: string; sqlName: string }

export type TableRowsResponse = {
  total: number
  columns: string[]
  rows: Record<string, unknown>[]
}

export async function fetchTables(base: string): Promise<TableInfo[]> {
  const res = await fetch(`${base}/explorer/tables`)
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<TableInfo[]>
}

export async function fetchTableRows(
  base: string,
  slug: string,
  limit: number,
  offset: number,
): Promise<TableRowsResponse> {
  const q = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  })
  const res = await fetch(`${base}/explorer/tables/${slug}?${q}`)
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<TableRowsResponse>
}

// ——— Products API ———

export type CategoryRef = {
  id: string
  name: string
  type: string
  parentId?: string | null
}

export type ProductRow = {
  id: string
  name: string
  description: string
  price: string | number
  categoryId: string
  type: string
  imageUrl?: string | null
  size?: string | null
  active: boolean
  createdAt?: string
  updatedAt?: string
  category: CategoryRef
}

export type ProductsListResponse = {
  data: ProductRow[]
  meta: { page: number; limit: number; total: number; hasNextPage: boolean }
}

export type CreateProductPayload = {
  name: string
  price: number
  categoryId: string
  type: string
  description?: string
  size?: string
  imageUrl?: string
  active?: boolean
}

export type UpdateProductPayload = Partial<CreateProductPayload>

async function parseJsonError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string | string[] }
    if (Array.isArray(body.message)) return body.message.join(', ')
    if (typeof body.message === 'string') return body.message
  } catch {
    /* ignore */
  }
  return `${res.status} ${res.statusText}`
}

export type ProductListSort = 'name' | 'price_asc' | 'price_desc'

export async function fetchProducts(
  base: string,
  opts: {
    page?: number
    limit?: number
    search?: string
    categoryId?: string
    active?: boolean
    type?: string
    sort?: ProductListSort
  },
): Promise<ProductsListResponse> {
  const q = new URLSearchParams()
  q.set('page', String(opts.page ?? 1))
  q.set('limit', String(Math.min(opts.limit ?? 24, 100)))
  if (opts.search?.trim()) q.set('search', opts.search.trim())
  if (opts.categoryId?.trim()) q.set('categoryId', opts.categoryId.trim())
  if (opts.active === true) q.set('active', 'true')
  if (opts.active === false) q.set('active', 'false')
  if (opts.type?.trim()) q.set('type', opts.type.trim())
  if (opts.sort && opts.sort !== 'name') q.set('sort', opts.sort)
  const res = await fetch(`${base}/products?${q}`)
  if (!res.ok) throw new Error(await parseJsonError(res))
  return res.json() as Promise<ProductsListResponse>
}

export async function fetchProduct(
  base: string,
  id: string,
): Promise<ProductRow & { recipe?: unknown }> {
  const res = await fetch(`${base}/products/${id}`)
  if (!res.ok) throw new Error(await parseJsonError(res))
  return res.json() as Promise<ProductRow & { recipe?: unknown }>
}

export async function createProduct(
  base: string,
  payload: CreateProductPayload,
): Promise<ProductRow> {
  const res = await fetch(`${base}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseJsonError(res))
  return res.json() as Promise<ProductRow>
}

export async function updateProduct(
  base: string,
  id: string,
  payload: UpdateProductPayload,
): Promise<ProductRow> {
  const res = await fetch(`${base}/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseJsonError(res))
  return res.json() as Promise<ProductRow>
}

export async function deleteProduct(base: string, id: string): Promise<void> {
  const res = await fetch(`${base}/products/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await parseJsonError(res))
}

// ——— Recipes ———

export type RecipeCatalogEntry = {
  productId: string
  productName: string
  productType: string
  categoryId?: string
  categoryName: string | null
  recipeYield: string
  ingredientCount: number
}

export async function fetchRecipeCatalog(
  base: string,
  categoryId?: string,
): Promise<RecipeCatalogEntry[]> {
  const q = new URLSearchParams()
  if (categoryId?.trim()) q.set('categoryId', categoryId.trim())
  const qs = q.toString()
  const res = await fetch(
    `${base}/recipes${qs ? `?${qs}` : ''}`,
  )
  if (!res.ok) throw new Error(await parseJsonError(res))
  return res.json() as Promise<RecipeCatalogEntry[]>
}

export type RecipeCostKind = 'FIJO' | 'VARIABLE'

export type RecipeCostLineRow = {
  id: string
  recipeId: string
  productId: string
  productName: string
  categoryName: string | null
  kind: RecipeCostKind
  name: string
  quantity: string | null
  unit: string
  lineTotalCOP: string
  sheetUnitCost: string | null
  sortOrder: number
}

export type RecipeCostsResponse = {
  fixed: RecipeCostLineRow[]
  variable: RecipeCostLineRow[]
  totals: { fixedCOP: string; variableCOP: string }
}

export async function fetchRecipeCosts(
  base: string,
): Promise<RecipeCostsResponse> {
  const res = await fetch(`${base}/recipes/costs`)
  if (!res.ok) throw new Error(await parseJsonError(res))
  return res.json() as Promise<RecipeCostsResponse>
}

export type ProductRecipeLine = {
  id: string
  inventoryItemId: string
  ingredient: string
  quantity: string
  unit: string
  unitCostCOP: string
  lineTotalCOP: string
  sheetUnitCost?: string | null
  sheetQuantity?: string | null
}

export type ProductRecipeDetail = {
  recipeYield: string
  lines: ProductRecipeLine[]
}

export function parseProductRecipe(
  recipe: unknown,
): ProductRecipeDetail | null {
  if (!recipe || typeof recipe !== 'object') return null
  const r = recipe as { recipeYield?: string; lines?: unknown[] }
  if (typeof r.recipeYield !== 'string') return null
  if (!Array.isArray(r.lines)) return null
  return {
    recipeYield: r.recipeYield,
    lines: r.lines as ProductRecipeLine[],
  }
}

export type UpsertRecipePayload = {
  recipeYield: number
  ingredients: { inventoryItemId: string; quantity: number; unit: string }[]
}

export async function upsertProductRecipe(
  base: string,
  productId: string,
  payload: UpsertRecipePayload,
): Promise<ProductRow & { recipe?: ProductRecipeDetail }> {
  const res = await fetch(`${base}/products/${productId}/recipe`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseJsonError(res))
  return res.json() as Promise<ProductRow & { recipe?: ProductRecipeDetail }>
}

export type InventoryOption = {
  id: string
  name: string
  unit: string
  unitCostCOP: string
  quantity: string
}

// ——— Inventory API ———

export type InventoryRow = {
  id: string
  name: string
  categoryId: string
  quantity: string | number
  unit: string
  unitCost: string | number
  supplier?: string | null
  lot?: string | null
  minStock?: string | number | null
  category: { id: string; name: string; type: string }
}

export type InventoryListResponse = {
  data: InventoryRow[]
  meta: { page: number; limit: number; total: number; hasNextPage: boolean }
}

export type CreateInventoryPayload = {
  name: string
  categoryId: string
  quantity: number
  unit: string
  unitCost: number
  supplier?: string
  lot?: string
  minStock?: number
}

export type UpdateInventoryPayload = Partial<CreateInventoryPayload>

export async function fetchInventoryItems(
  base: string,
  opts: {
    page?: number
    limit?: number
    search?: string
    categoryId?: string
  },
): Promise<InventoryListResponse> {
  const q = new URLSearchParams()
  q.set('page', String(opts.page ?? 1))
  q.set('limit', String(Math.min(opts.limit ?? 24, 100)))
  if (opts.search?.trim()) q.set('search', opts.search.trim())
  if (opts.categoryId?.trim()) q.set('categoryId', opts.categoryId.trim())
  const res = await fetch(`${base}/inventory?${q}`)
  if (!res.ok) throw new Error(await parseJsonError(res))
  return res.json() as Promise<InventoryListResponse>
}

export async function fetchInventoryItem(
  base: string,
  id: string,
): Promise<InventoryRow> {
  const res = await fetch(`${base}/inventory/${id}`)
  if (!res.ok) throw new Error(await parseJsonError(res))
  return res.json() as Promise<InventoryRow>
}

export async function createInventoryItem(
  base: string,
  payload: CreateInventoryPayload,
): Promise<InventoryRow> {
  const res = await fetch(`${base}/inventory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseJsonError(res))
  return res.json() as Promise<InventoryRow>
}

export async function updateInventoryItem(
  base: string,
  id: string,
  payload: UpdateInventoryPayload,
): Promise<InventoryRow> {
  const res = await fetch(`${base}/inventory/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseJsonError(res))
  return res.json() as Promise<InventoryRow>
}

export async function deleteInventoryItem(base: string, id: string): Promise<void> {
  const res = await fetch(`${base}/inventory/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await parseJsonError(res))
}

/** Insumos activos para recetas (pagina GET /inventory). */
export async function fetchInventoryOptions(
  base: string,
  maxRows = 2000,
): Promise<InventoryOption[]> {
  const out: InventoryOption[] = []
  let page = 1
  while (out.length < maxRows) {
    const res = await fetchInventoryItems(base, { page, limit: 100 })
    for (const row of res.data) {
      out.push({
        id: row.id,
        name: row.name,
        unit: row.unit,
        unitCostCOP: String(row.unitCost),
        quantity: String(row.quantity),
      })
      if (out.length >= maxRows) break
    }
    if (!res.meta.hasNextPage) break
    page++
  }
  out.sort((a, b) => a.name.localeCompare(b.name, 'es'))
  return out
}

// ——— Sales API ———

export type SaleListRow = {
  id: string
  saleDate: string
  total: string | number
  paymentMethod?: string | null
  source: string
  mesa?: string | null
  notes?: string | null
  _count: { lines: number }
}

export type SalesListResponse = {
  data: SaleListRow[]
  meta: { page: number; limit: number; total: number; hasNextPage: boolean }
}

export type SaleLineDetail = {
  id: string
  saleId: string
  productId: string | null
  productName: string
  quantity: string | number
  unitPrice: string | number
  costAtSale?: string | number | null
  profit?: string | number | null
  product?: { id: string; name: string } | null
}

export type SaleDetail = {
  id: string
  saleDate: string
  total: string | number
  paymentMethod?: string | null
  source: string
  mesa?: string | null
  notes?: string | null
  userId?: string | null
  lines: SaleLineDetail[]
}

export type SaleLineInputPayload = {
  productId?: string
  productName: string
  quantity: number
  unitPrice: number
  costAtSale?: number
  profit?: number
}

export type CreateSalePayload = {
  saleDate: string
  paymentMethod?: string
  source?: string
  mesa?: string
  notes?: string
  userId?: string
  lines: SaleLineInputPayload[]
}

export type PatchSalePayload = {
  saleDate?: string
  paymentMethod?: string
  source?: string
  mesa?: string
  notes?: string
  userId?: string
}

export async function fetchSales(
  base: string,
  opts: {
    page?: number
    limit?: number
    search?: string
    source?: string
    dateFrom?: string
    dateTo?: string
  },
): Promise<SalesListResponse> {
  const q = new URLSearchParams()
  q.set('page', String(opts.page ?? 1))
  q.set('limit', String(Math.min(opts.limit ?? 20, 100)))
  if (opts.search?.trim()) q.set('search', opts.search.trim())
  if (opts.source?.trim()) q.set('source', opts.source.trim())
  if (opts.dateFrom?.trim()) q.set('dateFrom', opts.dateFrom.trim())
  if (opts.dateTo?.trim()) q.set('dateTo', opts.dateTo.trim())
  const res = await fetch(`${base}/sales?${q}`)
  if (!res.ok) throw new Error(await parseJsonError(res))
  return res.json() as Promise<SalesListResponse>
}

export async function fetchSale(base: string, id: string): Promise<SaleDetail> {
  const res = await fetch(`${base}/sales/${id}`)
  if (!res.ok) throw new Error(await parseJsonError(res))
  return res.json() as Promise<SaleDetail>
}

export async function createSale(
  base: string,
  payload: CreateSalePayload,
): Promise<SaleDetail> {
  const res = await fetch(`${base}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseJsonError(res))
  return res.json() as Promise<SaleDetail>
}

export async function patchSale(
  base: string,
  id: string,
  payload: PatchSalePayload,
): Promise<SaleDetail> {
  const res = await fetch(`${base}/sales/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseJsonError(res))
  return res.json() as Promise<SaleDetail>
}

export async function replaceSaleLines(
  base: string,
  id: string,
  lines: SaleLineInputPayload[],
): Promise<SaleDetail> {
  const res = await fetch(`${base}/sales/${id}/lines`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lines }),
  })
  if (!res.ok) throw new Error(await parseJsonError(res))
  return res.json() as Promise<SaleDetail>
}

// ——— Compras (lotes de compra) ———

export type PurchaseLotRow = {
  id: string
  code: string
  purchaseDate: string
  supplier?: string | null
  notes?: string | null
  itemCount: number
  totalValue?: string | number | null
  createdAt?: string
  updatedAt?: string
}

export type PurchaseLotsListResponse = {
  data: PurchaseLotRow[]
  meta: { page: number; limit: number; total: number; hasNextPage: boolean }
}

export type PatchPurchaseLotPayload = {
  purchaseDate?: string
  supplier?: string
  notes?: string
  totalValue?: number
}

export async function fetchPurchaseLots(
  base: string,
  opts: {
    page?: number
    limit?: number
    search?: string
    dateFrom?: string
    dateTo?: string
  },
): Promise<PurchaseLotsListResponse> {
  const q = new URLSearchParams()
  q.set('page', String(opts.page ?? 1))
  q.set('limit', String(Math.min(opts.limit ?? 20, 100)))
  if (opts.search?.trim()) q.set('search', opts.search.trim())
  if (opts.dateFrom?.trim()) q.set('dateFrom', opts.dateFrom.trim())
  if (opts.dateTo?.trim()) q.set('dateTo', opts.dateTo.trim())
  const res = await fetch(`${base}/purchase-lots?${q}`)
  if (!res.ok) throw new Error(await parseJsonError(res))
  return res.json() as Promise<PurchaseLotsListResponse>
}

export async function fetchPurchaseLot(
  base: string,
  id: string,
): Promise<PurchaseLotRow> {
  const res = await fetch(`${base}/purchase-lots/${id}`)
  if (!res.ok) throw new Error(await parseJsonError(res))
  return res.json() as Promise<PurchaseLotRow>
}

export async function patchPurchaseLot(
  base: string,
  id: string,
  payload: PatchPurchaseLotPayload,
): Promise<PurchaseLotRow> {
  const res = await fetch(`${base}/purchase-lots/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseJsonError(res))
  return res.json() as Promise<PurchaseLotRow>
}

/** Categorías aptas para productos (`type === PRODUCT`) vía explorador. */
export async function fetchProductCategories(
  base: string,
): Promise<CategoryRef[]> {
  const { rows } = await fetchTableRows(base, 'categories', 500, 0)
  return rows
    .filter((r) => String(r.type) === 'PRODUCT')
    .map((r) => ({
      id: String(r.id),
      name: String(r.name ?? ''),
      type: String(r.type ?? ''),
      parentId:
        r.parentId != null
          ? String(r.parentId)
          : r.parent_id != null
            ? String(r.parent_id)
            : null,
    }))
}

/** Categorías de inventario (`type === INVENTORY`). */
export async function fetchInventoryCategories(
  base: string,
): Promise<CategoryRef[]> {
  const { rows } = await fetchTableRows(base, 'categories', 500, 0)
  return rows
    .filter((r) => String(r.type) === 'INVENTORY')
    .map((r) => ({
      id: String(r.id),
      name: String(r.name ?? ''),
      type: String(r.type ?? ''),
      parentId:
        r.parentId != null
          ? String(r.parentId)
          : r.parent_id != null
            ? String(r.parent_id)
            : null,
    }))
}
