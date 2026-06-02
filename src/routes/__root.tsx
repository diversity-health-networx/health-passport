/// <reference types="vite/client" />
import {
  HeadContent,
  Link,
  Scripts,
  Outlet,
  createRootRoute,
  useNavigate,
  useRouter,
} from '@tanstack/solid-router'
import { TanStackRouterDevtools } from '@tanstack/solid-router-devtools'
import { HydrationScript } from 'solid-js/web'
import type * as Solid from 'solid-js'
import { Show, onMount } from 'solid-js'
import { DefaultCatchBoundary } from '~/components/DefaultCatchBoundary'
import { NotFound } from '~/components/NotFound'
import appCss from '~/styles/app.css?url'
import { seo } from '~/utils/seo'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { getAuth, setAuthState } from '~/utils/authStore'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ...seo({
        title: 'DHN Health Passport',
        description: `Health Passport is an online survey platform for admin and participant use`,
      }),
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
      { rel: 'manifest', href: '/site.webmanifest', color: '#fffff' },
      { rel: 'icon', href: '/favicon.ico' },
    ]
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  shellComponent: RootDocument,
  component: RootLayout,
})

// RootLayout renders the router outlet and query client providers.
function RootLayout() {
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <SolidQueryDevtools buttonPosition="bottom-left" />
    </QueryClientProvider>
  )
}

// Shell document: header, logout handler, and page content.
function RootDocument({ children }: { children: Solid.JSX.Element }) {
  const router = useRouter() as any
  const navigate = useNavigate()

  // Restore auth from cookie on mount so the shell reacts to session state.
  onMount(async () => {
    try {
      const response = await fetch('/api/admin/refresh-auth', {
        method: 'POST',
        credentials: 'include',
      })
      if (response.ok) {
        const data = (await response.json()) as { success: boolean; user?: string; role?: string }
        if (data.user && data.role) {
          setAuthState({ user: data.user, role: data.role as 'admin' })
        }
      }
    } catch {
      // ignore
    }
  })

  async function logout(e: MouseEvent) {
    e.preventDefault()

    const res = await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'include',
    })

    if (!res.ok) {
      console.error('Logout failed')
      return
    }

    // Clear auth state
    setAuthState({})

    navigate({ to: '/admin/login', search: { auth: undefined } })
  }

  const isAdmin = () => !!getAuth().user

  return (
    <html>
      <head>
        <HydrationScript />
      </head>
      <body>
        <HeadContent />
        <div class="p-2 flex gap-4 text-sm mx-2">
          <Link to="/" activeProps={{ class: 'font-bold' }} activeOptions={{ exact: true }}>Home</Link>
          <Link to="/admin/lookup" activeProps={{ class: 'font-bold' }}>search</Link>
          <Show when={!isAdmin()} fallback={
            <>
              <Link to="/admin/forms" class='ml-auto' activeProps={{ class: 'font-bold' }}>forms</Link>
              <Link to="/admin/lookup" class='ml-auto' activeProps={{ class: 'font-bold' }}>search</Link>
              <Link to="/admin/create" class='ml-auto' activeProps={{ class: 'font-bold' }}>create</Link>
              <Link to="/admin/settings" class='ml-auto' activeProps={{ class: 'font-bold' }}>settings</Link>
            </>
          }>
            <Link to="/admin/login" class='ml-auto' activeProps={{ class: 'font-bold' }} search={{auth: undefined}}>login</Link>
          </Show>
        </div>
        <hr />
        {children}
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  )
}
