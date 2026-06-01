import { createFileRoute } from '@tanstack/solid-router'
import { createSignal, Show } from 'solid-js'

export const Route = createFileRoute('/admin/login')({
  component: AdminLogin,
})

function AdminLogin() {
  const [email, setEmail] = createSignal('')
  const [status, setStatus] = createSignal<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [error, setError] = createSignal('')

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setStatus('sending')
    setError('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email() }),
      })

      if (!response.ok) {
        const err = await response.json()
        if(err instanceof Error) {
          throw new Error(err.message || 'Failed to send magic link');
        }
      }

      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div class="bg-white border border-slate-200 rounded-lg shadow-sm p-8 max-w-md w-full">
        <h1 class="text-2xl font-bold text-slate-900 mb-2">Admin Login</h1>
        <p class="text-sm text-slate-500 mb-6">Enter your @dhnrx.com email to receive a magic link</p>

        <form onSubmit={handleSubmit} class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email()}
              onInput={e => setEmail(e.currentTarget.value)}
              placeholder="you@dhnrx.com"
              required
              class="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <Show when={status() === 'error'}>
            <p class="text-sm text-rose-600" role="alert">
              {error()}
            </p>
          </Show>

          <Show when={status() === 'success'}>
            <p class="text-sm text-emerald-600">Magic link sent! Check your email.</p>
          </Show>

          <button
            type="submit"
            disabled={status() === 'sending' || status() === 'success'}
            class="w-full bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {status() === 'sending' ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>
      </div>
    </div>
  )
}