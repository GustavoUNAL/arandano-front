# Backend — `purchase_lot_lines` y costo de compra

Paquete de referencia dentro del monorepo front: **modelo Prisma**, **migración SQL**, **matemática compartida**, **tests** y **script de backfill**. Conectalo con tu API Nest existente copiando `src/common/` y las reglas al servicio de compras.

## Contenido

| Ruta | Descripción |
|------|-------------|
| `prisma/schema.prisma` | `PurchaseLotLine` + relaciones mínimas (`purchase_lots`, `inventory_items`, `categories`). |
| `prisma/migrations/20260420120000_add_purchase_lot_lines/migration.sql` | Crea `purchase_lot_lines` y FKs condicionales si existen las tablas padre. |
| `src/common/purchase-lot-line-math.ts` | Suma de líneas, consumido, validación PATCH `totalValue` vs Σ líneas (tolerancia 1 COP). |
| `src/common/*.spec.ts` | Vitest. |
| `scripts/backfill-purchase-lot-lines.ts` | Stub: reemplazar por `deriveBackfillQuantityPurchased` + movimientos. |

## Contrato API (resumen para Nest)

- **GET `/purchase-lots/:id`**: `purchaseLines[]` (comprobante), `purchaseTotals`, `inventoryWithoutPurchaseLine`, `inventoryMetrics` ampliado (`purchasedValueCOP`, `purchaseLinesAuthoritative`, etc.).
- **PATCH `/purchase-lots/:id`**: si hay líneas y `totalValue` no cuadra con Σ `line_total_cop` → **400** (usá `assertPatchTotalValueCoherentWithLines`).
- **PUT `/purchase-lots/:id/purchase-lines`**: reemplazo atómico de líneas; opcional `expectedTotalValueCOP`; al final `totalValue = sum(lines)`.

## Pasos en tu entorno

```bash
cd backend
npm install
cp .env.example .env   # y definí DATABASE_URL
npm run db:generate
npm run db:migrate:dev # o db:migrate en CI
npm run db:backfill-purchase-lot-lines   # si ya hay datos
npm test
```

## Nota sobre la migración

Si tus tablas padre no se llaman `purchase_lots` / `inventory_items` / `categories`, adaptá el bloque `DO $$` del SQL o generá la migración con `prisma migrate diff` contra tu base real.
