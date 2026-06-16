import { BRAND_NAME } from '../lib/brand'
import { OdooHomeScreen } from './OdooHomeScreen'
import type { HubTargetView } from './hubTypes'

export type { HubTargetView } from './hubTypes'

export function NavigationHub({
  onNavigate,
  companyName,
}: {
  inventoryHint?: string
  purchasesHint?: string
  companyName?: string | null
  onNavigate: (view: HubTargetView) => void
}) {
  return (
    <div className="nav-hub nav-hub--odoo">
      <h1 className="sr-only">{BRAND_NAME} — inicio</h1>
      <OdooHomeScreen
        companyName={companyName}
        onOpenApp={(view) => onNavigate(view as HubTargetView)}
      />
    </div>
  )
}
