import { createSignal, For, Show } from 'solid-js'
import { createForm } from '@tanstack/solid-form'
import type { DynamicFormSchema } from '~/types/form'
import { ErrorModal } from './ErrorModal'
import { ConfirmationModal } from './ConfirmationModal'
import { QRScannerModal } from './QRScannerModal'
import styles from './Form.module.css'



interface PublicFormViewProps {
  form: DynamicFormSchema
  searchParams: Record<string, string>
}

export function PublicFormView(props: PublicFormViewProps) {
  const [submitStatus, setSubmitStatus] = createSignal<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = createSignal('')
  const [overwriteWarningOpen, setOverwriteWarningOpen] = createSignal(false)
  const [cachedSubmission, setCachedSubmission] = createSignal<any>(null)
  const [qrScannerOpen, setQrScannerOpen] = createSignal(false)
  const [qrScannerField, setQrScannerField] = createSignal<string | null>(null)

  // Check if form has expired
  const formExpired = () => {
    if (!props.form.submissionsExpiry) return false
    return props.form.submissionsExpiry <= Math.floor(Date.now() / 1000)
  }

  // Initialize form with auto-populated values from URL
  const form = createForm(() => ({
    defaultValues: {
      userId: props.searchParams.user_id ?? '',
      ...Object.fromEntries(
        props.form.fieldCollection.map(field => [
          field.machineSlug,
          field.metaSettings.autoPopulateFromUrl && field.metaSettings.targetQueryParameterName
            ? props.searchParams[field.metaSettings.targetQueryParameterName] ?? ''
            : '',
        ])
      ),
    },
    onSubmit: async ({ value }) => {
      setSubmitStatus('submitting')
      try {
        const { userId, ...answers } = value
        const submissionData = {
          formId: props.form.id,
          formName: props.form.formName,
          userId,
          answers,
        }

        const response = await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submissionData),
        })

        if (response.status === 409) {
          setCachedSubmission(submissionData)
          setOverwriteWarningOpen(true)
          setSubmitStatus('idle')
          return
        }

        if (!response.ok) {
          const error: Error = await response.json()
          throw new Error(error.message || 'Failed to submit form')
        }

        setSubmitStatus('success')
      } catch (error) {
        setSubmitStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred')
      }
    },
  }))

  const validateField = (field: any, value: any): string | undefined => {
    if (field.metaSettings.required && (value === '' || value === undefined || value === null)) {
      return 'This field is required'
    }

    if (field.fieldType === 'text' && typeof value === 'string') {
      if (field.metaSettings.minLength && value.length < field.metaSettings.minLength) {
        return `Minimum length is ${field.metaSettings.minLength} characters`
      }
      if (field.metaSettings.maxLength && value.length > field.metaSettings.maxLength) {
        return `Maximum length is ${field.metaSettings.maxLength} characters`
      }
      if (field.metaSettings.regexType === 'email') {
        const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
        if (!emailRegex.test(value)) return 'Invalid email format'
      }
      if (field.metaSettings.regexType === 'phone') {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/
        if (!phoneRegex.test(value)) return 'Invalid phone format (use E.164)'
      }
      if (field.metaSettings.regexType === 'custom' && field.metaSettings.customRegexPattern) {
        const customRegex = new RegExp(field.metaSettings.customRegexPattern)
        if (!customRegex.test(value)) return 'Invalid format'
      }
    }

    if (field.fieldType === 'numerical' && value !== '') {
      if (isNaN(Number(value))) return 'Must be a number'
    }

    if (field.fieldType === 'scale_1_10' && value !== '') {
      const numValue = Number(value)
      if (isNaN(numValue) || numValue < 1 || numValue > 10) {
        return 'Value must be between 1 and 10'
      }
    }
  }

  const handleOverwriteConfirm = async () => {
    if (!cachedSubmission()) return

    setSubmitStatus('submitting')
    try {
      const response = await fetch('/api/submissions?force=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cachedSubmission()),
      })

      if (!response.ok) {
        const error: Error = await response.json()
        throw new Error(error.message || 'Failed to overwrite submission')
      }

      setSubmitStatus('success')
      setOverwriteWarningOpen(false)
    } catch (error) {
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred')
    }
  }

  const openQrScanner = (fieldSlug: string) => {
    setQrScannerField(fieldSlug)
    setQrScannerOpen(true)
  }

  const closeQrScanner = () => {
    setQrScannerOpen(false)
    setQrScannerField(null)
  }

  const handleQrScan = (result: string) => {
    const fieldKey = qrScannerField();

    //@ts-expect-error - generic fields are not directly supported
    fieldKey && form.setFieldValue(fieldKey!, result)
  }

  return (
    <div class={styles.container}>
      <Show when={formExpired()} fallback={
        <div class={styles.card}>
          <h1 class={styles.title}>{props.form.formName}</h1>
          <p class={styles.subtitle}>Please fill out the form below to submit your responses</p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            class={styles.form}
          >
            <div class={styles.field}>
              <div class="flex justify-between items-start">
                <label for="userId" class={styles.label}>
                  User ID <span class={styles.required}>*</span>
                </label>
                <button
                  type="button"
                  onClick={() => openQrScanner('userId')}
                  aria-label="Scan QR code for User ID"
                  class={styles.qrButton}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                </button>
              </div>
              <input
                id="userId"
                type="text"
                placeholder="Enter your user ID"
                value={form.state.values.userId ?? ''}
                onInput={(e) => form.setFieldValue('userId', e.target.value)}
                aria-invalid={(form.state.fieldMeta.userId?.errors?.length || 0) > 0}
                aria-describedby={form.state.fieldMeta.userId?.errors?.length ? 'userId-error' : undefined}
                required
                class={styles.input}
              />
            </div>

            <For each={props.form.fieldCollection}>
              {field => (
                <form.Field
                  //@ts-expect-error - generic fields are not directly supported
                  name={field.machineSlug}
                  validators={{
                    onBlur: ({ value }) => validateField(field, value),
                  }}
                  children={(fieldApi) => {
                    switch (field.fieldType) {
                      case 'text':
                        return (
                          <div class={styles.field}>
                            <div class="flex justify-between items-start">
                              <label for={field.machineSlug} class={styles.label}>
                                {field.displayLabel}
                                {field.metaSettings.required && <span class={styles.required}>*</span>}
                              </label>
                              <Show when={field.metaSettings.qrScanPopulate}>
                                <button
                                  type="button"
                                  onClick={() => openQrScanner(field.machineSlug)}
                                  aria-label={`Scan QR code for ${field.displayLabel}`}
                                  class={styles.qrButton}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="3" width="7" height="7" />
                                    <rect x="14" y="3" width="7" height="7" />
                                    <rect x="3" y="14" width="7" height="7" />
                                    <rect x="14" y="14" width="7" height="7" />
                                  </svg>
                                </button>
                              </Show>
                            </div>
                            <div class="flex gap-2">
                              <input
                                id={field.machineSlug}
                                type="text"
                                value={fieldApi().state.value ?? ''}
                                onBlur={fieldApi().handleBlur}
                                onChange={(e) => fieldApi().handleChange(e.target.value)}
                                aria-invalid={fieldApi().state.meta.errors.length > 0}
                                aria-describedby={fieldApi().state.meta.errors.length ? `${field.machineSlug}-error` : undefined}
                                class={styles.input}
                              />
                            </div>
                            <Show when={fieldApi().state.meta.errors.length > 0}>
                              <p id={`${field.machineSlug}-error`} class={styles.error} role="alert">
                                {fieldApi().state.meta.errors[0]}
                              </p>
                            </Show>
                          </div>
                        )

                      case 'numerical':
                        return (
                          <div class={styles.field}>
                            <label for={field.machineSlug} class={styles.label}>
                              {field.displayLabel}
                              {field.metaSettings.required && <span class={styles.required}>*</span>}
                            </label>
                            <input
                              id={field.machineSlug}
                              type="number"
                              value={fieldApi().state.value ?? ''}
                              onBlur={fieldApi().handleBlur}
                              onChange={(e) => fieldApi().handleChange(e.target.value)}
                              aria-invalid={fieldApi().state.meta.errors.length > 0}
                              aria-describedby={fieldApi().state.meta.errors.length ? `${field.machineSlug}-error` : undefined}
                              class={styles.input}
                            />
                            <Show when={fieldApi().state.meta.errors.length > 0}>
                              <p id={`${field.machineSlug}-error`} class={styles.error} role="alert">
                                {fieldApi().state.meta.errors[0]}
                              </p>
                            </Show>
                          </div>
                        )

                      case 'scale_1_10':
                        return (
                          <div class={styles.field}>
                            <label class={styles.label}>
                              {field.displayLabel}
                              {field.metaSettings.required && <span class={styles.required}>*</span>}
                            </label>
                            <select
                              value={fieldApi().state.value ?? ''}
                              onBlur={fieldApi().handleBlur}
                              onChange={(e) => fieldApi().handleChange(e.target.value)}
                              aria-invalid={fieldApi().state.meta.errors.length > 0}
                              aria-describedby={fieldApi().state.meta.errors.length ? `${field.machineSlug}-error` : undefined}
                              class={styles.input}
                            >
                              <option value="">Select a value</option>
                              <For each={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}>
                                {num => <option value={num.toString()}>{num}</option>}
                              </For>
                            </select>
                            <Show when={fieldApi().state.meta.errors.length > 0}>
                              <p id={`${field.machineSlug}-error`} class={styles.error} role="alert">
                                {fieldApi().state.meta.errors[0]}
                              </p>
                            </Show>
                          </div>
                        )

                      case 'boolean':
                        return (
                          <div class={styles.booleanField}>
                            <input
                              id={field.machineSlug}
                              type="checkbox"
                              checked={fieldApi().state.value ? true : false}
                              onChange={(e) => fieldApi().handleChange(e.target.checked ? 'true' : 'false')}
                              class={styles.checkbox}
                            />
                            <label for={field.machineSlug} class={styles.label}>
                              {field.displayLabel}
                              {field.metaSettings.required && <span class={styles.required}>*</span>}
                            </label>
                          </div>
                        )

                      case 'likert':
                        return (
                          <div class={styles.field}>
                            <span class={styles.label}>
                              {field.displayLabel}
                              {field.metaSettings.required && <span class={styles.required}>*</span>}
                            </span>
                            <div class={styles.likertOptions}>
                              <For each={['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']}>
                                {(option, index) => (
                                  <label class={styles.likertLabel}>
                                    <input
                                      type="radio"
                                      name={field.machineSlug}
                                      value={index() + 1}
                                      checked={parseInt(fieldApi().state.value) == index() + 1}
                                      onChange={() => fieldApi().handleChange((index() + 1).toString())}
                                      class={styles.radio}
                                    />
                                    {option}
                                  </label>
                                )}
                              </For>
                            </div>
                          </div>
                        )

                      default:
                        return null
                    }
                  }}
                />
              )}
            </For>

            <Show when={submitStatus() === 'error'}>
              <p class={styles.errorBanner} role="alert">
                {errorMessage()}
              </p>
            </Show>

            <Show when={submitStatus() === 'success'}>
              <p class={`${styles.success} ${styles.successText}`}>
                Form submitted successfully!
              </p>
            </Show>

            <Show when={submitStatus() === 'idle'}>
              <button
                type="submit"
                disabled={form.state.isSubmitting}
                class={styles.submitBtn}
              >
                {form.state.isSubmitting ? 'Submitting...' : 'Submit Form'}
              </button>
            </Show>
          </form>

          <ConfirmationModal
            isOpen={overwriteWarningOpen()}
            title="Overwrite Existing Submission?"
            message="We detected a prior submission associated with this user ID. Continuing will permanently overwrite your previous records."
            onConfirm={handleOverwriteConfirm}
            onCancel={() => setOverwriteWarningOpen(false)}
          />

          <QRScannerModal
            isOpen={qrScannerOpen()}
            onClose={closeQrScanner}
            onScan={handleQrScan}
            fieldName={qrScannerField() ?? ''}
          />
        </div>
      }>
        <div class={styles.card}>
          <div class="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-300 mx-auto mb-4">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <h2 class="text-xl font-semibold text-slate-900 mb-2">Form Expired</h2>
            <p class="text-slate-600 max-w-md mx-auto">
              This form is no longer accepting submissions. The submission deadline has passed.
              Please contact the event organizer if you need assistance.
            </p>
          </div>
        </div>
      </Show>
    </div>
  )
}