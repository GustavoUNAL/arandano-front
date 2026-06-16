import { PLATFORM_MODE, SALES_FLOOR_ONLY } from '../appScope'
import type { NavGroupId } from '../navTypes'
import { buildDesktopNavGroups, type DesktopNavGroup } from './desktopNav'

export type OdooAppTile = {
  group: NavGroupId
  label: string
  defaultView: string
  menuCount: number
}

export function buildOdooAppTiles(options: {
  canViewFinance?: boolean
  canViewTasks?: boolean
}): OdooAppTile[] {
  return buildDesktopNavGroups(options).map((group) => ({
    group: group.id,
    label: group.label,
    defaultView: group.items[0]?.view ?? 'products',
    menuCount: group.items.length,
  }))
}

export function findNavContext(
  view: string,
  groups: DesktopNavGroup[],
): { group: DesktopNavGroup; item: DesktopNavGroup['items'][number] } | null {
  for (const group of groups) {
    const item = group.items.find((entry) => entry.view === view)
    if (item) return { group, item }
  }
  return null
}

export function isOdooHomeView(view: string): boolean {
  if (PLATFORM_MODE) return view === 'home'
  if (SALES_FLOOR_ONLY) return false
  return view === 'menu'
}

export function odooHomeTargetView(): string {
  if (PLATFORM_MODE) return 'home'
  if (SALES_FLOOR_ONLY) return 'products'
  return 'menu'
}
