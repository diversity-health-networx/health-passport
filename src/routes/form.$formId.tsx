import { createFileRoute, useSearch, useParams } from '@tanstack/solid-router'
import { createResource, Show, Switch, Match } from 'solid-js'
import { PublicFormView } from '../components/PublicFormView'
import { AdminAnalyticsDashboard } from '../components/AdminAnalyticsDashboard'
import type { DynamicFormSchema } from '~/types/form'
import styles from '../components/Form.module.css'

export const Route = createFileRoute('/form/$formId')({
  component: FormByIdRoute,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      view: (search?.view as string | undefined) ?? undefined,
    }
  },
  ssr: false,
})

function FormByIdRoute() {
  const params = useParams({ from: '/form/$formId' })
  const search = useSearch({ from: '/form/$formId' })

  const [formSchema] = createResource(
    () => params().formId,
    async (formId) => {
      if (!formId) return null
      const response = await fetch(`/api/form-settings?id=${encodeURIComponent(formId)}`)
      if (!response.ok) throw new Error('Form not found')
      return (await response.json()) as DynamicFormSchema
    },
  )

  return (
    <div class={styles.container}>
      <Show when={formSchema.loading} fallback={
        <Show when={formSchema()} fallback={<div class={styles.error}>404 - Form not found</div>}>
          <Switch fallback={<PublicFormView form={formSchema()!} searchParams={search() as unknown as Record<string, string>} />}>
            <Match when={search().view === 'admin'}>
              <AdminAnalyticsDashboard form={formSchema()!} />
            </Match>
          </Switch>
        </Show>
      }>
        <div class={styles.loading}>Loading form...</div>
      </Show>
    </div>
  )
}