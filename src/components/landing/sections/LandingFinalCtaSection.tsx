import type { MouseEvent } from 'react'

type Props = {
  accessUrl: string
  onAccess?: (e: MouseEvent<HTMLAnchorElement>) => void
}

export function LandingFinalCtaSection({ accessUrl, onAccess }: Props) {
  return (
    <section className="attio-cta-final" aria-labelledby="final-cta-title">
      <div className="attio-container">
        <div className="attio-frame attio-cta-final__grid">
          <div className="attio-cta-final__copy">
            <h2 id="final-cta-title">Empieza a construir una operación más inteligente.</h2>
            <p className="lp-final__lead">
              Centraliza la información de tu negocio y construye las bases para tomar
              mejores decisiones.
            </p>
            <div className="attio-cta-final__actions">
              <a className="attio-btn attio-btn--primary attio-btn--hero" href={accessUrl} onClick={onAccess}>
                Conocer VOS-AI
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
