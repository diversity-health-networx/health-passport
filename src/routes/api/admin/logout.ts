import { createFileRoute } from '@tanstack/solid-router'
import { serialize } from 'cookie'

export const Route = createFileRoute('/api/admin/logout')({
  server: {
    handlers: {
      POST: async () => {
        // Invalidate the session cookie by setting its expiration date to the past
        const cookieHeader = serialize('admin', '', {
          httpOnly: true,
          secure: true,
          path: '/',
          expires: new Date(0), // Instantly expires the cookie
          sameSite: 'strict'
        })

        const headers = new Headers()
        headers.append('Set-Cookie', cookieHeader)

        return Response.json(
          { success: true, message: 'Logged out successfully.' }, 
          { headers }
        )
      },
    },
  },
})