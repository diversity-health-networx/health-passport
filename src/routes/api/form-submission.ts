import { createFileRoute } from '@tanstack/solid-router'
import { env } from 'cloudflare:workers'
import { SubmissionRow } from '~/types/tables'

// Get form submissions - GET /api/admin/form-submissions
export const Route = createFileRoute('/api/form-submission')({
    server: {
        handlers: {
            GET: async ({ request }) => {
                const url = new URL(request.url)
                const formId = url.searchParams.get('form_id')
                if (!formId) return new Response(JSON.stringify({ error: 'Missing form_id' }), { status: 400 })

                // @ts-ignore - DB is provided by Cloudflare Workers runtime
                const db = env.DB
                const result = await db
                    .prepare('SELECT * FROM submissions WHERE form_id = ? ORDER BY submitted_at DESC')
                    .bind(formId)
                    .all<SubmissionRow>()

                return Response.json(result.results || [])
            },
        },
    },
})
