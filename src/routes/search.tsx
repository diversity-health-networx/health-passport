import { createFileRoute, Link } from '@tanstack/solid-router'
import { createSignal, For, Show, createMemo } from 'solid-js'
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

  // Track current sorting state (defaults to sorting by time newest first)
  const [sortConfig, setSortConfig] = createSignal<{ key: 'time' | 'form'; direction: 'asc' | 'desc' } | null>({ key: 'time', direction: 'desc' })

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

  // Create a reactive memo to sort the data dynamically based on the clicked column header
  const sortedData = createMemo(() => {
    const data = matchesQuery.data;
    if (!data) return [];

    const currentSort = sortConfig();
    if (!currentSort) return data;

    // Spread into a new array to avoid mutating the TanStack Query cache directly
    return [...data].sort((a, b) => {
      if (currentSort.key === 'time') {
        const timeA = extractTimestampFromUUIDv7(a.id);
        const timeB = extractTimestampFromUUIDv7(b.id);
        return currentSort.direction === 'asc' ? timeA - timeB : timeB - timeA;
      } else if (currentSort.key === 'form') {
        const formA = a.form_name.toLowerCase();
        const formB = b.form_name.toLowerCase();
        if (formA < formB) return currentSort.direction === 'asc' ? -1 : 1;
        if (formA > formB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
      }
      return 0;
    });
  });

  const handleSort = (key: 'time' | 'form') => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        // Toggle direction if clicking the same column
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      // Default to ascending when switching to a new column
      return { key, direction: 'asc' };
    });
  };

  const openQrScanner = () => {
    setQrScannerOpen(true)
  }

  const closeQrScanner = () => {
    setQrScannerOpen(false)
  }

  const handleQrScan = (result: string) => {
    setSearchQuery(result)
    setSubmittedQuery(result)
    closeQrScanner()
  }

  const handleSearch = (e: Event) => {
    e.preventDefault()
    setSubmittedQuery(searchQuery())
  }

  return (
    <div class="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h1 class="text-2xl font-bold text-slate-900 mb-2">Submission Search 🔎</h1>
        <p class="text-sm text-slate-500 mb-6">Enter a User ID or scan their QR code to view all associated form submissions.</p>

        <form onSubmit={handleSearch} class="flex gap-4">
          <div class="flex-1 relative">
            <input
              ref={searchInput}
              type="text"
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              placeholder="Enter User ID..."
              class="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="button"
            onClick={openQrScanner}
            aria-label="Scan QR code for User ID"
            class="p-2 border-1 bg-indigo-950 text-[#3c434d] cursor-pointer rounded flex items-center justify-center transition-all duration-150 ease-out hover:bg-slate-800 hover:text-indigo-600 hover:scale-105 focus:outline focus:outline-2 focus:outline-indigo-600 focus:outline-offset-2 focus:bg-slate-100 focus:text-indigo-600 active:scale-95"
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
            class="bg-indigo-950 text-white px-5 py-2 rounded text-sm font-medium hover:bg-slate-800 hover:scale-105"
          >
            Search
          </button>
        </form>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase">
                <th class="p-4">Submission ID</th>

                {/* Sortable Time Column Header */}
                <th
                  class="p-4 cursor-pointer hover:bg-slate-200 transition-colors select-none group"
                  onClick={() => handleSort('time')}
                >
                  <div class="flex items-center gap-1">
                    Time
                    <span class={`text-slate-400 group-hover:text-slate-700 ${sortConfig()?.key === 'time' ? 'text-indigo-600' : 'opacity-0 group-hover:opacity-100'}`}>
                      {sortConfig()?.key === 'time' && sortConfig()?.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  </div>
                </th>

                {/* Sortable Form Column Header */}
                <th
                  class="p-4 cursor-pointer hover:bg-slate-200 transition-colors select-none group"
                  onClick={() => handleSort('form')}
                >
                  <div class="flex items-center gap-1">
                    Form
                    <span class={`text-slate-400 group-hover:text-slate-700 ${sortConfig()?.key === 'form' ? 'text-indigo-600' : 'opacity-0 group-hover:opacity-100'}`}>
                      {sortConfig()?.key === 'form' && sortConfig()?.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  </div>
                </th>

                <th class="p-4">Action</th>
              </tr>
            </thead>
            <tbody class="text-sm divide-y divide-slate-100">
              <For each={sortedData()} fallback={<tr><td colspan="4" class="p-8 text-center text-slate-400">No matching tracking data found for user ID.</td></tr>}>
                {record => (
                  <tr class="hover:bg-slate-50">
                    <td class="p-4 font-mono text-xs text-slate-600">{record.id}</td>
                    <td class="p-4 text-slate-600">
                      {new Date(extractTimestampFromUUIDv7(record.id) * 1000).toLocaleString()}
                    </td>
                    <td class="p-4 font-medium text-slate-900">{record.form_name}</td>
                    <td class="p-4 font-mono text-xs text-slate-800 max-w-sm truncate" title={record.answers_json}>
                      <Link class="px-4 py-2 bg-green-300 rounded" to='/submission/$submissionId' params={{ submissionId: record.id }}>View</Link>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </div>

      <QRScannerModal
        isOpen={qrScannerOpen()}
        onClose={closeQrScanner}
        onScan={handleQrScan}
        fieldName="search"
      />
    </div>
  )
}