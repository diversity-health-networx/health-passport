import { createFileRoute, useSearch } from '@tanstack/solid-router'
import { createResource, Show, Switch, Match } from 'solid-js'
import { PublicFormView } from '../components/PublicFormView'
import { AdminAnalyticsDashboard } from '../components/AdminAnalyticsDashboard'
import type { DynamicFormSchema } from '~/types/form'
import styles from './FormRoute.module.css'

export const Route = createFileRoute('/form')({
  component: FormGatewayRoute,
  validateSearch: (search: {
    id?: string
    name?: string
    view?: string
  }) => search,
})

function FormGatewayRoute() {
  const searchParams = useSearch({ from: '/form' })

  // 1. Evaluate the searchParams signal safely to get standard primitive fields
  const targetFormId = () => searchParams().id
  const targetFormName = () => searchParams().name
  const functionalMode = () => searchParams().view

  // 2. Pass those primitive values straight to the resource source key
  const [formSchema] = createResource(
    () => {
      const id = targetFormId()
      const name = targetFormName()
      return (id || name) ? { id, name } : null
    },
    async query => {
      // If the source tracking function returns null, createResource won't trigger this fetcher
      const searchUrl = query.id
        ? `/api/form-settings?id=${encodeURIComponent(query.id)}`
        : `/api/form-settings?name=${encodeURIComponent(query.name || '')}`
      
      try {
        const response = await fetch(searchUrl)
        if (!response.ok) throw new Error('Form not found')
        return (await response.json()) as DynamicFormSchema
      } catch (error) {
        return null
      }
    }
  )

  return (
    <div class={styles.page}>
      <Show when={!formSchema.loading} fallback={<div class={styles.loading}>Parsing form data framework...</div>}>
        <Show when={formSchema()} fallback={<div class={styles.error}>404 - Form Definition Erased or Non-Existent</div>}>
          <Switch>
            <Match when={functionalMode() === 'admin'}>
              <AdminAnalyticsDashboard form={formSchema()!} />
            </Match>
            <Match when={functionalMode() !== 'admin'}>
              <PublicFormView form={formSchema()!} searchParams={searchParams()} />
            </Match>
          </Switch>
        </Show>
      </Show>
    </div>
  )
}