import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AuthUser } from '../api'
import { displayCompanyName } from '../lib/displayLabels'
import { greetUser } from '../lib/userIdentity'
import { BRAND_NAME } from '../lib/brand'

type Props = { user: AuthUser }

export function SessionWelcome({ user }: Props) {
  const [visible, setVisible] = useState(() => {
    try {
      const key = `vos_session_greet_v4_${user.sub}`
      if (window.sessionStorage.getItem(key)) return false
      window.sessionStorage.setItem(key, '1')
      return true
    } catch {
      return true
    }
  })
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!visible) return
    const timer = window.setTimeout(() => setLeaving(true), 4200)
    return () => window.clearTimeout(timer)
  }, [visible])

  useEffect(() => {
    if (!leaving) return
    const timer = window.setTimeout(() => setVisible(false), 280)
    return () => window.clearTimeout(timer)
  }, [leaving])

  if (!visible) return null

  const company = displayCompanyName(user.companyName)

  return createPortal(
    <aside
      className={`session-welcome${leaving ? ' session-welcome--out' : ''}`}
      role="status"
      aria-live="polite"
    >
      <p className="session-welcome__hello">{greetUser(user.name)}</p>
      <p className="session-welcome__sub">
        {company ? `De vuelta en ${company}.` : `De vuelta en ${BRAND_NAME}.`}
      </p>
      <button
        type="button"
        className="session-welcome__dismiss"
        onClick={() => setLeaving(true)}
        aria-label="Cerrar aviso"
      >
        ×
      </button>
    </aside>,
    document.body,
  )
}
