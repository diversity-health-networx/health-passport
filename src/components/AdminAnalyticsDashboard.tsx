import { createSignal, For, Show } from 'solid-js'
import { createQuery } from '@tanstack/solid-query'
import { extractTimestampFromUUIDv7 } from '../utils/uuid'
import type { DynamicFormSchema } from '~/types/form'
import { SubmissionRow } from '~/types/tables'
import { queryClient } from '~/routes/__root'
import styles from './Admin.module.css'

interface AdminAnalyticsDashboardProps {
  form: DynamicFormSchema & { questions_json?: string }
}

export function AdminAnalyticsDashboard(props: AdminAnalyticsDashboardProps) {
  const [selectedSubmission, setSelectedSubmission] = createSignal<any>(null)
  const [allowOverwriteToggle, setAllowOverwriteToggle] = createSignal(props.form.allowOverwrite ? true : false)
  const [expiryDate, setExpiryDate] = createSignal(
    props.form.submissionsExpiry
      ? new Date(props.form.submissionsExpiry * 1000).toISOString().slice(0, 16)
      : ''
  )
  const [isMappingExpanded, setIsMappingExpanded] = createSignal(false)

  const submissionsQuery = createQuery(() => ({
    // Wrapping the dynamic parameter ensures SolidJS registers a reactive dependency on props.form.id
    queryKey: ['submissions', props.form.id],
    queryFn: async () => {
      // Solid tracks this access reactively inside the query function execution context
      const formId = props.form.id
      if (!formId) return []

      const response = await fetch(`/api/admin/form-submissions?form_id=${encodeURIComponent(formId)}`)
      if (!response.ok) throw new Error('Failed to fetch submissions')
      return response.json() as Promise<SubmissionRow[]>
    },
    queryClient,
  }))

  const compileAndDownloadCSV = () => {
    const records = submissionsQuery.data
    if (!records || records.length === 0) return alert('Dataset empty.')

    const parsedFields = props.form.questions_json ? JSON.parse(props.form.questions_json) : props.form.fieldCollection
    
    // 1. Map the header values strictly to the question text (displayLabel).
    // We wrap each header item in quotes and escape internal quotes to prevent commas in questions from breaking layout.
    const headers = [
      'Submission UUIDv7', 
      'User ID', 
      'Timestamp', 
      ...(parsedFields as any[]).map((f: any) => `"${(f.displayLabel || 'Untitled Question').replace(/"/g, '""')}"`)
    ]

    const rowMatrix = [headers.join(',')]
    for (const record of records) {
      const responses = JSON.parse(record.answers_json || '{}')
      const timeString = new Date(extractTimestampFromUUIDv7(record.id) * 1000).toISOString()
      
      const matchingRow = [
        `"${record.id}"`,
        `"${record.user_id}"`,
        `"${timeString}"`,
        // 2. Look up data utilizing the unique machineSlug, even though the slug itself is excluded from headers
        ...(parsedFields as any[]).map((f: any) => `"${String(responses[f.machineSlug] ?? '').replace(/"/g, '""')}"`),
      ]
      rowMatrix.push(matchingRow.join(','))
    }

    const dataBlob = new Blob([rowMatrix.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const localUrl = URL.createObjectURL(dataBlob)
    const hiddenLink = document.createElement('a')
    hiddenLink.href = localUrl
    hiddenLink.setAttribute('download', `submissions_${props.form.formName}_export.csv`)
    document.body.appendChild(hiddenLink)
    hiddenLink.click()
    document.body.removeChild(hiddenLink)
}

  const emailCSV = async () => {
    const targetEmail = window.prompt('Enter email');
    const targetCall = await fetch('/api/admin/email-csv-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formId: props.form.id, targetEmail }),
    })
    if (targetCall.ok) alert('Data report exported to primary administrative inbox.')
  }

  const saveOverwriteSetting = async (newValue: boolean) => {
    setAllowOverwriteToggle(newValue)
    await fetch(`/api/admin/toggle-overwrite?id=${props.form.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowOverwrite: newValue ? 1 : 0 }),
    })
  }

  const saveExpirySetting = async () => {
    const expiryTimestamp = expiryDate()
      ? Math.floor(new Date(expiryDate()).getTime() / 1000)
      : null
    await fetch(`/api/admin/toggle-expiry?id=${props.form.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionsExpiry: expiryTimestamp }),
    })
  }

  return (
    <div class={styles.container}>
      <div class={styles.header}>
        <div>
          <h1 class={styles.title}>Submissions: {props.form.formName}</h1>
          <p class={styles.uuid}>Form ID: {props.form.id}</p>
          <p class={styles.uuid}>Total - {submissionsQuery.data?.length} records</p>
        </div>
        <div class={styles.actions}>
          <button onClick={compileAndDownloadCSV} class={`${styles.btn} ${styles.btnDark}`}>
            Download
          </button>
          <button onClick={emailCSV} class={`${styles.btn} ${styles.btnPrimary}`}>
            Email
          </button>
        </div>
      </div>

      <div class={styles.policyPanel}>
        <div>
          <h4 class={styles.policyTitle}>Submission Overwrite Policy</h4>
          <p class={styles.policyDesc}>Allow users to overwrite pre-existing form submissions.</p>
        </div>
        <label class={styles.policyToggle}>
          <input
            type="checkbox"
            checked={allowOverwriteToggle()}
            onChange={e => saveOverwriteSetting(e.target.checked)}
            class={styles.checkbox}
          />
          <span class={styles.label}>Enabled</span>
        </label>
      </div>

      <div class={styles.policyPanel}>
        <div>
          <h4 class={styles.policyTitle}>Submission Expiry</h4>
          <p class={styles.policyDesc}>
            {props.form.submissionsExpiry && props.form.submissionsExpiry <= Math.floor(Date.now() / 1000)
              ? 'This form has expired and is no longer accepting submissions.'
              : 'Set when this form should stop accepting submissions (optional).'
            }
          </p>
        </div>
        <div class="flex items-center gap-2">
          <input
            id="expiryDate"
            type="datetime-local"
            value={expiryDate()}
            onInput={e => setExpiryDate(e.currentTarget.value)}
            class="border border-slate-300 rounded px-2 py-1 text-sm admin-expiry focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={saveExpirySetting}
            class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      <div class={styles.grid}>
        <div class={styles.tableContainer}>
          <table class={styles.table}>
            <thead class={styles.tableHeader}>
              <tr>
                <th class={styles.th}>User ID</th>
                <th class={styles.th}>Time</th>
                <th class={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody class={styles.tbody}>
              <For each={submissionsQuery.data} fallback={<tr><td colspan="3" class={styles.emptyState}>Zero response metrics cataloged.</td></tr>}>
                {row => (
                  <tr class={styles.tr} onClick={() => setSelectedSubmission(row)}>
                    <td class={styles.td}>
                      <span class={styles.userId}>{row.user_id}</span>
                    </td>
                    <td class={styles.td}>
                      {new Date(extractTimestampFromUUIDv7(row.id) * 1000).toLocaleString()}
                    </td>
                    <td class={styles.td}>
                      <button class={styles.inspectBtn}>Inspect</button>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>

        <div class={styles.inspectionPanel}>
          <h3 class={styles.panelTitle}>Inspection Panel</h3>
          <Show when={selectedSubmission()} fallback={<p class={styles.panelPlaceholder}>Select a submission to view answers.</p>}>
            <div class={styles.response}>
              <div>
                <span class={styles.fieldLabel}>Submission ID</span>
                <span class={styles.monoBox}>{selectedSubmission().id}</span>
              </div>
              <div>
                <span class={styles.fieldLabel}>User Id</span>
                <span class={styles.fieldValue}>{selectedSubmission().user_id}</span>
              </div>
              <div class={styles.formResponse}>
                <span class={styles.fieldLabel}>Form Responses</span>
                <div class="space-y-4 mt-3">
                  <For each={Object.entries(JSON.parse(selectedSubmission().answers_json || '{}'))}>
                    {([slug, value]) => {
                      const field = props.form.fieldCollection.find(f => f.machineSlug === slug)
                      const label = field?.displayLabel || slug
                      return (
                        <div class="space-y-1">
                          <label class="block text-sm font-medium text-slate-700">
                            {label}
                          </label>
                          <div class="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50 text-slate-900 min-h-[38px] flex items-center">
                            {value !== undefined && value !== '' ? String(value) : <span class="text-slate-400 italic">No response</span>}
                          </div>
                        </div>
                      )
                    }}
                  </For>
                </div>
              </div>
              <div>
                <div class={styles.mappingHeader} onClick={() => setIsMappingExpanded(!isMappingExpanded())}>
                  <span class={styles.fieldLabel}>Raw Response Data</span>
                  <span class={`${styles.caret} ${isMappingExpanded() ? styles.caretUp : styles.caretDown}`} aria-hidden="true">
                    ▼
                  </span>
                </div>
                <Show when={isMappingExpanded()}>
                  <div class={styles.jsonBox}>
                    {JSON.stringify(JSON.parse(selectedSubmission().answers_json), null, 2)}
                  </div>
                </Show>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  )
}