import { createContext, useContext } from 'react'
import type { AuthUser } from '../api'
import { firstName } from '../lib/userIdentity'

export const SessionUserContext = createContext<AuthUser | null>(null)

export function useSessionUser(): AuthUser | null {
  return useContext(SessionUserContext)
}

export function useFirstName(): string {
  return firstName(useSessionUser()?.name)
}
