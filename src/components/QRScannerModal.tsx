import { createSignal, onMount, onCleanup, Show, createEffect } from 'solid-js'
import { Html5Qrcode } from 'html5-qrcode'

interface QRScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScan: (result: string) => void
  fieldName: string
}

export function QRScannerModal(props: QRScannerModalProps) {
  const [scanMode, setScanMode] = createSignal<'camera' | 'upload'>('camera')
  const [cameraAvailable, setCameraAvailable] = createSignal(true)
  const [scanError, setScanError] = createSignal('')
  const [fileError, setFileError] = createSignal('')
  const [isScanning, setIsScanning] = createSignal(false)
  
  let html5QrCode: Html5Qrcode | undefined
  let modalRef: HTMLDivElement | undefined
  const scannerContainerId = `qr-scanner-${props.fieldName}`

  const setModalRef = (el: HTMLDivElement) => {
    modalRef = el
  }

  const checkCameraAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setCameraAvailable(videoDevices.length > 0)
    } catch {
      setCameraAvailable(false)
    }
  }

  const startCameraScanner = async () => {
    if (!html5QrCode) return

    try {
      setIsScanning(true)
      setScanError('')
      
      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          props.onScan(decodedText)
          props.onClose()
          stopScanner()
        },
        (errorMessage) => {
          // Scanning errors are frequent during continuous scanning, don't show them
          console.debug('QR scan error:', errorMessage)
        }
      )
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Failed to start camera scanner')
      setIsScanning(false)
    }
  }

  const stopScanner = async () => {
    if (html5QrCode && isScanning()) {
      try {
        await html5QrCode.stop()
        await html5QrCode.clear()
      } catch {
        // Scanner may already be stopped
      }
      setIsScanning(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!html5QrCode) return

    setFileError('')
    
    try {
      const result = await html5QrCode.scanFile(file, true)
      props.onScan(result)
      props.onClose()
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Failed to decode QR code from image')
    }
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
      checkCameraAvailability()
      html5QrCode = new Html5Qrcode(scannerContainerId)
    }
  })

  // Handle modal open/close lifecycle
  createEffect(() => {
    if (props.isOpen) {
      setScanMode(cameraAvailable() ? 'camera' : 'upload')
      if (cameraAvailable()) {
        startCameraScanner()
      }
      // Store previously focused element
      const previouslyFocused = document.activeElement as HTMLElement
      onCleanup(() => {
        stopScanner()
        previouslyFocused?.focus()
      })
    } else {
      stopScanner()
    }
  })

  onCleanup(() => {
    stopScanner()
  })

  const handleFileInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  return (
    <Show when={props.isOpen}>
      <div 
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-modal-title"
        onKeyDown={trapFocus}
        style={{ animation: "modalFadeIn 200ms ease-out" }}
      >
        <div 
          ref={setModalRef} 
          class="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6 sm:p-8" 
          tabindex={-1}
          style={{ 
            animation: "modalSlideIn 250ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            'transform-origin': "center"
          }}
        >
          <div class="flex items-center gap-3 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-600">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            <h2 id="qr-modal-title" class="text-xl font-semibold text-slate-900">
              Scan QR Code
            </h2>
          </div>
          <p class="text-sm text-slate-600 mb-6">Position the QR code within the scanner frame or upload an image containing a QR code.</p>
          
          <Show when={cameraAvailable() || scanMode() === 'upload'}>
            <div class="flex gap-2 mb-6">
              <Show when={cameraAvailable()}>
                <button
                  type="button"
                  onClick={() => setScanMode('camera')}
                  class={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                    scanMode() === 'camera' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  style={{ "min-height": "44px", "min-width": "44px" }}
                >
                  <span class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    Camera Scan
                  </span>
                </button>
              </Show>
              <button
                type="button"
                onClick={() => setScanMode('upload')}
                class={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                  scanMode() === 'upload' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                style={{ "min-height": "44px", "min-width": "44px" }}
              >
                <span class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="M21 15l-3.086-3.086a2 2 0 0 0-1.414-.586H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2z" />
                  </svg>
                  Upload Image
                </span>
              </button>
            </div>
          </Show>

          <Show when={scanMode() === 'camera' && cameraAvailable()}>
            <div class="relative bg-slate-900 rounded-xl overflow-hidden mb-4">
              <div id={scannerContainerId} class="w-full min-h-[250px]" />
              <Show when={scanError()}>
                <div class="absolute bottom-0 left-0 right-0 bg-red-500/90 text-white p-3 text-sm">
                  {scanError()}
                </div>
              </Show>
              <Show when={isScanning()}>
                <div class="absolute top-0 left-0 right-0 bg-indigo-600/90 text-white p-2 text-xs text-center">
                  Point your camera at a QR code...
                </div>
              </Show>
            </div>
          </Show>

          <Show when={scanMode() === 'upload'}>
            <div class="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center transition-all duration-200 hover:border-indigo-400 hover:bg-slate-50 mb-4">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileInputChange}
                class="hidden"
                id={`qr-upload-${props.fieldName}`}
              />
              <label
                for={`qr-upload-${props.fieldName}`}
                class="cursor-pointer inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 shadow-md hover:shadow-lg"
                style={{ "min-height": "44px", "min-width": "44px" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="M21 15l-3.086-3.086a2 2 0 0 0-1.414-.586H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2z" />
                </svg>
                Choose Image
              </label>
              <p class="text-xs text-slate-600 mt-3">Supported formats: JPEG, PNG, WebP, GIF</p>
              <Show when={fileError()}>
                <p class="text-red-600 text-sm mt-3">{fileError()}</p>
              </Show>
            </div>
          </Show>

          <Show when={!cameraAvailable()}>
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p class="text-amber-700 text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Camera not available. Using image upload mode.
              </p>
            </div>
          </Show>

          <div class="flex justify-end pt-2 border-t border-slate-200">
            <button
              onClick={props.onClose}
              class="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-600 transition-all duration-200"
              style={{ "min-height": "44px", "min-width": "44px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Show>
  )
}