import { createSignal, For, Show } from 'solid-js'
import { createQuery } from '@tanstack/solid-query'
import { extractTimestampFromUUIDv7 } from '~/utils/uuid'
import { createFileRoute, useParams } from '@tanstack/solid-router'
import { queryClient } from '~/routes/__root'
import { UUIDv7 } from 'uuidv7-isomorphic'
import styles from './submission.module.css'
import { SubmissionResponse } from '~/types/form'

export const Route = createFileRoute('/submission/$submissionId')({
  component: SubmissionPage,
  ssr: false,
})

function SubmissionPage() {
  const params = useParams({ from: "/submission/$submissionId" })
  const [isLoading, setIsLoading] = createSignal(false)
  const [error, setError] = createSignal('')
  const [isMappingExpanded, setIsMappingExpanded] = createSignal(false)

  // Fetch submission and associated form fields schema
  const submissionQuery = createQuery<SubmissionResponse>(() => ({
    queryKey: [`submission_${params().submissionId}`],
    queryFn: async () => {
      const id = params().submissionId
      if (!id) throw new Error('Missing submission ID')

      setIsLoading(true)
      const response = await fetch(`/api/submission?id=${encodeURIComponent(id)}`)
      setIsLoading(false)

      if (!response.ok) {
        const errorData = await response.json()
        const message = (errorData && typeof errorData === 'object' && 'error' in errorData)
          ? (errorData as { error?: string }).error
          : 'Failed to fetch submission'
        throw new Error(message)
      }
      return response.json() as Promise<SubmissionResponse>
    },
    queryClient,
  }))

  return (
    <div class={`${styles.container} max-w-3xl mx-auto px-4 py-6 md:py-10 w-full box-border`}>
      <Show when={isLoading() || submissionQuery.isLoading}>
        <div class="flex items-center justify-center py-12 text-slate-500 text-sm">
          <div class="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent mr-2" aria-hidden="true"></div>
          Loading submission details...
        </div>
      </Show>
      <Show when={!isLoading() && !submissionQuery.isLoading}>
        <Show when={error() || submissionQuery.error}>
          <div class="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm break-words">
            Error: {error() || submissionQuery.error?.message}
          </div>
        </Show>
        <Show when={!error() && !submissionQuery.error}>
          <Show when={submissionQuery.data}>
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6 md:p-8 space-y-6">
              {/* Header Details */}
              <div class="border-b border-slate-100 pb-6 space-y-3">
                <h1 class="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Submission Details
                </h1>
                <div class="space-y-2">
                  <p class="text-xs sm:text-sm text-slate-500 font-mono break-all flex flex-wrap gap-x-1">
                    <span class="font-semibold text-slate-700">Submission ID:</span> 
                    <span class="break-all">{submissionQuery.data?.id}</span>
                  </p>
                  <p class="text-xs sm:text-sm text-slate-500 font-mono break-all flex flex-wrap gap-x-1">
                    <span class="font-semibold text-slate-700">Ticket ID:</span> 
                    <span class="break-all">{submissionQuery.data?.userId}</span>
                  </p>
                  <p class="text-xs sm:text-sm text-slate-500 font-mono flex flex-wrap gap-x-1">
                    <span class="font-semibold text-slate-700">Timestamp:</span> 
                    <span>{new Date(extractTimestampFromUUIDv7(submissionQuery.data!.id as UUIDv7) * 1000).toLocaleString()}</span>
                  </p>
                </div>
              </div>

              {/* Form Responses Section - Dashboard Style Layout */}
              <div class="space-y-3">
                <span class="text-sm font-semibold text-slate-500 uppercase tracking-wider block">
                  Form Responses
                </span>
                <div class="space-y-4">
                  <For each={Object.entries(submissionQuery.data!.answers)}>
                    {([slug, value]) => {
                      const field = submissionQuery.data!.fields.find(f => f.machineSlug === slug)
                      const label = field?.displayLabel || slug
                      return (
                        <div class="space-y-1.5">
                          <label class="block text-sm font-medium text-slate-700 break-words overflow-auto">
                            {label}
                          </label>
                          <div class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-900 min-h-[42px] flex items-center break-words whitespace-pre-wrap leading-relaxed overflow-auto">
                            {value !== undefined && value !== '' ? <span class="min-w-0 break-words whitespace-pre-wrap">{String(value)}</span> : <span class="text-slate-400 italic min-w-0 break-words whitespace-pre-wrap">No response</span>}
                          </div>
                        </div>
                      )
                    }}
                  </For>
                </div>
              </div>
              <hr/>

              {/* Accordion Raw Mapping Panel */}
              <div class=" px-4 py-2 rounded-lg bg-slate-200 border border-slate-400">
                <button
                  type="button"
                  class="w-full flex justify-between items-center cursor-pointer select-none py-2 group focus:outline-none focus:ring-1 focus:ring-indigo-300 focus:ring-offset-2 rounded-md m-auto"
                  onClick={() => setIsMappingExpanded(!isMappingExpanded())}
                  aria-expanded={isMappingExpanded()}
                >
                  <span class="text-sm font-semibold text-slate-500 uppercase tracking-wider text-left">
                    Raw Response Data
                  </span>
                  <span class={`text-xs text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${isMappingExpanded() ? 'rotate-180' : ''}`} aria-hidden="true">
                    ▼
                  </span>
                </button>
                
                <Show when={isMappingExpanded()}>
                  <div class="mt-3 rounded-lg overflow-x-auto p-4 bg-slate-900 text-slate-200 font-mono text-xs whitespace-pre-wrap break-all max-w-full leading-relaxed">
                    {JSON.stringify(
                      Object.fromEntries(
                        Object.entries(submissionQuery.data!.answers).map(([slug, value]) => {
                          const field = submissionQuery.data!.fields.find(f => f.machineSlug === slug)
                          return [field?.displayLabel || slug, value]
                        })
                      ),
                      null,
                      2
                    )}
                  </div>
                </Show>
              </div>
            </div>
          </Show>
          <Show when={!submissionQuery.data}>
            <div class="text-center py-12 text-slate-500 text-sm bg-white rounded-xl border border-slate-200 shadow-sm">
              No submission found.
            </div>
          </Show>
        </Show>
      </Show>
    </div>
  )
}