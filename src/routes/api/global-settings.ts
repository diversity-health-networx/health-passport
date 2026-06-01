import { createFileRoute } from '@tanstack/solid-router'
import { env } from 'cloudflare:workers'
import { GlobalSettingsRow } from '~/types/globalSettings'

// Get global settings - GET /api/global-settings
// Update global settings - PATCH /api/global-settings
export const Route = createFileRoute('/api/global-settings')({
    server: {
        handlers: {
            GET: async () => {
                const db = env.DB
                const result = await db.prepare('SELECT key, value FROM globals').all<GlobalSettingsRow>()
                const settingsMap = Object.fromEntries(
                    (result.results || []).map((row: { key: string, value: string }) => [row.key, row.value])
                )
                return Response.json(settingsMap)
            },
            PATCH: async ({ request }) => {
                const url = new URL(request.url)
                const body = await request.json() as Object
                const db = env.DB

                for (const [key, value] of Object.entries(body)) {
                    await db
                        .prepare(`
                          INSERT INTO globals (key, value) VALUES (?, ?)
                          ON CONFLICT(key) DO UPDATE SET value = ?
                        `)
                        .bind(key, String(value), String(value))
                        .run()
                }

                return Response.json({ success: true })
            },
        },
    },
})
