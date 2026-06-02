import { createSignal } from 'solid-js'
import type { AuthClientInfo } from '~/types/auth'

const [auth, setAuth] = createSignal<AuthClientInfo>({})

export function getAuth(): AuthClientInfo {
  return auth()
}

export function setAuthState(state: AuthClientInfo) {
  setAuth(state)
}
