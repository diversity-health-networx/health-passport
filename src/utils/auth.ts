import { SignJWT, jwtVerify } from 'jose'

const PERMITTED_DOMAIN = '@dhnrx.com'

export function checkDomainClearance(email: string): boolean {
  return email.toLowerCase().endsWith(PERMITTED_DOMAIN)
}

export async function sealAdminAuthToken(email: string, appSecret: string): Promise<string> {
  const secretBuffer = new TextEncoder().encode(appSecret)
  return await new SignJWT({ context: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(email.toLowerCase())
    .setIssuedAt()
    .setExpirationTime('15m')
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
      From: 'security@dhnrx.com',
      To: email,
      Subject: 'Health Passport Access Authorization Key',
      HtmlBody: `<p>Click below to authorize your device session. This secure validation token is valid for 15 minutes.</p><a href="${targetUrl}"><strong>Authorize Access</strong></a>`,
      MessageStream: 'outbound',
    }),
  })

  if (!response.ok) {
    throw new Error('Postmark API transactional delivery breakdown.')
  }
}