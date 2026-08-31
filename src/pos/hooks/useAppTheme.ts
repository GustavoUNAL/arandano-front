import { useEffect, useState } from 'react'

export type AppTheme = 'dark' | 'light'

function readTheme(): AppTheme {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

/** Sincroniza el POS con el interruptor de tema global (sidebar). */
export function useAppTheme(): AppTheme {
  const [theme, setTheme] = useState<AppTheme>(readTheme)

  useEffect(() => {
    const root = document.documentElement
    const obs = new MutationObserver(() => setTheme(readTheme()))
    obs.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  return theme
}
