import { createFileRoute } from '@tanstack/solid-router'
import { createSignal, For, Show } from 'solid-js'
import { createQuery } from '@tanstack/solid-query'
import { extractTimestampFromUUIDv7 } from '../utils/uuid'

export const Route = createFileRoute('/admin/lookup')({
  component: UserSubmissionCrossLookup,
})

function UserSubmissionCrossLookup() {
  const [searchQuery, setSearchQuery] = createSignal('')
  const [submittedQuery, setSubmittedQuery] = createSignal('')

  const matchesQuery = createQuery(() => ({
    queryKey: ['user-submissions', submittedQuery()],
    queryFn: async (): Promise<any[]> => {
      if (!submittedQuery()) return []
      const response = await fetch(`/api/admin/lookup-by-user?user_id=${encodeURIComponent(submittedQuery())}`)
      if (!response.ok) return []
      return response.json()
    },
    enabled: !!submittedQuery(),
  }))

  return (
    <div class="max-w-6xl mx-auto p-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-slate-900">User History Lookup Portal</h1>
        <p class="text-sm text-slate-500">Cross-reference and trace all form records bound to a user ID.</p>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-8 flex gap-4">
        <input
          type="text"
          placeholder="Paste targeted user_id / ticket code reference..."
          value={searchQuery()}
          onInput={e => setSearchQuery(e.currentTarget.value)}
          class="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={() => setSubmittedQuery(searchQuery().trim())}
          class="bg-slate-900 text-white px-5 py-2 rounded text-sm font-medium hover:bg-slate-800"
        >
          Execute Trace
        </button>
      </div>

      <Show when={!matchesQuery.isLoading} fallback={<p class="text-center py-6 text-sm text-slate-500">Searching submission archives...</p>}>
        <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase">
                <th class="p-4">Submission Token (UUIDv7)</th>
                <th class="p-4">Target Form Instance</th>
                <th class="p-4">Decoded Temporal Frame</th>
                <th class="p-4">Recorded Values Package</th>
              </tr>
            </thead>
            <tbody class="text-sm divide-y divide-slate-100">
              <For each={matchesQuery.data} fallback={<tr><td colspan="4" class="p-8 text-center text-slate-400">No matching tracking data found for user ID.</td></tr>}>
                {record => (
                  <tr class="hover:bg-slate-50">
                    <td class="p-4 font-mono text-xs text-slate-600">{record.id}</td>
                    <td class="p-4 font-medium text-slate-900">{record.form_name}</td>
                    <td class="p-4 text-slate-600">
                      {new Date(extractTimestampFromUUIDv7(record.id) * 1000).toLocaleString()}
                    </td>
                    <td class="p-4 font-mono text-xs text-slate-500 max-w-sm truncate" title={record.answers_json}>
                      {record.answers_json}
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Show>
    </div>
  )
}