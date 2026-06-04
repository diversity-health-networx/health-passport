import { createFileRoute } from '@tanstack/solid-router'
import { env } from 'cloudflare:workers'
import { SubmissionRow } from '~/types/tables'

// Email CSV report - POST /api/admin/email-csv-report
export const Route = createFileRoute('/api/admin/email-csv-report')({
    server: {
        handlers: {
            POST: async ({ request }) => {
                const body = (await request.json()) as Record<string, any>
                const { formId, targetEmail } = body

                if (!formId || !targetEmail) {
                    return Response.json({ error: 'Missing formId or targetEmail' }, { status: 400 })
                }

                // @ts-ignore - DB is provided by Cloudflare Workers runtime
                // Fallback to env.DB if globalThis is not populated
                const db = env.DB || env.env?.DB

                // 1. Fetch form definition to construct CSV headers
                const formRecord = await db
                    .prepare('SELECT name, questions_json FROM forms WHERE id = ?')
                    .bind(formId)
                    .first<{ name: string; questions_json: string }>()

                if (!formRecord) {
                    return Response.json({ error: 'Requested form not found' }, { status: 404 })
                }

                const parsedFields = JSON.parse(formRecord.questions_json || '[]')
                const headers = [
                    'Submission UUIDv7',
                    'User ID',
                    'Decoded Timestamp',
                    ...parsedFields.map((f: any) => `"${(f.displayLabel || 'Untitled Question').replace(/"/g, '""')}"`),
                ]

                // 2. Fetch all submissions matching the form_id
                const submissionsData = await db
                    .prepare('SELECT * FROM submissions WHERE form_id = ? ORDER BY submitted_at DESC')
                    .bind(formId)
                    .all<SubmissionRow>()
                const records = submissionsData.results || []

                if (records.length === 0) {
                    return Response.json({ error: 'No submissions found to export' }, { status: 400 })
                }

                // 3. Compile the CSV string payload
                const rowMatrix = [headers.join(',')]
                for (const record of records) {
                    const responses = JSON.parse(record.answers_json || '{}')
                    const timeString = new Date(record.submitted_at * 1000).toISOString()

                    const matchingRow = [
                        `"${record.id}"`,
                        `"${record.user_id}"`,
                        `"${timeString}"`,
                        // 4. We strictly use the unique machineSlug to pull the correct answer from the JSON, 
                        // but the slug itself is never printed in the CSV output.
                        ...parsedFields.map(
                            (f: any) => `"${String(responses[f.machineSlug] ?? '').replace(/"/g, '""')}"`
                        ),
                    ]
                    rowMatrix.push(matchingRow.join(','))
                }

                const csvString = rowMatrix.join('\n')
                const encoder = new TextEncoder()
                const csvBase64 = btoa(String.fromCharCode(...encoder.encode(csvString)))


                // 4. Send email with attached CSV via Postmark API
                // Note: Ensure POSTMARK_SERVER_TOKEN is available in your scope
                const postmarkToken =
                    env?.POSTMARK_SERVER_TOKEN || process.env.POSTMARK_SERVER_TOKEN

                const postmarkResponse = await fetch('https://api.postmarkapp.com/email', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-Postmark-Server-Token': postmarkToken,
                    },
                    body: JSON.stringify({
                        From: 'security@dhnrx.com', // Replace with your registered Postmark sender signature
                        To: targetEmail,
                        Subject: `Data Export: ${formRecord.name}`,
                        HtmlBody: `<p>Please find attached the exported submission records for form <strong>${formRecord.name}</strong>.</p>`,
                        MessageStream: 'outbound',
                        Attachments: [
                            {
                                Name: `submissions_${formRecord.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`,
                                Content: csvBase64,
                                ContentType: 'text/csv',
                            },
                        ],
                    }),
                })

                if (!postmarkResponse.ok) {
                    return Response.json(
                        { error: 'Failed to dispatch CSV email via Postmark gateway.' },
                        { status: 500 }
                    )
                }

                return Response.json({ success: true })
            },
        },
    },
})