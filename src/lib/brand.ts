/** Marca VOS IA — vos-ia.com */
export const BRAND_NAME =
  (import.meta.env.VITE_BRAND_NAME as string | undefined)?.trim() || 'VOS IA'

export const SITE_DOMAIN = 'vos-ia.com'
export const SITE_ORIGIN = `https://${SITE_DOMAIN}`

export const BRAND_TAGLINE =
  (import.meta.env.VITE_BRAND_TAGLINE as string | undefined)?.trim() ||
  'Agentes inteligentes para empresas y profesionales.'

export const BRAND_LOGIN_TITLE = `Iniciar sesión · ${BRAND_NAME}`
