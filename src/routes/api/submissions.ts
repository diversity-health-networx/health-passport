import { createFileRoute } from '@tanstack/solid-router'
import { env } from 'cloudflare:workers'
import { uuid_generate_v7 } from 'uuidv7-isomorphic'
import { SubmissionRequestBody } from '~/types/form'
import { sendPosthogEvent } from '~/utils/posthog'
import { FormRow } from '~/types/tables'

// Create submission - POST /api/submissions
export const Route = createFileRoute('/api/submissions')({
    server: {
        handlers: {
            POST: async ({ request }) => {
                const url = new URL(request.url)
                const forceOverwrite = url.searchParams.get('force') === 'true'
                const body = await request.json() as SubmissionRequestBody
                const db = env.DB

                // Track submission attempt
                await sendPosthogEvent('form_submission_attempt', {
                    form_id: body.formId,
                    user_id: body.userId,
                    form_name: body.formName,
                })

                // Check global submissions kill switch
                const globalSetting = await db.prepare(
                    "SELECT value FROM globals WHERE key = 'submissions_global_enabled'"
                ).first()

                if (globalSetting?.value === 'false') {
                    await sendPosthogEvent('form_submission_rejected', {
                        form_id: body.formId,
                        user_id: body.userId,
                        reason: 'GLOBAL_SUBMISSIONS_DISABLED',
                    })
                    return new Response(JSON.stringify({
                        error: 'GLOBAL_SUBMISSIONS_DISABLED',
                        message: 'Form submissions are temporarily disabled globally.'
                    }), { status: 503 })
                }

                // Check individual form expiry
                const formRow = await db.prepare('SELECT allow_overwrite, submissions_expiry FROM forms WHERE id = ?')
                    .bind(body.formId).first<Partial<FormRow>>()
                if (!formRow) {
                    await sendPosthogEvent('form_submission_rejected', {
                        form_id: body.formId,
                        user_id: body.userId,
                        reason: 'FORM_NOT_FOUND',
                    })
                    return new Response(JSON.stringify({ error: 'Form not found' }), { status: 404 })
                }

                // Check if form has expired
                if (formRow.submissions_expiry && formRow.submissions_expiry <= Math.floor(Date.now() / 1000)) {
                    await sendPosthogEvent('form_submission_rejected', {
                        form_id: body.formId,
                        user_id: body.userId,
                        reason: 'FORM_EXPIRED',
                    })
                    return new Response(JSON.stringify({
                        error: 'FORM_EXPIRED',
                        message: 'This form is no longer accepting submissions as it has expired.'
                    }), { status: 503 })
                }

                // Check for existing submission
                const existingSubmission = await db
                    .prepare('SELECT id FROM submissions WHERE form_id = ? AND user_id = ?')
                    .bind(body.formId, body.userId)
                    .first()

                if (existingSubmission) {
                    if (formRow.allow_overwrite === 0 && !forceOverwrite) {
                        await sendPosthogEvent('form_submission_rejected', {
                            form_id: body.formId,
                            user_id: body.userId,
                            reason: 'OVERWRITE_WARNING_REQUIRED',
                        })
                        return new Response(
                            JSON.stringify({
                                error: 'OVERWRITE_WARNING_REQUIRED',
                                message: 'Pre-existing submission detected. Would you like to overwrite it?',
                            }),
                            { status: 409 }
                        )
                    }

                    // Update existing submission
                    const now = Math.floor(Date.now() / 1000)
                    await db
                        .prepare(
                            'UPDATE submissions SET answers_json = ?, submitted_at = ? WHERE form_id = ? AND user_id = ?'
                        )
                        .bind(JSON.stringify(body.answers), now, body.formId, body.userId)
                        .run()

                    await sendPosthogEvent('form_submission_accepted', {
                        form_id: body.formId,
                        user_id: body.userId,
                        status: 'updated',
                    })

                    return Response.json({ success: true, updated: true })
                }

                // Create new submission
                const submissionId = uuid_generate_v7()
                const now = Math.floor(Date.now() / 1000)

                await db
                    .prepare(
                        'INSERT INTO submissions (id, form_id, form_name, user_id, answers_json, submitted_at) VALUES (?, ?, ?, ?, ?, ?)'
                    )
                    .bind(submissionId, body.formId, body.formName, body.userId, JSON.stringify(body.answers), now)
                    .run()

                await sendPosthogEvent('form_submission_accepted', {
                    form_id: body.formId,
                    user_id: body.userId,
                    status: 'created',
                    submission_id: submissionId,
                })

                return Response.json({ id: submissionId })
            },
        },
    },
})