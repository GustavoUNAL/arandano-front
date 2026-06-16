export type HeaderNotification = {
  id: string
  title: string
  message: string
  severity: 'info' | 'warn' | 'error'
  actionLabel?: string
  onAction?: () => void
}

export function buildHeaderNotifications(options: {
  backendDown?: boolean
  onRetryApi?: () => void
}): HeaderNotification[] {
  const items: HeaderNotification[] = []
  if (options.backendDown) {
    items.push({
      id: 'api-down',
      title: 'API desconectada',
      message: 'No hay conexión con vos-api. Algunas funciones pueden fallar.',
      severity: 'error',
      actionLabel: 'Reintentar',
      onAction: options.onRetryApi,
    })
  }
  return items
}
