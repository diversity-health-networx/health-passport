import { SignJWT, jwtVerify } from 'jose'

const PERMITTED_DOMAIN = '@dhnrx.com'

export function checkDomainClearance(email: string): boolean {
  return email.toLowerCase().endsWith(PERMITTED_DOMAIN)
}
/**
 * Creates and signs an admin authentication token using `jose`'s `SignJWT`.
 *
 * The token includes:
 * - `context: "admin"` in the payload
 * - `HS256` protected header
 * - the user's email as the JWT subject
 * - issued‑at timestamp
 * - an expiration time (defaults to 15 minutes)
 *
 * @param email The admin user's email. Stored as the JWT subject in lowercase.
 * @param appSecret The application secret used to sign the token (HS256).
 * @param duration Optional expiration value passed directly to
 * `SignJWT.setExpirationTime`.  
 * Supports the same formats as jose (e.g., `"15m"`, `"2h"`, numeric seconds, or a `Date`).
 *
 * @returns A signed JWT string.
 *
 * @see SignJWT#setExpirationTime
 * @see https://github.com/panva/jose/blob/main/docs/classes/jwt_sign.SignJWT.md#setexpirationtime
 */
export async function sealAdminAuthToken(email: string, appSecret: string, duration?: string | number | Date): Promise<string> {
  const secretBuffer = new TextEncoder().encode(appSecret)
  return await new SignJWT({ context: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(email.toLowerCase())
    .setIssuedAt()
    .setExpirationTime(duration || '15m')
    .sign(secretBuffer)
}

export async function verifyAdminAuthToken(token: string, appSecret: string): Promise<string | null> {
  try {
    const secretBuffer = new TextEncoder().encode(appSecret)
    const { payload } = await jwtVerify(token, secretBuffer, { algorithms: ['HS256'] })
    if (payload.context !== 'admin' || !payload.sub) return null
    return payload.sub
  } catch {
    return null
  }
}

export async function dispatchMagicLinkEmail(
  from: string | undefined,
  email: string,
  targetUrl: string,
  postmarkKey: string
): Promise<void> {
  const endpoint = 'https://api.postmarkapp.com/email'
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': postmarkKey,
    },
    body: JSON.stringify({
      From: from || 'security@dhnrx.com',
      To: email,
      Subject: 'Health Passport Access Authorization Key',
      HtmlBody: `<p>Visit the Authorization link to authorize your device session. This link is valid for 15 minutes.</p><a href="${targetUrl}"><strong>Authorize Access</strong></a><br/><p>${targetUrl}</p>`,
      TextBody: `Visit the Authorization link to authorize your device session. This link is valid for 15 minutes. \n {targetUrl}`,
      MessageStream: 'outbound',
    }),
  })

  if (!response.ok) {
    throw new Error('Postmark API transactional delivery breakdown.')
  }
}