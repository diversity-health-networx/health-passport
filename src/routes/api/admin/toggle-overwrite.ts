import { createFileRoute } from '@tanstack/solid-router'
import { env } from 'cloudflare:workers'

// Toggle overwrite setting - PATCH /api/admin/toggle-overwrite
export const Route = createFileRoute('/api/admin/toggle-overwrite')({
    server: {
        handlers: {
            PATCH: async ({ request }) => {
                const url = new URL(request.url)
                const id = url.searchParams.get('id')
                if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 })

                const body = (await request.json()) as { allowOverwrite: any }
                // @ts-ignore - DB is provided by Cloudflare Workers runtime
                const db = env.DB

                await db
                    .prepare('UPDATE forms SET allow_overwrite = ? WHERE id = ?')
                    .bind(body.allowOverwrite ? 1 : 0, id)
                    .run()

                return Response.json({ success: true })
            },
        },
    },
})