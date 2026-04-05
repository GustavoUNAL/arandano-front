import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  type InventoryOption,
  parseProductRecipe,
  type ProductRecipeDetail,
  type ProductRecipeLine,
  upsertProductRecipe,
} from '../api'

function newRowKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

type EditableLine = {
  key: string
  inventoryItemId: string
  quantity: string
  unit: string
}

function linesFromRecipe(lines: ProductRecipeLine[]): EditableLine[] {
  return lines.map((l) => ({
    key: newRowKey(),
    inventoryItemId: l.inventoryItemId,
    quantity: l.quantity,
    unit: l.unit,
  }))
}

function formatCOP(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}

function lineSubtotal(
  qtyStr: string,
  unitCost: string,
): { value: number; label: string } {
  const q = parseFloat(qtyStr.replace(',', '.'))
  const c = parseFloat(String(unitCost).replace(',', '.'))
  if (!Number.isFinite(q) || !Number.isFinite(c)) {
    return { value: 0, label: '—' }
  }
  const v = q * c
  return { value: v, label: formatCOP(v) }
}

type RecipeEditorProps = {
  baseUrl: string
  productId: string
  recipe: ProductRecipeDetail | null
  inventory: InventoryOption[]
  onRecipeUpdated?: (recipe: ProductRecipeDetail | null) => void
  /** Oculta el bloque de título (p. ej. cuando el panel ya tiene cabecera). */
  compact?: boolean
}

