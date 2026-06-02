import { createFileRoute, useNavigate, useRouter } from '@tanstack/solid-router'
import { createSignal, Show, onMount } from 'solid-js'
import { ErrorModal } from '~/components/ErrorModal' // Assuming this path based on your prompt

export const Route = createFileRoute('/admin/login')({
  validateSearch: (search: Record<string, unknown> | undefined) => {
    return {
      auth: (search?.auth as string | undefined) ?? undefined,
    }
  },
  component: AdminLogin,
})


function AdminLogin() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const router = useRouter()

  // Existing form signals
  const [email, setEmail] = createSignal('')
  const [status, setStatus] = createSignal<'idle' | 'sending' | 'success' | 'error' | 'verifying'>('idle')
  const [error, setError] = createSignal('')

  // New signals to control the ErrorModal
  const [isErrorModalOpen, setIsErrorModalOpen] = createSignal(false)
  const [modalErrorMessage, setModalErrorMessage] = createSignal('')

  // 2. Automatically trigger login verification if the magic link 'auth' parameter is detected
  onMount(async () => {
    const loginToken = search().auth
    if (search().auth) {
      setStatus('verifying')
      try {
        const response = await fetch(`/api/admin/login?auth=${loginToken}`, {
          method: 'POST',
        })

        if (!response.ok) {
          const err: {error: string} = await response.json()
          throw new Error(err.error || 'Failed to verify authentication token.')
        }

        // Success! Invalidate the router to update the auth context tree globally
        await router.invalidate()
        
        // Redirect to admin dashboard
        navigate({ to: '/admin/forms', replace: true })
      } catch (err) {
        setStatus('idle')
        // Trigger the error modal component
        setModalErrorMessage(err instanceof Error ? err.message : 'Invalid or expired magic link.')
        setIsErrorModalOpen(true)
        
        // Clean the URL so the user can easily try to log in normally again
        navigate({ to: '/admin/login', replace: true, search: {auth: undefined} })
      }
    }
  })

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

  // 3. Render a loading state if the component is busy verifying the magic link
  if (status() === 'verifying') {
    return (
      <div class="min-h-screen flex items-center justify-center p-4">
         <div class="text-center">
            <h2 class="text-xl font-semibold text-slate-900 mb-2">Verifying Login...</h2>
            <p class="text-slate-500">Please wait while we securely authenticate your session.</p>
         </div>
      </div>
    )
  }

  // 4. Default render (standard magic link request form)
  return (
    <div class="min-h-screen flex items-center justify-center p-4">
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

      {/* 5. Mount the ErrorModal to catch verification failures */}
      <ErrorModal
        isOpen={isErrorModalOpen()}
        title="Login Failed"
        message={modalErrorMessage()}
        onClose={() => setIsErrorModalOpen(false)}
      />
    </div>
  )
}