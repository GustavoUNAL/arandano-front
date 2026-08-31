import { BRAND_NAME } from '../lib/brand'
import { PRIVACY_PAGE } from '../lib/legalContent'
import { SITE_EMAIL } from '../lib/siteContact'
import { getPrivacyUrl, getTermsUrl } from '../lib/authRoutes'

type Props = {
  identity: 'google' | 'email'
  acceptTerms: boolean
  acceptPrivacy: boolean
  disabled?: boolean
  onAcceptTerms: (value: boolean) => void
  onAcceptPrivacy: (value: boolean) => void
}

export function PublicLegalConsent({
  identity,
  acceptTerms,
  acceptPrivacy,
  disabled,
  onAcceptTerms,
  onAcceptPrivacy,
}: Props) {
  const identityLabel =
    identity === 'google'
      ? 'Identidad de Google (nombre y email)'
      : 'Nombre, email y contraseña'

  return (
    <>
      <section className="google-signup__legal" aria-labelledby="signup-legal-title">
        <header className="google-signup__legal-head">
          <h2 id="signup-legal-title">Acuerdo de tratamiento de datos</h2>
          <p>Actualizado el {PRIVACY_PAGE.updated}</p>
        </header>
        <p>
          Al crear su espacio, {BRAND_NAME} actuará como responsable del tratamiento de sus
          datos personales y de la información de su negocio, conforme a la Ley 1581 de 2012
          y demás normas aplicables en Colombia.
        </p>
        <ul>
          <li>
            <strong>Datos.</strong> {identityLabel}, nombre de la empresa e información
            operativa que cargue: ventas, inventario, citas, equipo y finanzas.
          </li>
          <li>
            <strong>Finalidad.</strong> Prestar el servicio, autenticar el acceso, dar soporte
            y cumplir obligaciones legales. No vendemos datos a terceros.
          </li>
          <li>
            <strong>Conservación y derechos.</strong> Los datos se conservan mientras la cuenta
            esté activa. Puede pedir acceso, corrección, actualización o eliminación en{' '}
            <a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>.
          </li>
        </ul>
      </section>

      <label className="google-signup__check">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => onAcceptTerms(e.target.checked)}
          disabled={disabled}
        />
        <span>
          Acepto los{' '}
          <a href={getTermsUrl()} target="_blank" rel="noreferrer">
            Términos y condiciones
          </a>
          .
        </span>
      </label>

      <label className="google-signup__check">
        <input
          type="checkbox"
          checked={acceptPrivacy}
          onChange={(e) => onAcceptPrivacy(e.target.checked)}
          disabled={disabled}
        />
        <span>
          Autorizo el tratamiento de mis datos personales según la{' '}
          <a href={getPrivacyUrl()} target="_blank" rel="noreferrer">
            Política de privacidad
          </a>{' '}
          y la Ley 1581 de 2012.
        </span>
      </label>
    </>
  )
}
