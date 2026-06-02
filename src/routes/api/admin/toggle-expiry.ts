import { createFileRoute } from '@tanstack/solid-router'
import { env } from 'cloudflare:workers'

// Toggle expiry setting - PATCH /api/admin/toggle-expiry
export const Route = createFileRoute('/api/admin/toggle-expiry')({
    server: {
        handlers: {
            PATCH: async ({ request }) => {
                const url = new URL(request.url)
                  const id = url.searchParams.get('id')
                  if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 })
                
                  const body = await request.json() as { submissionsExpiry: number }
                  // @ts-ignore - DB is provided by Cloudflare Workers runtime
                  const db = env.DB
                
                  await db
                    .prepare('UPDATE forms SET submissions_expiry = ? WHERE id = ?')
                    .bind(body.submissionsExpiry || null, id)
                    .run()
                
                  return Response.json({ success: true })
            },
        },
    },
})
