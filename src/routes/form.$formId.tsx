import { createFileRoute, useSearch } from '@tanstack/solid-router'
import { createResource, Show } from 'solid-js'
import { PublicFormView } from '../components/PublicFormView'
import type { DynamicFormSchema } from '~/types/form'
import styles from './FormRoute.module.css'

export const Route = createFileRoute('/form/$formId')({
  component: FormByIdRoute,
})

function FormByIdRoute() {
  const search = useSearch({ from: '/form/$formId' })

  const [formSchema] = createResource(
    () => ({ id: search().id }),
    async (query) => {
      if (!query.id) return null
      const response = await fetch(`/api/form-settings?id=${encodeURIComponent(query.id)}`)
      if (!response.ok) return null
      return (await response.json()) as DynamicFormSchema
    },
  )

  return (
    <div class={styles.page}>
      <Show when={formSchema.loading} fallback={<div class={styles.loading}>Loading form...</div>}>
        <Show when={formSchema()} fallback={<div class={styles.error}>404 - Form not found</div>}>
          <PublicFormView form={formSchema()!} searchParams={{ user_id: '', ...search() }} />
        </Show>
      </Show>
    </div>
  )
}
