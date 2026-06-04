import { createFileRoute } from '@tanstack/solid-router'
import { createSignal, For, Show } from 'solid-js'
import { createQuery } from '@tanstack/solid-query'
import { extractTimestampFromUUIDv7 } from '../utils/uuid'
import { QRScannerModal } from '~/components/QRScannerModal'

export const Route = createFileRoute('/search')({
  component: UserSubmissionCrossLookup,
})

function UserSubmissionCrossLookup() {
  const [searchQuery, setSearchQuery] = createSignal('')
  const [submittedQuery, setSubmittedQuery] = createSignal('')
  const [qrScannerOpen, setQrScannerOpen] = createSignal(false)
  let searchInput: HTMLInputElement | undefined;

  const matchesQuery = createQuery(() => ({
    queryKey: ['user-submissions', submittedQuery()],
    queryFn: async (): Promise<any[]> => {
      if (!submittedQuery()) return []
      const response = await fetch(`/api/submissions-by-user?user_id=${encodeURIComponent(submittedQuery())}`)
      if (!response.ok) return []
      return response.json()
    },
    enabled: !!submittedQuery(),
  }))

  const openQrScanner = (fieldSlug: string) => {
    setQrScannerOpen(true)
  }

  const closeQrScanner = () => {
    setQrScannerOpen(false)
  }

  const handleQrScan = (result: string) => {
    setSearchQuery(result)
  }

  return (
    <div class="max-w-6xl mx-auto p-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-blue-200">Submission Search</h1>
        <p class="text-sm text-slate-600">Lookup submissions for a user</p>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-8 flex gap-4">
        <input
          type="text"
          placeholder="Enter user ID"
          value={searchQuery()}
          onInput={e => setSearchQuery(e.currentTarget.value)}
          class="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          ref={searchInput}
        />
        <button
          type="button"
          onClick={() => openQrScanner('userId')}
          aria-label="Scan QR code for User ID"
          class="p-2 border-1 bg-slate-900 text-[#3c434d] cursor-pointer rounded flex items-center justify-center transition-all duration-150 ease-out hover:bg-slate-800 hover:text-indigo-600 hover:scale-105 focus:outline focus:outline-2 focus:outline-indigo-600 focus:outline-offset-2 focus:bg-slate-100 focus:text-indigo-600 active:scale-95"
        >
          <span class="mx-2 text-white">Scan</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        </button>
        <button
          onClick={() => setSubmittedQuery(searchQuery().trim())}
          class="bg-slate-900 text-white px-5 py-2 rounded text-sm font-medium hover:bg-slate-800 hover:scale-105"
        >
          Search
        </button>
        <QRScannerModal
          isOpen={qrScannerOpen()}
          onClose={closeQrScanner}
          onScan={handleQrScan}
        />
      </div>

      <Show when={!matchesQuery.isLoading} fallback={<p class="text-center py-6 text-sm text-slate-600">Searching submission archives...</p>}>
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
                    <td class="p-4 font-mono text-xs text-slate-600 max-w-sm truncate" title={record.answers_json}>
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