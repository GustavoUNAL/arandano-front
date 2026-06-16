import type { LauncherIconView } from './AppLauncherIcon'

export type HubTargetView = Extract<
  LauncherIconView,
  | 'products'
  | 'recipes'
  | 'inventory'
  | 'sales'
  | 'pos'
  | 'purchases'
  | 'costs'
  | 'gastos'
  | 'explorer'
>