export function RecipeEditor({
  baseUrl,
  productId,
  recipe,
  inventory,
  onRecipeUpdated,
  compact = false,
}: RecipeEditorProps) {
  const [yieldStr, setYieldStr] = useState('1')
  const [rows, setRows] = useState<EditableLine[]>([])
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!recipe) {
      setYieldStr('1')
      setRows([])
      setFilters({})
      return
    }
    setYieldStr(recipe.recipeYield)
    setRows(linesFromRecipe(recipe.lines))
    setFilters({})
  }, [recipe, productId])

  const byId = useMemo(() => {
    const m = new Map<string, InventoryOption>()
    for (const i of inventory) m.set(i.id, i)
    return m
  }, [inventory])

  const addRow = useCallback(() => {
    const first = inventory[0]
    setRows((prev) => [
      ...prev,
      {
        key: newRowKey(),
        inventoryItemId: first?.id ?? '',
        quantity: '1',
        unit: first?.unit ?? '',
      },
    ])
  }, [inventory])

  const removeRow = useCallback((key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key))
  }, [])

  const updateRow = useCallback(
    (key: string, patch: Partial<EditableLine>) => {
      setRows((prev) =>
        prev.map((r) => {
          if (r.key !== key) return r
          const next = { ...r, ...patch }
          if (patch.inventoryItemId !== undefined) {
            const inv = byId.get(patch.inventoryItemId)
            if (inv) next.unit = inv.unit
          }
          return next
        }),
      )
    },
    [byId],
  )

  const filteredOptions = useCallback(
    (rowKey: string) => {
      const q = (filters[rowKey] ?? '').trim().toLowerCase()
      let list = !q
        ? inventory
        : inventory.filter((i) => i.name.toLowerCase().includes(q))
      return list.slice(0, 120)
    },
    [filters, inventory],
  )

  const save = useCallback(async () => {
    const y = parseFloat(yieldStr.replace(',', '.'))
    if (!Number.isFinite(y) || y <= 0) {
      setError('El rendimiento debe ser un número mayor que cero.')
      return
    }

    if (rows.length === 0) {
      if (
        !window.confirm(
          '¿Borrar la receta? No quedarán líneas de insumos para este producto.',
        )
      ) {
        return
      }
    }

    const ingredients: {
      inventoryItemId: string
      quantity: number
      unit: string
    }[] = []

    for (const r of rows) {
      if (!r.inventoryItemId) {
        setError('Cada fila debe tener un insumo seleccionado.')
        return
      }
      const q = parseFloat(r.quantity.replace(',', '.'))
      if (!Number.isFinite(q) || q <= 0) {
        setError('Las cantidades deben ser números válidos mayores que cero.')
        return
      }
      if (!r.unit.trim()) {
        setError('Indica la unidad en cada fila.')
        return
      }
      ingredients.push({
        inventoryItemId: r.inventoryItemId,
        quantity: q,
        unit: r.unit.trim(),
      })
    }

    setSaving(true)
    setError(null)
    try {
      const updated = await upsertProductRecipe(baseUrl, productId, {
        recipeYield: y,
        ingredients,
      })
      const next = parseProductRecipe(updated.recipe)
      onRecipeUpdated?.(next)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }, [baseUrl, onRecipeUpdated, productId, rows, yieldStr])

  const yieldNum = parseFloat(yieldStr.replace(',', '.'))
  const totalRecipeCOP = useMemo(() => {
    let t = 0
    for (const r of rows) {
      const inv = byId.get(r.inventoryItemId)
      if (!inv) continue
      const { value } = lineSubtotal(r.quantity, inv.unitCostCOP)
      t += value
    }
    return t
  }, [byId, rows])

  const perUnitCOP =
    Number.isFinite(yieldNum) && yieldNum > 0
      ? totalRecipeCOP / yieldNum
      : 0

  return (
    <div className="recipe-editor">
      {!compact && (
        <div className="recipe-editor-intro">
          <h3>Receta</h3>
          <p className="muted small">
            Define cuánto rinde y qué insumos consume. Los costos salen del
            inventario.
          </p>
        </div>
      )}

      <div className="recipe-yield-row">
        <label className="field field-inline">
          <span>Rendimiento</span>
          <input
            inputMode="decimal"
            className="input-narrow"
            value={yieldStr}
            onChange={(e) => setYieldStr(e.target.value)}
            title="Unidades de producto que salen de esta receta"
          />
        </label>
        <div className="recipe-cost-summary">
          <span className="muted small">Costo insumos</span>
          <strong>{formatCOP(totalRecipeCOP)}</strong>
          <span className="muted small">
            · por unidad vendida ~ {formatCOP(perUnitCOP)}
          </span>
        </div>
      </div>

      <div className="recipe-table-wrap">
        <table className="recipe-table">
          <thead>
            <tr>
              <th className="col-filter">Buscar</th>
              <th>Insumo</th>
              <th className="col-qty">Cantidad</th>
              <th className="col-unit">Unidad</th>
              <th className="col-cost">Subtotal</th>
              <th className="col-actions" aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="recipe-table-empty">
                  Sin líneas. Añade insumos con el botón de abajo.
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const inv = byId.get(row.inventoryItemId)
              const sub = inv
                ? lineSubtotal(row.quantity, inv.unitCostCOP)
                : { value: 0, label: '—' }
              const opts = filteredOptions(row.key)
              const showSelected =
                inv && !opts.some((o) => o.id === row.inventoryItemId)

              return (
                <tr key={row.key}>
                  <td className="col-filter">
                    <input
                      type="search"
                      className="recipe-filter-input"
                      placeholder="Filtrar…"
                      value={filters[row.key] ?? ''}
                      onChange={(e) =>
                        setFilters((f) => ({
                          ...f,
                          [row.key]: e.target.value,
                        }))
                      }
                    />
                  </td>
                  <td>
                    <select
                      className="recipe-select"
                      value={row.inventoryItemId}
                      onChange={(e) =>
                        updateRow(row.key, {
                          inventoryItemId: e.target.value,
                        })
                      }
                    >
                      {showSelected && inv && (
                        <option value={inv.id}>{inv.name}</option>
                      )}
                      {opts.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name} · stock {o.quantity} {o.unit}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="col-qty">
                    <input
                      inputMode="decimal"
                      className="input-cell"
                      value={row.quantity}
                      onChange={(e) =>
                        updateRow(row.key, { quantity: e.target.value })
                      }
                    />
                  </td>
                  <td className="col-unit">
                    <input
                      className="input-cell"
                      value={row.unit}
                      onChange={(e) =>
                        updateRow(row.key, { unit: e.target.value })
                      }
                    />
                  </td>
                  <td className="col-cost mono">{sub.label}</td>
                  <td className="col-actions">
                    <button
                      type="button"
                      className="btn-icon-remove"
                      title="Quitar fila"
                      onClick={() => removeRow(row.key)}
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="recipe-editor-footer">
        <button
          type="button"
          className="btn-secondary"
          onClick={addRow}
          disabled={inventory.length === 0}
        >
          + Añadir insumo
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => void save()}
          disabled={saving || inventory.length === 0}
        >
          {saving ? 'Guardando receta…' : 'Guardar receta'}
        </button>
      </div>

      {inventory.length === 0 && (
        <p className="banner-warn">
          No hay insumos en inventario para elegir. Revisa la API o la tabla{' '}
          <code>inventory</code>.
        </p>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
