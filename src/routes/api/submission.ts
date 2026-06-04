import { createFileRoute } from '@tanstack/solid-router'
import { env } from 'cloudflare:workers'
import { FormField, SubmissionResponse } from '~/types/form'

// Get single submission with FormField schema - GET /api/admin/get-submission?id={uuid}
export const Route = createFileRoute('/api/submission')({
    server: {
        handlers: {
            GET: async ({ request, params }) => {
                const url = new URL(request.url)
                const submissionId = url.searchParams.get('id')

                if (!submissionId) {
                    return Response.json({ error: 'Submission ID parameter is required' }, { status: 400 })
                }

                const db = env.DB

                // Efficiently join the submissions and forms tables to fetch the answers and schema together
                const result = await db.prepare(`
                    SELECT 
                        s.id AS submission_id,
                        s.user_id,
                        s.submitted_at,
                        s.answers_json,
                        f.questions_json
                    FROM submissions s
                    JOIN forms f ON s.form_id = f.id
                    WHERE s.id = ?
                `).bind(submissionId).first<{
                    submission_id: string
                    user_id: string
                    submitted_at: number
                    answers_json: string
                    questions_json: string
                }>()

                if (!result) {
                    return Response.json({ error: 'Submission not found' }, { status: 404 })
                }

                // Parse the stored JSON strings safely back into usable objects
                const formFields = JSON.parse(result.questions_json || '[]') as FormField[]
                const submissionAnswers = JSON.parse(result.answers_json || '{}') as Record<string, any>

                return Response.json({
                    id: result.submission_id,
                    userId: result.user_id,
                    submittedAt: result.submitted_at,
                    fields: formFields,
                    answers: submissionAnswers
                } as SubmissionResponse)
            },
        },
    },
})