import type { MouseEvent } from 'react'

type Props = {
  loginUrl: string
  onLogin?: (e: MouseEvent<HTMLAnchorElement>) => void
}

export function LandingFinalCtaSection({ loginUrl, onLogin }: Props) {
  return (
    <section className="attio-cta-final" aria-labelledby="final-cta-title">
      <div className="attio-container">
        <div className="attio-frame attio-cta-final__grid">
          <div className="attio-cta-final__copy">
            <h2 id="final-cta-title">Empiece a construir una operación más inteligente.</h2>
            <p className="lp-final__lead">
              Centralice la información de su negocio y construya las bases para tomar
              mejores decisiones.
            </p>
            <div className="attio-cta-final__actions">
              <a className="attio-btn attio-btn--outline" href={loginUrl} onClick={onLogin}>
                Acceder
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
