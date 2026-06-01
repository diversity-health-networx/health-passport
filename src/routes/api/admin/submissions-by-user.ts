import { createFileRoute } from '@tanstack/solid-router'
import { env } from 'cloudflare:workers'

// Lookup submissions by user - GET /api/admin/submissions-by-user
export const Route = createFileRoute('/api/admin/submissions-by-user')({
    server: {
        handlers: {
            GET: async ({ request }) => {
                const url = new URL(request.url)
                const userId = url.searchParams.get('user_id')
                if (!userId) return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400 })

                // @ts-ignore - DB is provided by Cloudflare Workers runtime
                const db = env.DB
                const result = await db
                    .prepare('SELECT * FROM submissions WHERE user_id = ? ORDER BY submitted_at DESC')
                    .bind(userId)
                    .all()

                return Response.json(result.results || [])
            },
        },
    },
})
