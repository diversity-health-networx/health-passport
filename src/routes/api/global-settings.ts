import { createFileRoute } from '@tanstack/solid-router'
import { env } from 'cloudflare:workers'
import { GlobalSettingsRow } from '~/types/globalSettings'

// Get global settings - GET /api/global-settings
async function getGlobalSettings() {
    const db = env.DB
    const result = await db.prepare('SELECT key, value FROM globals').all<GlobalSettingsRow>()
    const settingsMap = Object.fromEntries(
        (result.results || []).map((row: { key: string, value: string }) => [row.key, row.value])
    )
    return Response.json(settingsMap)
}
// Update global settings - PATCH /api/global-settings
async function updateGlobalSettings({ request }: {request: Request<unknown, CfProperties<unknown>>}) {
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
}
export const Route = createFileRoute('/api/global-settings')({
    server: {
        handlers: {
            GET: getGlobalSettings,
            PATCH: updateGlobalSettings,
        },
    },
})
