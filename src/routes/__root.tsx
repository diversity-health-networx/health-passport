/// <reference types="vite/client" />
import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
  Outlet, // 1. Import Outlet
} from '@tanstack/solid-router'
import { TanStackRouterDevtools } from '@tanstack/solid-router-devtools'
import { HydrationScript } from 'solid-js/web'
import type * as Solid from 'solid-js'
import { Show, createContext, useContext } from 'solid-js'
import { DefaultCatchBoundary } from '~/components/DefaultCatchBoundary'
import { NotFound } from '~/components/NotFound'
import appCss from '~/styles/app.css?url'
import { seo } from '~/utils/seo'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'

interface globalContext {
  auth: {
    user?: string;
    key?: CryptoKey;
    nonce?: string;
  };
}

export const globals: globalContext = { auth: {} };

const Context = createContext(globals);

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
    ],
    scripts: [
      { src: '/customScript.js', type: 'text/javascript' },
    ],
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  shellComponent: RootDocument,
  component: RootLayout, // 2. Add the component layout here
})

// 3. Define the RootLayout component to wrap the routing context
function RootLayout() {
  // Instantiating here runs once per request on SSR and once on client boot, 
  // keeping it isolated and completely safe from cross-user state leaks.
  const queryClient = new QueryClient()

  return (
    <Context.Provider value={Context.defaultValue}>
      <QueryClientProvider client={queryClient}>
        <Outlet />
        {/* Move the query devtools inside the provider so they can see the client too */}
        <SolidQueryDevtools buttonPosition="bottom-left" />
      </QueryClientProvider>
    </Context.Provider>
  )
}

function RootDocument({ children }: { children: Solid.JSX.Element }) {

  const globalContext = useContext(Context);

  return (
    <html>
      <head>
        <HydrationScript />
      </head>
      <body>
        <HeadContent />
        <div class="p-2 flex gap-4 text-sm mx-2">
          <Link to="/" activeProps={{ class: 'font-bold' }} activeOptions={{ exact: true }}>Home</Link>{' '}
          <Link to="/admin/lookup" activeProps={{ class: 'font-bold' }}>search</Link>{' '}
          <Show when={!globalContext.auth.user} fallback={
            <>
              <Link to="/admin/forms" class='ml-auto' activeProps={{ class: 'font-bold' }}>forms</Link>{' '}
              <Link to="/admin/lookup" activeProps={{ class: 'font-bold' }}>search</Link>{' '}
              <Link to="/admin/create" activeProps={{ class: 'font-bold' }}>create</Link>{' '}
              <Link to="/admin/settings" activeProps={{ class: 'font-bold' }}>settings</Link>{' '}
            </>
          }>
            <Link to="/admin/login" class='ml-auto' activeProps={{ class: 'font-bold' }}>login</Link>{' '}
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