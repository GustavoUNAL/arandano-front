import type { MouseEvent } from 'react'
import { BRAND_NAME } from '../../../lib/brand'

type Props = {
  accessUrl: string
  onAccess?: (e: MouseEvent<HTMLAnchorElement>) => void
  onDemo?: () => void
}

export function LandingFinalCtaSection({ accessUrl, onAccess, onDemo }: Props) {
  return (
    <section className="attio-cta-final" aria-labelledby="final-cta-title">
      <div className="attio-container">
        <div className="attio-frame attio-cta-final__grid">
          <div className="attio-cta-final__copy">
            <h2 id="final-cta-title">
              Conecta. Automatiza. Escala. <em>La inteligencia que trabaja contigo.</em>
            </h2>
            <div className="attio-cta-final__actions">
              <a className="attio-btn attio-btn--primary" href={accessUrl} onClick={onAccess}>
                Registrarse
              </a>
              <button type="button" className="attio-btn attio-btn--outline" onClick={onDemo}>
                Ver demostración
              </button>
            </div>
          </div>
          <div className="attio-cta-final__art" aria-hidden />
        </div>
      </div>
      <span className="sr-only">{BRAND_NAME}</span>
    </section>
  )
}
