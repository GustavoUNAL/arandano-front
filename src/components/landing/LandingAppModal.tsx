import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AppLauncherIcon } from '../AppLauncherIcon'
import { LANDING_APP_STATUS, type LandingApp } from './landingApps'

export function LandingAppModal({
  app,
  onClose,
}: {
  app: LandingApp
  onClose: () => void
}) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const shell = document.querySelector('.lp-gh.public-shell') as HTMLElement | null
    const prevOverflow = shell?.style.overflowY ?? ''
    const prevFocus = document.activeElement as HTMLElement | null
    if (shell) shell.style.overflowY = 'hidden'
    closeRef.current?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (shell) shell.style.overflowY = prevOverflow
      prevFocus?.focus()
    }
  }, [app, onClose])

  return createPortal(
    <div className="lp-cap-modal" role="presentation" onClick={onClose}>
      <div
        className="lp-cap-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lp-cap-modal__top">
          <span className="lp-cap-modal__icon" aria-hidden>
            <AppLauncherIcon view={app.view} />
          </span>
          <p className={`lp-cap-modal__status lp-cap--${app.status}`}>
            {LANDING_APP_STATUS[app.status]}
          </p>
        </div>
        <h3 id={titleId}>{app.name}</h3>
        <p className="lp-cap-modal__text">{app.text}</p>
        <p className="lp-cap-modal__from">{app.from}</p>
        <button
          ref={closeRef}
          type="button"
          className="attio-btn attio-btn--outline lp-cap-modal__close"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>,
    document.body,
  )
}
