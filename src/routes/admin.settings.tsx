import { createFileRoute } from '@tanstack/solid-router'
import { createSignal, createEffect } from 'solid-js'
import { createQuery, useQueryClient } from '@tanstack/solid-query'
import styles from './AdminSettings.module.css'

export const Route = createFileRoute('/admin/settings')({
  component: AdminSettings,
})

function AdminSettings() {
  const [submissionsEnabled, setSubmissionsEnabled] = createSignal(true)
  const [isSaving, setIsSaving] = createSignal(false)
  const queryClient = useQueryClient()

  const settingsQuery = createQuery(() => ({
    queryKey: ['global-settings'],
    queryFn: async () => {
      const response = await fetch('/api/global-settings')
      if (!response.ok) throw new Error('Failed to fetch settings')
      return response.json() as any
    },
  }))

  // Initialize form values from query data
  createEffect(() => {
    if (settingsQuery.data) {
      setSubmissionsEnabled(settingsQuery.data.submissions_global_enabled !== 'false')
    }
  })

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/global-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissions_global_enabled: String(submissionsEnabled()),
        }),
      })
      if (!response.ok) throw new Error('Failed to save settings')
      queryClient.invalidateQueries({ queryKey: ['global-settings'] })
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div class={styles.container}>
      <div class={styles.header}>
        <div>
          <h1 class={styles.title}>Global Settings</h1>
          <p class={styles.subtitle}>Configure system-wide settings</p>
        </div>
      </div>

      <div class={styles.card}>
        <div class={styles.section}>
          <h2 class={styles.sectionTitle}>Submission Settings</h2>

          <div class={styles.settingRow}>
            <div>
              <h3 class={styles.settingLabel}>Global Submissions</h3>
              <p class={styles.settingDesc}>
                Disable this to prevent all form submissions across the platform
              </p>
            </div>
            <label class={styles.toggle}>
              <input
                type="checkbox"
                checked={submissionsEnabled()}
                onChange={e => setSubmissionsEnabled(e.target.checked)}
                class={styles.toggleCheckbox}
              />
              <span class={styles.toggleSlider} />
            </label>
          </div>
        </div>

        <div class={styles.actions}>
          <button
            onClick={saveSettings}
            disabled={isSaving()}
            class={styles.saveBtn}
          >
            {isSaving() ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}