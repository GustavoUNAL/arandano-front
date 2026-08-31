const LAST_FIRST_NAME_KEY = 'vos_last_first_name'

export function firstName(fullName: string | null | undefined): string {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? []
  return parts[0] ?? ''
}

export function greetingWord(date = new Date()): string {
  const hour = date.getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export function greetUser(fullName: string | null | undefined, date = new Date()): string {
  const first = firstName(fullName)
  const hello = greetingWord(date)
  return first ? `${hello}, ${first}` : hello
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
