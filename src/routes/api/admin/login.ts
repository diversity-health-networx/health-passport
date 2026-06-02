import { createFileRoute } from '@tanstack/solid-router'
import { env } from 'cloudflare:workers'
import { serialize } from 'cookie' // Import the cookie library
// Adjust this import path to match where your auth.ts file is located
import { 
  checkDomainClearance, 
  sealAdminAuthToken, 
  verifyAdminAuthToken, 
  dispatchMagicLinkEmail 
} from '~/utils/auth' 

export const Route = createFileRoute('/api/admin/login')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url)
        const authParam = url.searchParams.get('auth')
        
        // @ts-ignore - DB/env is provided by Cloudflare Workers runtime
        const appSecret = env.MAGIC_LINK_SECRET
        // @ts-ignore
        const postmarkKey = env.POSTMARK_SERVER_TOKEN

        // ====================================================================
        // TASK 1: Auth token is present -> Verify and set secure cookie
        // ====================================================================
        if (authParam) {
          const validEmail = await verifyAdminAuthToken(authParam, appSecret)
          
          if (!validEmail) {
            return Response.json(
              { error: 'Invalid or expired authorization token.' }, 
              { status: 401 }
            )
          }

          // Token is valid. We generate a fresh token to act as the session cookie.
          const sessionToken = await sealAdminAuthToken(validEmail, appSecret)

          // Use the cookie library to securely serialize the cookie options
          const cookieHeader = serialize('auth', sessionToken, {
            httpOnly: true,
            secure: true, // Requires HTTPS
            path: '/',
            maxAge: 28800, // 8 hours (in seconds)
            sameSite: 'strict'
          })

          const headers = new Headers()
          headers.append('Set-Cookie', cookieHeader)

          return Response.json({ success: true, email: validEmail }, { headers })
        } 
        
        // ====================================================================
        // TASK 2: No auth param -> Validate domain and send Magic Link
        // ====================================================================
        else {
          const body = await request.json() as { email?: string }
          
          if (!body.email) {
            return Response.json({ error: 'Email address is required.' }, { status: 400 })
          }

          // Check against the permitted domain configured in auth.ts
          if (!checkDomainClearance(body.email)) {
            return Response.json({ error: 'Unauthorized email domain.' }, { status: 403 })
          }

          try {
            // Seal a temporary token for the magic link
            const token = await sealAdminAuthToken(body.email, appSecret)
            
            // Construct the verification URL that the user will click in their email
            // Note: This uses the current url and adds the authenticated query param
            const targetUrl = `${url.origin}/admin/login?auth=${token}`

            await dispatchMagicLinkEmail(env.MAGIC_LINK_EMAIL, body.email, targetUrl, postmarkKey)

            return Response.json({ 
              success: true, 
              message: 'Authorization link dispatched.' 
            })
          } catch (error) {
            return Response.json(
              { error: 'Failed to dispatch the authorization email.' }, 
              { status: 500 }
            )
          }
        }
      },
    },
  },
})