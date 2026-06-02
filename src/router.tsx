import { createRouter } from '@tanstack/solid-router'
import { routeTree } from './routeTree.gen'
import { DefaultCatchBoundary } from './components/DefaultCatchBoundary'
import { NotFound } from './components/NotFound'
import type { AuthClientInfo } from '~/types/auth'

export interface RouterContext {
  auth: AuthClientInfo
}

export const routerContext: RouterContext = { auth: {} }

export function getRouter() {
  const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
    scrollRestoration: true,
    context: routerContext,
  })

  return router
}
