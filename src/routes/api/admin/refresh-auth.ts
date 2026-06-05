import { createFileRoute } from '@tanstack/solid-router'
import { env } from 'cloudflare:workers'
import { serialize } from 'cookie'
import { verifyAdminAuthToken, sealAdminAuthToken } from '~/utils/auth'

export const Route = createFileRoute('/api/admin/refresh-auth')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // @ts-ignore - env is provided by Cloudflare Workers runtime
        const appSecret = env.MAGIC_LINK_SECRET

        const url = new URL(request.url)
        const cookieHeader = request.headers.get('cookie') || ''

        // Extract the auth cookie value
        const authCookie = cookieHeader
          .split(';')
          .find((c) => c.trim().startsWith('auth='))
          ?.split('=')[1]

        let user: string | undefined
        let role: 'admin' | undefined

        if (authCookie) {
          const email = await verifyAdminAuthToken(authCookie, appSecret)
          if (email) {
            user = email
            role = 'admin'
          }
        }

        const headers = new Headers()

        // If valid, issue a fresh session cookie
        if (user) {
          const freshToken = await sealAdminAuthToken(user, appSecret, '24hr')
          headers.append(
            'Set-Cookie',
            serialize('auth', freshToken, {
              httpOnly: true,
              secure: true,
              path: '/',
              maxAge: 604800, // 1 week (in seconds)
              sameSite: 'strict',
            })
          )
        } else {
          // Clear stale/invalid cookie
          headers.append(
            'Set-Cookie',
            serialize('auth', '', {
              httpOnly: true,
              secure: true,
              path: '/',
              expires: new Date(0),
              sameSite: 'strict',
            })
          )
        }

        return Response.json(
          { success: true, user, role },
          { headers }
        )
      },
    },
  },
})
