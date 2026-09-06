import { useEffect, useState } from 'react'
import { persistTheme, THEME_STORAGE_KEY, setThemeColor } from '../lib/themeColor'

/** Sincroniza tema claro/oscuro en landing, login y registro. */
export function usePublicTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
      if (stored === 'dark' || stored === 'light') return stored
    } catch {
      /* ignore */
    }
    return 'dark'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.dataset.shell = 'public'
    persistTheme(theme)
    setThemeColor(theme === 'dark' ? '#010409' : '#ffffff')
    return () => {
      delete document.documentElement.dataset.shell
    }
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggleTheme }
}
