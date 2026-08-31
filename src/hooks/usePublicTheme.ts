import { useEffect, useState } from 'react'
import { persistTheme, readStoredTheme } from '../lib/themeColor'

/** Sincroniza tema claro/oscuro en landing, login y registro. */
export function usePublicTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(readStoredTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.dataset.shell = 'public'
    persistTheme(theme)
    return () => {
      delete document.documentElement.dataset.shell
    }
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggleTheme }
}
