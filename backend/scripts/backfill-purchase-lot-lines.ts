/**
 * npm run db:backfill-purchase-lot-lines
 *
 * Rellena purchase_lot_lines desde inventario con `lot` + datos congelados de compra.
 * Completá la lógica con tu deriveBackfillQuantityPurchased / movimientos reales.
 *
 * Requiere: DATABASE_URL, prisma generate ejecutado.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.info('[backfill] Inicio (stub): enumerar ítems con lot no nulo…')

  const items = await prisma.inventoryItem.findMany({
    where: { lot: { not: null } },
    select: {
      id: true,
      lot: true,
      name: true,
      categoryId: true,
      quantity: true,
      unit: true,
      unitCostCOP: true,
    },
  })

  // eslint-disable-next-line no-console
  console.info(`[backfill] Ítems con lote: ${items.length}`)

  for (const inv of items) {
    if (!inv.lot) continue
    const exists = await prisma.purchaseLotLine.findFirst({
      where: { inventoryItemId: inv.id },
    })
    if (exists) continue

    const q = Number(inv.quantity)
    const c = Number(inv.unitCostCOP)
    const lineTotal = Math.round(q * c)

    // Stub: quantity_purchased = cantidad actual (reemplazar por deriveBackfillQuantityPurchased)
    const quantityPurchased = q

    await prisma.purchaseLotLine.create({
      data: {
        purchaseLotCode: inv.lot,
        inventoryItemId: inv.id,
        lineName: inv.name,
        categoryId: inv.categoryId,
        quantityPurchased,
        unit: inv.unit,
        purchaseUnitCostCOP: c,
        lineTotalCOP: lineTotal,
        sortOrder: 0,
      },
    })
  }

  // eslint-disable-next-line no-console
  console.info('[backfill] Listo.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())
