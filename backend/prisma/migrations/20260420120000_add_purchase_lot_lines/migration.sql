-- Fuente de verdad del costo de compra por línea de lote.
-- Ajustá nombres de tablas padre si tu esquema difiere antes de aplicar.

CREATE TABLE IF NOT EXISTS "purchase_lot_lines" (
    "id" TEXT NOT NULL,
    "purchase_lot_code" TEXT NOT NULL,
    "inventory_item_id" TEXT,
    "line_name" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "quantity_purchased" DECIMAL(18,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "purchase_unit_cost_cop" DECIMAL(18,2) NOT NULL,
    "line_total_cop" DECIMAL(18,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "purchase_lot_lines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "purchase_lot_lines_inventory_item_id_key"
    ON "purchase_lot_lines"("inventory_item_id")
    WHERE "inventory_item_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "purchase_lot_lines_purchase_lot_code_idx"
    ON "purchase_lot_lines"("purchase_lot_code");

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_lots')
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'purchase_lot_lines_purchase_lot_code_fkey'
     ) THEN
    ALTER TABLE "purchase_lot_lines"
      ADD CONSTRAINT "purchase_lot_lines_purchase_lot_code_fkey"
      FOREIGN KEY ("purchase_lot_code") REFERENCES "purchase_lots"("code")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_items')
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'purchase_lot_lines_inventory_item_id_fkey'
     ) THEN
    ALTER TABLE "purchase_lot_lines"
      ADD CONSTRAINT "purchase_lot_lines_inventory_item_id_fkey"
      FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories')
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'purchase_lot_lines_category_id_fkey'
     ) THEN
    ALTER TABLE "purchase_lot_lines"
      ADD CONSTRAINT "purchase_lot_lines_category_id_fkey"
      FOREIGN KEY ("category_id") REFERENCES "categories"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
