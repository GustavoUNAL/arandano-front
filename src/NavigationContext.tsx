import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchNavigation,
  getApiBase,
  navigationSubtitleFor,
  type NavigationPayload,
} from './api'

type NavigationContextValue = {
  navigation: NavigationPayload | null
  loading: boolean
  error: string | null
  purchasesSubtitle: string | undefined
  inventorySubtitle: string | undefined
}

const NavigationContext = createContext<NavigationContextValue | null>(null)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [navigation, setNavigation] = useState<NavigationPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const base = getApiBase()
    setLoading(true)
    setError(null)
    fetchNavigation(base)
      .then((n) => {
        if (!cancelled) setNavigation(n)
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setNavigation(null)
          setError(e.message)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo((): NavigationContextValue => {
    return {
      navigation,
      loading,
      error,
      purchasesSubtitle: navigationSubtitleFor(navigation, 'purchases'),
      inventorySubtitle: navigationSubtitleFor(navigation, 'inventory'),
    }
  }, [navigation, loading, error])

  return (
    <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
  )
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext)
  if (!ctx) {
    throw new Error('useNavigation debe usarse dentro de NavigationProvider')
  }
  return ctx
}
