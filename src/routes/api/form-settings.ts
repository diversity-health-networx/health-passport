import { createFileRoute } from '@tanstack/solid-router'
import { env } from 'cloudflare:workers'

// Form definition endpoint - GET /api/form-settings
export const Route = createFileRoute('/api/form-settings')({
    server: {
        handlers: {
            GET: async ({ params }) => {
                const id = params as Record<string,string>['id'] || undefined
                const db = env.DB

                if (id) {
                    const result = await db.prepare('SELECT * FROM forms WHERE id = ?').bind(id).first()
                    if (!result) return new Response(JSON.stringify({ error: 'Form not found' }), { status: 404 })
                    return Response.json({
                        id: result.id,
                        formName: result.name,
                        userIdConstraint: result.user_id_format,
                        allowOverwrite: result.allow_overwrite === 1,
                        submissionsExpiry: result.submissions_expiry,
                        fieldCollection: JSON.parse(result.questions_json as string),
                        questions_json: result.questions_json,
                    })
                }

                const name = params as Record<string,string>['name'] || undefined

                if (name) {
                    const result = await db.prepare('SELECT * FROM forms WHERE LOWER(name) = ?').bind(name.toLowerCase()).first()
                    if (!result) return new Response(JSON.stringify({ error: 'Form not found' }), { status: 404 })
                    return Response.json({
                        id: result.id,
                        formName: result.name,
                        userIdConstraint: result.user_id_format,
                        allowOverwrite: result.allow_overwrite === 1,
                        submissionsExpiry: result.submissions_expiry,
                        fieldCollection: JSON.parse(result.questions_json as string),
                        questions_json: result.questions_json,
                    })
                }

                return new Response(
                    JSON.stringify({ error: 'Either id or name is required' }),
                    {
                        status: 400,
                        headers: {
                            'Content-Type': 'application/javascript',
                        },
                    }
                )
            },
        },
    },
})
