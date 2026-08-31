const LAST_FIRST_NAME_KEY = 'vos_last_first_name'

export function firstName(fullName: string | null | undefined): string {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? []
  return parts[0] ?? ''
}

export function greetingWord(_date = new Date()): string {
  return 'Hola'
}

export function greetUser(fullName: string | null | undefined): string {
  const first = firstName(fullName)
  return first ? `Hola ${first}` : 'Hola'
}

export function namedCopy(
  fullName: string | null | undefined,
  withName: string,
  withoutName: string,
): string {
  const first = firstName(fullName)
  if (!first) return withoutName
  return withName.replaceAll('{name}', first)
}

export function rememberSignedInName(fullName: string | null | undefined): void {
  const first = firstName(fullName)
  try {
    if (first) window.localStorage.setItem(LAST_FIRST_NAME_KEY, first)
  } catch {
    /* ignore */
  }
}

export function readRememberedFirstName(): string {
  try {
    return window.localStorage.getItem(LAST_FIRST_NAME_KEY)?.trim() ?? ''
  } catch {
    return ''
  }
}
