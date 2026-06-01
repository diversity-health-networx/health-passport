import { createSignal, For, Show } from 'solid-js'
import { createQuery, useQueryClient } from '@tanstack/solid-query'
import { extractTimestampFromUUIDv7 } from '../utils/uuid'
import type { DynamicFormSchema } from '../types/schema'
import styles from './Admin.module.css'

interface AdminAnalyticsDashboardProps {
  form: DynamicFormSchema & { questions_json?: string }
}

export function AdminAnalyticsDashboard(props: AdminAnalyticsDashboardProps) {
  const [selectedSubmission, setSelectedSubmission] = createSignal<any>(null)
  const [allowOverwriteToggle, setAllowOverwriteToggle] = createSignal(props.form.allow_overwrite === 1)
  const [expiryDate, setExpiryDate] = createSignal(
    props.form.submissionsExpiry 
      ? new Date(props.form.submissionsExpiry * 1000).toISOString().slice(0, 16) 
      : ''
  )
  const queryClient = useQueryClient()

  const submissionsQuery = createQuery(() => ({
    queryKey: ['submissions', props.form.id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/form-submissions?form_id=${props.form.id}`)
      if (!response.ok) throw new Error('Failed to fetch submissions')
      return response.json()
    },
  }))

  const compileAndDownloadCSV = () => {
    const records = submissionsQuery.data
    if (!records || records.length === 0) return alert('Dataset empty.')

    const parsedFields = props.form.questions_json ? JSON.parse(props.form.questions_json) : props.form.fieldCollection
    const headers = ['Submission UUIDv7', 'User ID', 'Decoded Timestamp', ...(parsedFields as any[]).map((f: any) => f.machineSlug)]

    const rowMatrix = [headers.join(',')]
    for (const record of records) {
      const responses = JSON.parse(record.answers_json || '{}')
      const timeString = new Date(extractTimestampFromUUIDv7(record.id) * 1000).toISOString()
      const matchingRow = [
        `"${record.id}"`,
        `"${record.user_id}"`,
        `"${timeString}"`,
        ...(parsedFields as any[]).map((f: any) => `"${String(responses[f.machineSlug] ?? '').replace(/"/g, '""')}"`),
      ]
      rowMatrix.push(matchingRow.join(','))
    }

    const dataBlob = new Blob([rowMatrix.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const localUrl = URL.createObjectURL(dataBlob)
    const hiddenLink = document.createElement('a')
    hiddenLink.href = localUrl
    hiddenLink.setAttribute('download', `analytics_${props.form.formName}_export.csv`)
    document.body.appendChild(hiddenLink)
    hiddenLink.click()
    document.body.removeChild(hiddenLink)
  }

  const dispatchCSVViaPostmark = async () => {
    const targetCall = await fetch('/api/admin/email-csv-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formId: props.form.id }),
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
          <h1 class={styles.title}>Form Metrics: {props.form.formName}</h1>
          <p class={styles.uuid}>UUIDv7 Handle: {props.form.id}</p>
        </div>
        <div class={styles.actions}>
          <button onClick={compileAndDownloadCSV} class={`${styles.btn} ${styles.btnDark}`}>
            Download CSV
          </button>
          <button onClick={dispatchCSVViaPostmark} class={`${styles.btn} ${styles.btnPrimary}`}>
            Email Export
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
            class="border border-slate-300 rounded px-2 py-1 text-sm"
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
                <th class={styles.th}>User Token Identifier</th>
                <th class={styles.th}>Decoded Creation Time</th>
                <th class={styles.th}>Actions</th>
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
                      <button class={styles.inspectBtn}>Inspect Details</button>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>

        <div class={styles.inspectionPanel}>
          <h3 class={styles.panelTitle}>Inspection Panel</h3>
          <Show when={selectedSubmission()} fallback={<p class={styles.panelPlaceholder}>Select a entry row item to explore granular response parameters.</p>}>
            <div class={styles.response}>
              <div>
                <span class={styles.fieldLabel}>Submission Unique ID (UUIDv7)</span>
                <span class={styles.monoBox}>{selectedSubmission().id}</span>
              </div>
              <div>
                <span class={styles.fieldLabel}>User Association Variable</span>
                <span class={styles.fieldValue}>{selectedSubmission().user_id}</span>
              </div>
              <div>
                <span class={styles.fieldLabel}>Field Response Parameters Mapping</span>
                <div class={styles.jsonBox}>
                  {JSON.stringify(JSON.parse(selectedSubmission().answers_json), null, 2)}
                </div>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  )
}