import { createSignal, onMount, onCleanup, Show, createEffect, Switch, Match } from 'solid-js'
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
  
  let html5QrCodeInstance: Html5Qrcode | undefined
  let modalRef: HTMLDivElement | undefined
  const scannerContainerId = `qr-scanner-${props.fieldName}`

  const setModalRef = (el: HTMLDivElement) => {
    modalRef = el
  }

  // Check if camera devices are connected and available to the client browser
  const checkCameraAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setCameraAvailable(videoDevices.length > 0)
    } catch {
      setCameraAvailable(false)
    }
  }

  // Safely stops any ongoing camera streams and releases the hardware
  const stopScanner = async () => {
    try {
      if (html5QrCodeInstance && html5QrCodeInstance.isScanning) {
        await html5QrCodeInstance.stop()
        html5QrCodeInstance.clear()
      }
    } catch (err) {
      console.error("Failed to stop scanner cleanly:", err)
    } finally {
      setIsScanning(false)
    }
  }

  // Initializes the camera scanner with a tiny delay to allow the DOM to mount
  const startCameraScanner = () => {
    // 50ms delay guarantees SolidJS has finished compiling the conditional blocks
    setTimeout(async () => {
      const container = document.getElementById(scannerContainerId)
      if (!container) {
        setScanError('Scanner preview container not ready in DOM.')
        return
      }

      try {
        if (!html5QrCodeInstance) {
          html5QrCodeInstance = new Html5Qrcode(scannerContainerId)
        }

        // Avoid double initialization
        if (html5QrCodeInstance.isScanning) return 

        setIsScanning(true)
        setScanError('')

        await html5QrCodeInstance.start(
          { facingMode: 'environment' }, // Prefer rear camera on mobile devices
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 } 
          },
          (decodedText: string) => {
            // Success Callback
            props.onScan(decodedText)
            stopScanner()
            props.onClose()
          },
          () => {
            // html5-qrcode produces warnings on every frame without a QR code.
            // We ignore these safely to avoid flooding console logs.
          }
        )
      } catch (err) {
        console.error("Camera access failure:", err)
        setScanError('Failed to capture camera feedback. Please inspect system permission settings.')
        setIsScanning(false)
      }
    }, 50)
  }

  // Handles manual file image upload for scanning static QR codes
  const handleFileChange = async (e: Event) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    setFileError('')
    
    // Stop active camera scanner before uploading a file
    await stopScanner()

    try {
      const temporaryScanner = new Html5Qrcode(scannerContainerId)
      const decodedText = await temporaryScanner.scanFile(file, true)
      props.onScan(decodedText)
      props.onClose()
    } catch (err) {
      console.error("File QR parsing failure:", err)
      setFileError('Unable to identify any valid QR code in this image.')
    }
  }

  // Check hardware on mount
  onMount(() => {
    checkCameraAvailability()
  })

  // Watch modal status and camera configurations
  createEffect(() => {
    if (props.isOpen && scanMode() === 'camera' && cameraAvailable()) {
      startCameraScanner()
    } else {
      stopScanner()
    }
  })

  // Clean up any remaining hardware camera hooks to prevent memory leaks
  onCleanup(() => {
    stopScanner()
  })

  return (
    <Show when={props.isOpen}>
      <div 
        ref={setModalRef}
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-modal-title"
      >
        {/* Style injection to target and completely strip the runtime-generated feedback panels blocking the layout */}
        <style>
          {`
            #${scannerContainerId} {
              position: relative !important;
            }
            /* Hide the built-in, unstyled control panels, headers and status spans dynamically injected by html5-qrcode */
            #${scannerContainerId} > div:not(:first-child),
            #${scannerContainerId} > span,
            #${scannerContainerId}__header_message,
            #${scannerContainerId}__status_span,
            #${scannerContainerId}__dashboard {
              display: none !important;
              opacity: 0 !important;
              height: 0 !important;
              pointer-events: none !important;
              visibility: hidden !important;
            }
            #${scannerContainerId} video {
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
              border-radius: 0.5rem !important;
            }
          `}
        </style>

        <div class="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 id="qr-modal-title" class="text-lg font-bold text-slate-900">
              QR Code Reader
            </h3>
            <button 
              onClick={props.onClose} 
              class="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-200/50 cursor-pointer"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Mode Switcher */}
          <Show when={cameraAvailable()}>
            <div class="flex border-b border-slate-100 p-2 gap-1 bg-slate-50/50">
              <button
                class={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all cursor-pointer ${
                  scanMode() === 'camera' 
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                onClick={() => setScanMode('camera')}
              >
                Use Camera Viewport
              </button>
              <button
                class={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all cursor-pointer ${
                  scanMode() === 'upload' 
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                onClick={() => setScanMode('upload')}
              >
                Upload Photo File
              </button>
            </div>
          </Show>

          {/* Main Display Body */}
          <div class="p-6 flex-1 overflow-y-auto flex flex-col justify-center items-center min-h-[320px]">
            <Switch>
              {/* Camera Viewport Handler */}
              <Match when={scanMode() === 'camera' && cameraAvailable()}>
                <div class="w-full max-w-[280px] aspect-square relative rounded-lg overflow-hidden border-2 border-slate-200 bg-slate-950">
                  {/* Scanner element */}
                  <div id={scannerContainerId} class="w-full h-full object-cover"></div>
                  
                  {/* Loading overlay */}
                  <Show when={!isScanning() && !scanError()}>
                    <div class="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-white p-4 text-center">
                      <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <p class="text-sm">Configuring device lens feeds...</p>
                    </div>
                  </Show>

                  {/* Frame overlays during active scan */}
                  <Show when={isScanning()}>
                    <div class="absolute inset-0 pointer-events-none border-[16px] border-slate-950/30">
                      <div class="w-full h-full border-2 border-dashed border-indigo-400 animate-pulse"></div>
                    </div>
                  </Show>
                </div>
                
                <Show when={scanError()}>
                  <p class="text-red-600 text-sm mt-3 text-center" role="alert">
                    {scanError()}
                  </p>
                </Show>
              </Match>

              {/* Upload Static Photo Handler */}
              <Match when={scanMode() === 'upload' || !cameraAvailable()}>
                <div class="w-full flex flex-col items-center">
                  <label 
                    for="qr-image-input" 
                    class="w-full max-w-[280px] aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100/50 cursor-pointer transition-colors"
                  >
                    <svg class="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <span class="mt-2 block text-sm font-medium text-slate-900 text-center">
                      Select QR Code Image File
                    </span>
                    <span class="mt-1 block text-xs text-slate-500">
                      PNG, JPG, or WebP up to 10MB
                    </span>
                  </label>
                  
                  <input 
                    id="qr-image-input"
                    type="file" 
                    accept="image/*" 
                    class="hidden" 
                    onChange={handleFileChange}
                  />

                  {/* Hidden scanner container for file processing fallback requirements */}
                  <div id={scannerContainerId} class="hidden"></div>

                  <Show when={fileError()}>
                    <p class="text-rose-600 text-sm mt-3 text-center" role="alert">
                      {fileError()}
                    </p>
                  </Show>
                </div>
              </Match>
            </Switch>
          </div>

          {/* Footer controls */}
          <div class="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button 
              onClick={props.onClose} 
              class="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium rounded-lg text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Show>
  )
}