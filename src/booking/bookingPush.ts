import { apiFetch } from '../api'

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i)
  return out
}

export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false
  const media = window.matchMedia('(display-mode: standalone)').matches
  const ios = 'standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  return media || ios
}

export function bookingPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export async function bookingPushEnabled(): Promise<boolean> {
  if (!bookingPushSupported() || Notification.permission !== 'granted') return false
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  return Boolean(sub)
}

export async function enableBookingPush(baseUrl: string): Promise<void> {
  if (!bookingPushSupported()) {
    throw new Error('Este navegador no admite avisos nativos.')
  }
  const vapidRes = await apiFetch(`${baseUrl}/booking/push/vapid`)
  if (!vapidRes.ok) {
    throw new Error('No se pudo leer la configuración de avisos.')
  }
  const vapid = (await vapidRes.json()) as { configured: boolean; publicKey: string }
  if (!vapid.configured || !vapid.publicKey) {
    throw new Error('Los avisos no están configurados en el servidor.')
  }
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Hay que permitir notificaciones en el teléfono.')
  }
  const reg = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid.publicKey) as BufferSource,
    }))
  const json = sub.toJSON()
  const saved = await apiFetch(`${baseUrl}/booking/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
    }),
  })
  if (!saved.ok) throw new Error('No se pudo guardar este teléfono.')
}

export async function disableBookingPush(baseUrl: string): Promise<void> {
  if (!bookingPushSupported()) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    await apiFetch(`${baseUrl}/booking/push/subscribe`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    })
    await sub.unsubscribe()
  }
}
