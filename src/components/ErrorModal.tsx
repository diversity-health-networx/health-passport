import { Show, onMount, onCleanup } from 'solid-js'

interface ErrorModalProps {
  isOpen: boolean
  title: string
  message: string
  onClose: () => void
}


export function ErrorModal(props: ErrorModalProps) {
  let modalRef: HTMLDivElement | undefined
  const setModalRef = (el: HTMLDivElement) => {
    modalRef = el
  }

  // Focus trap for accessibility
  const trapFocus = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      props.onClose()
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
      // Store previously focused element
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
        aria-labelledby="error-modal-title"
        aria-describedby="error-modal-description"
      >
        <div
          ref={setModalRef}
          class="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6 sm:p-8"
          tabindex={-1}
          style={{ animation: "modalSlideIn 250ms cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        >
          <div class="flex items-center gap-3 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="16" y2="12" />
              <line x1="12" x2="12.01" y1="8" y2="8" />
            </svg>
            <h2 id="error-modal-title" class="text-xl font-semibold text-slate-900">
              {props.title}
            </h2>
          </div>
          <p id="error-modal-description" class="text-sm text-slate-600 mb-6 pl-10">
            {props.message}
          </p>
          <div class="flex justify-end">
            <button
              onClick={props.onClose}
              class="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-600 transition-all duration-200"
              style={{ "min-height": "44px", "min-width": "44px" }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Show>
  )
}