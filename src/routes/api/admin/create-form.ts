import { createFileRoute } from '@tanstack/solid-router'
import { env } from 'cloudflare:workers'
import { uuid_generate_v7 } from 'uuidv7-isomorphic'

// Create form - POST /api/admin/create-form
export const Route = createFileRoute('/api/admin/create-form')({
    server: {
        handlers: {
            POST: async ({ request }) => {
                const body = await request.json() as Record<string,string>
                // @ts-ignore - DB is provided by Cloudflare Workers runtime
                const db = env.DB
                const formId = uuid_generate_v7()
                const now = Math.floor(Date.now() / 1000)

                await db
                    .prepare(
                        'INSERT INTO forms (id, name, user_id_format, allow_overwrite, submissions_expiry, questions_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
                    )
                    .bind(formId, body.formName, body.userIdConstraint || 'user_id', body.allowOverwrite ? 1 : 0, body.submissionsExpiry || null, JSON.stringify(body.fieldCollection), now)
                    .run()

                return Response.json({ id: formId })
            },
        },
    },
})
