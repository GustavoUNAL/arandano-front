import { useState } from 'react'
import {
  companyIdFromAccessToken,
  getAccessToken,
  getApiBase,
  getCompanyId,
  getLastCompanyId,
} from '../api'
import {
  GOOGLE_AUTH_MESSAGE,
  GOOGLE_AUTH_STORAGE_KEY,
  googleAuthErrorMessage,
  type GoogleAuthPopupResult,
} from '../lib/authRoutes'

type Props = {
  returnTo?: 'login' | 'health'
  label?: string
  disabled?: boolean
  onSuccess: (token: string) => void | Promise<void>
  onSignup?: (signupToken: string) => void | Promise<void>
  onError?: (message: string) => void
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export function getGoogleOAuthStartUrl(
  returnTo: 'login' | 'health' = 'login',
  popup = true,
): string {
  const q = new URLSearchParams({ returnTo })
  if (popup) q.set('popup', '1')
  const companyId =
    getCompanyId() ||
    getLastCompanyId() ||
    companyIdFromAccessToken(getAccessToken())
  if (companyId) q.set('companyId', companyId)
  return `${getApiBase()}/auth/google?${q.toString()}`
}

function parsePopupResult(raw: unknown): GoogleAuthPopupResult | null {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as Partial<GoogleAuthPopupResult>
  if (data.type !== GOOGLE_AUTH_MESSAGE) return null
  return {
    type: GOOGLE_AUTH_MESSAGE,
    token: data.token ?? null,
    signupToken: data.signupToken ?? null,
    error: data.error ?? null,
  }
}

function openCenteredPopup(url: string): Window | null {
  const w = 480
  const h = 700
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - w) / 2))
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - h) / 2))
  return window.open(
    url,
    'vos-google-auth',
    `popup=yes,width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,status=no,scrollbars=yes`,
  )
}

function waitForGooglePopup(popup: Window): Promise<GoogleAuthPopupResult> {
  return new Promise((resolve) => {
    let settled = false
    const finish = (result: GoogleAuthPopupResult) => {
      if (settled) return
      settled = true
      window.removeEventListener('message', onMessage)
      window.removeEventListener('storage', onStorage)
      window.clearInterval(closedTimer)
      window.clearTimeout(timeout)
      try {
        channel?.close()
      } catch {
        /* ignore */
      }
      try {
        window.localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY)
      } catch {
        /* ignore */
      }
      resolve(result)
    }

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const parsed = parsePopupResult(event.data)
      if (parsed) finish(parsed)
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== GOOGLE_AUTH_STORAGE_KEY || !event.newValue) return
      try {
        const parsed = parsePopupResult(JSON.parse(event.newValue))
        if (parsed) finish(parsed)
      } catch {
        /* ignore */
      }
    }

    let channel: BroadcastChannel | null = null
    try {
      channel = new BroadcastChannel(GOOGLE_AUTH_MESSAGE)
      channel.onmessage = (event) => {
        const parsed = parsePopupResult(event.data)
        if (parsed) finish(parsed)
      }
    } catch {
      channel = null
    }

    window.addEventListener('message', onMessage)
    window.addEventListener('storage', onStorage)

    const closedTimer = window.setInterval(() => {
      if (!popup.closed) return
      try {
        const raw = window.localStorage.getItem(GOOGLE_AUTH_STORAGE_KEY)
        if (raw) {
          const parsed = parsePopupResult(JSON.parse(raw) as unknown)
          if (parsed) {
            finish(parsed)
            return
          }
        }
      } catch {
        /* ignore */
      }
      const existing = getAccessToken()
      if (existing) {
        finish({ type: GOOGLE_AUTH_MESSAGE, token: existing, signupToken: null, error: null })
        return
      }
      finish({ type: GOOGLE_AUTH_MESSAGE, token: null, signupToken: null, error: 'access_denied' })
    }, 400)
    const timeout = window.setTimeout(() => {
      finish({ type: GOOGLE_AUTH_MESSAGE, token: null, signupToken: null, error: 'oauth_failed' })
    }, 5 * 60 * 1000)
  })
}

export function GoogleSignInButton({
  returnTo = 'login',
  label = 'Continuar con Google',
  disabled,
  onSuccess,
  onSignup,
  onError,
}: Props) {
  const [waiting, setWaiting] = useState(false)

  async function handleClick() {
    if (disabled || waiting) return
    const url = getGoogleOAuthStartUrl(returnTo, true)
    const popup = openCenteredPopup(url)
    if (!popup) {
      window.location.href = getGoogleOAuthStartUrl(returnTo, false)
      return
    }
    popup.focus()
    setWaiting(true)
    try {
      const result = await waitForGooglePopup(popup)
      if (result.token) {
        await onSuccess(result.token)
        return
      }
      if (result.signupToken) {
        await onSignup?.(result.signupToken)
        if (!onSignup) {
          onError?.(
            'Su cuenta de Google es nueva. Complete el registro para continuar.',
          )
        }
        return
      }
      onError?.(
        googleAuthErrorMessage(result.error) ??
          'No se pudo iniciar sesión con Google.',
      )
    } finally {
      setWaiting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="public-auth__google-btn"
        disabled={disabled || waiting}
        onClick={() => void handleClick()}
      >
        <GoogleMark />
        {waiting ? 'Esperando Google…' : label}
      </button>
      {waiting ? (
        <div className="public-auth__google-wait" role="status">
          Complete el acceso en la ventana de Google.
        </div>
      ) : null}
    </>
  )
}
