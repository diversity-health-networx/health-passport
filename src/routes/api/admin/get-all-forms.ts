import { createFileRoute } from '@tanstack/solid-router'
import { env } from 'cloudflare:workers'

// Admin forms list - GET /api/admin/get-all-forms
export const Route = createFileRoute('/api/admin/get-all-forms')({
    server: {
        handlers: {
            GET: async () => {
                const db = env.DB
                const result = await db.prepare('SELECT * FROM forms ORDER BY created_at DESC').all()
                return Response.json(result.results || [])
            },
        },
    },
})
