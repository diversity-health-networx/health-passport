import { env } from "cloudflare:workers"

export async function sendPosthogEvent(event: string, properties: Record<string, any>) {
  const apiKey = env.VITE_POSTHOG_KEY
  if (!apiKey) return

  try {
    await fetch('https://app.posthog.com/capture/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        event: event,
        properties: properties,
        timestamp: new Date().toISOString(),
      }),
    })
  } catch (error) {
    console.warn('Failed to send PostHog event:', error)
  }
}