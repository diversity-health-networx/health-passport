import { Show, onMount, onCleanup } from 'solid-js'

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmationModal(props: ConfirmationModalProps) {
  let modalRef: HTMLDivElement | undefined
  const setConfirmModalRef = (el: HTMLDivElement) => {
    modalRef = el
  }

  // Focus trap for accessibility
  const trapFocus = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      props.onCancel()
      return
    }

    if (e.key !== 'Tab' || !modalRef) return

    const focusableElements = modalRef.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault()
      lastElement?.focus()
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault()
      firstElement?.focus()
    }
  }

  onMount(() => {
    if (props.isOpen) {
      document.addEventListener('keydown', trapFocus)
      const previouslyFocused = document.activeElement as HTMLElement
      onCleanup(() => {
        document.removeEventListener('keydown', trapFocus)
        previouslyFocused?.focus()
      })
    }
  })

  return (
    <Show when={props.isOpen}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
      >
        <div
          ref={setConfirmModalRef}
          class="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6 sm:p-8"
          tabindex={-1}
          style={{ animation: "modalSlideIn 250ms cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        >
          <div class="flex items-center gap-3 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-500">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <h2 id="confirm-modal-title" class="text-xl font-semibold text-slate-900">
              {props.title}
            </h2>
          </div>
          <p id="confirm-modal-description" class="text-sm text-slate-600 mb-6 pl-10">
            {props.message}
          </p>
          <div class="flex justify-end gap-3">
            <button
              onClick={props.onCancel}
              class="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all duration-200"
              style={{ "min-height": "44px", "min-width": "44px" }}
            >
              Cancel
            </button>
            <button
              onClick={props.onConfirm}
              class="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-md hover:shadow-lg transition-all duration-200"
              style={{ "min-height": "44px", "min-width": "44px" }}
            >
              Confirm Overwrite
            </button>
          </div>
        </div>
      </div>
    </Show>
  )
}