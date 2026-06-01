import { createFileRoute } from '@tanstack/solid-router'
import { createSignal, For, Show } from 'solid-js'
import type { QuestionType } from '../types/schema'

export const Route = createFileRoute('/admin/create')({
  component: FormSchemaBuilderWorkspace,
})

function FormSchemaBuilderWorkspace() {
  const [fields, setFields] = createSignal<any[]>([])
  const [formName, setFormName] = createSignal('')
  const [allowOverwrite, setAllowOverwrite] = createSignal(false)
  const [expiryDate, setExpiryDate] = createSignal<string | null>(null)

  const injectQuestionTrack = (type: QuestionType) => {
    const newField = {
      id: crypto.randomUUID(),
      machineSlug: `field_${Date.now()}`,
      displayLabel: 'Untitled Question',
      fieldType: type,
      metaSettings: {
        required: false,
        qrScanPopulate: false,
        autoPopulateFromUrl: false,
      },
    }
    setFields([...fields(), newField])
  }

  const purgeQuestionTrack = (id: string) => {
    setFields(fields().filter(f => f.id !== id))
  }

  const updateField = (id: string, updates: any) => {
    setFields(fields().map(f => (f.id === id ? { ...f, ...updates } : f)))
  }

  const compileAndCommitSchema = async () => {
    const structuredPayload = {
      formName: formName().trim().toLowerCase().replace(/\s+/g, '-'),
      userIdConstraint: 'user_id',
      allowOverwrite: allowOverwrite(),
      submissionsExpiry: expiryDate() ? Math.floor(new Date(expiryDate() || 0).getTime() / 1000) : null,
      fieldCollection: fields(),
    }

    const submitCall = await fetch('/api/admin/create-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(structuredPayload),
    })

    if (submitCall.ok) alert('Form schema safely initialized across active environments.')
  }

  return (
    <div class="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow border">
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 mb-6">Form Builder</h1>

      <div class="space-y-4 mb-6">
        <div>
          <label for="formName" class="block text-sm font-medium text-slate-700 mb-1">
            Form Name
          </label>
          <input
            id="formName"
            type="text"
            value={formName()}
            onInput={e => setFormName(e.currentTarget.value)}
            placeholder="Enter form name..."
            class="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label for="expiryDate" class="block text-sm font-medium text-slate-700 mb-1">
            Submission Expiry (Optional)
          </label>
          <input
            id="expiryDate"
            type="datetime-local"
            value={expiryDate() ?? ''}
            onInput={e => setExpiryDate(e.currentTarget.value || null)}
            class="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p class="text-xs text-slate-500 mt-1">
            Form will stop accepting submissions after this time. Leave empty for no expiry.
          </p>
        </div>

        <div class="flex items-center gap-2 pt-2">
          <input
            id="allowOverwrite"
            type="checkbox"
            checked={allowOverwrite()}
            onChange={e => setAllowOverwrite(e.target.checked)}
            class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
          />
          <label for="allowOverwrite" class="text-sm font-medium text-slate-700">
            Allow Users to Overwrite Existing Submissions
          </label>
        </div>
        <p class="text-xs text-slate-500 mt-1">
            When enabled, users can resubmit to update their previous responses. If disabled, users will be blocked from submitting more than once.
          </p>
      </div>

      <div class="border-t border-slate-200 pt-4 mb-6">
        <h2 class="text-sm font-semibold text-slate-900 mb-3">Form Fields</h2>

        <div class="flex flex-wrap gap-2 mb-4">
          <For each={['text', 'numerical', 'scale_1_10', 'boolean', 'likert']}>
            {type => (
              <button
                type="button"
                onClick={() => injectQuestionTrack(type as QuestionType)}
                class="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
              >
                Add {type.replace('_', ' ')}
              </button>
            )}
          </For>
        </div>

        <div class="space-y-3">
          <For each={fields()}>
            {field => (
              <div class="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div class="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Display Label</label>
                    <input
                      type="text"
                      value={field.displayLabel}
                      onInput={e => updateField(field.id, { displayLabel: e.currentTarget.value })}
                      class="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Machine Slug</label>
                    <input
                      type="text"
                      value={field.machineSlug}
                      onInput={e => updateField(field.id, { machineSlug: e.currentTarget.value })}
                      class="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-xs text-slate-500">Type: {field.fieldType}</span>
                  <div class="flex items-center gap-3">
                    <label class="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={field.metaSettings.required}
                        onChange={e =>
                          updateField(field.id, {
                            metaSettings: { ...field.metaSettings, required: e.target.checked },
                          })
                        }
                      />
                      Required
                    </label>
                    <Show when={field.fieldType === 'text'}>
                      <label class="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={field.metaSettings.qrScanPopulate ?? false}
                          onChange={e =>
                            updateField(field.id, {
                              metaSettings: { ...field.metaSettings, qrScanPopulate: e.target.checked },
                            })
                          }
                        />
                        QR Scan
                      </label>
                    </Show>
                    <button
                      type="button"
                      onClick={() => purgeQuestionTrack(field.id)}
                      class="text-rose-600 hover:text-rose-800 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      <div class="flex justify-end">
        <button
          type="button"
          onClick={compileAndCommitSchema}
          disabled={!formName() || fields().length === 0}
          class="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          Save Form Schema
        </button>
      </div>
    </div>
  )
}