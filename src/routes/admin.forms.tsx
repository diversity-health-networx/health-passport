import { createFileRoute } from '@tanstack/solid-router'
import { For, Show } from 'solid-js'
import { createQuery } from '@tanstack/solid-query'
import styles from './AdminForms.module.css'

export const Route = createFileRoute('/admin/forms')({
  component: AdminFormsDashboard,
})

function AdminFormsDashboard() {
  const formsQuery = createQuery(() => ({
    queryKey: ['admin-forms'],
    queryFn: async (): Promise<any[]> => {
      const response = await fetch('/api/admin/get-all-forms')
      if (!response.ok) throw new Error('Failed to fetch forms')
      return response.json()
    },
  }))

  const executeFormDeletion = async (formId: string) => {
    if (!confirm('Confirm form destruction? All linked user submissions will be deleted.')) return
    const response = await fetch(`/api/admin/remove-form?id=${formId}`, { method: 'DELETE' })
    if (response.ok) formsQuery.refetch()
  }

  return (
    <div class={styles.container}>
      <div class={styles.header}>
        <h1 class={styles.title}>Manage Forms</h1>
        <a href="/admin/create" class={`${styles.btn} ${styles.createBtn}`}>
          Create Form
        </a>
      </div>

      <div class={styles.tableContainer}>
        <table class={styles.table}>
          <thead class={styles.tableHeader}>
            <tr>
              <th class={styles.th}>Form Registry Name</th>
              <th class={styles.th}>Unique Identity ID (UUIDv7)</th>
              <th class={styles.th}>Required ID Variant Format</th>
              <th class={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody class={styles.tbody}>
            <Show when={formsQuery.isLoading} fallback={
              <For each={formsQuery.data} fallback={<tr><td colspan="4" class={styles.emptyState}>No active system forms established.</td></tr>}>
                {form => (
                  <tr class={styles.tr}>
                    <td class={styles.td}>{form.name}</td>
                    <td class={styles.td}>{form.id}</td>
                    <td class={styles.td}>
                      <span class={styles.chip}>{form.user_id_format}</span>
                    </td>
                    <td class={styles.td}>
                      <div class={styles.actions}>
                        <a href={`/form?id=${form.id}&view=admin`} class={styles.actionLink}>
                          Dashboard
                        </a>
                        <button onClick={() => executeFormDeletion(form.id)} class={styles.deleteAction}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </For>
            }>
              <For each={Array(4)}>
                {() => (
                  <tr class={styles.skeletonRow}>
                    <td class={styles.skeletonCell}><div class={`${styles.skeletonBlock} ${styles.skeletonBlockMedium}`} /></td>
                    <td class={styles.skeletonCell}><div class={`${styles.skeletonBlock} ${styles.skeletonBlockLong}`} /></td>
                    <td class={styles.skeletonCell}><div class={`${styles.skeletonBlock} ${styles.skeletonBlockShort}`} /></td>
                    <td class={styles.skeletonCell}><div class={`${styles.skeletonBlock} ${styles.skeletonBlockMedium}`} /></td>
                  </tr>
                )}
              </For>
            </Show>
          </tbody>
        </table>
      </div>
    </div>
  )
}