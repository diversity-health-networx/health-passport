import { createFileRoute } from '@tanstack/solid-router'

export const Route = createFileRoute('/submission/$submissionId')({
  component: RouteComponent
})

function RouteComponent() {
  return <></>
}
