import type { SignatureResult, SignatureCaptureOptions } from '../types'
import { fileService } from '../file-service'

class SignatureCaptureWorkflow {
  async capture(options?: SignatureCaptureOptions): Promise<SignatureResult | null> {
    const canvas = document.createElement('canvas')
    const width = options?.width ?? 600
    const height = options?.height ?? 200
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return null
    }

    ctx.fillStyle = options?.backgroundColor ?? '#ffffff'
    ctx.fillRect(0, 0, width, height)

    return new Promise((resolve) => {
      const overlay = document.createElement('div')
      overlay.id = 'signature-capture-overlay'
      Object.assign(overlay.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '99998',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        direction: 'rtl',
      })

      const container = document.createElement('div')
      Object.assign(container.style, {
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: `${width + 48}px`,
        width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      })

      const title = document.createElement('h3')
      title.textContent = 'التوقيع'
      Object.assign(title.style, {
        fontSize: '18px',
        fontWeight: '600',
        marginBottom: '16px',
        textAlign: 'center',
        color: '#111',
      })

      const canvasContainer = document.createElement('div')
      Object.assign(canvasContainer.style, {
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        touchAction: 'none',
      })

      const sigCanvas = document.createElement('canvas')
      sigCanvas.width = width
      sigCanvas.height = height
      const sigCtx = sigCanvas.getContext('2d')
      if (!sigCtx) {
        resolve(null)
        return
      }

      sigCtx.fillStyle = options?.backgroundColor ?? '#ffffff'
      sigCtx.fillRect(0, 0, width, height)
      sigCtx.strokeStyle = options?.penColor ?? '#000000'
      sigCtx.lineWidth = options?.penWidth ?? 2
      sigCtx.lineCap = 'round'
      sigCtx.lineJoin = 'round'

      let drawing = false
      let lastX = 0
      let lastY = 0

      const startDraw = (x: number, y: number) => {
        drawing = true
        lastX = x
        lastY = y
      }

      const draw = (x: number, y: number) => {
        if (!drawing) {
          return
        }
        sigCtx.beginPath()
        sigCtx.moveTo(lastX, lastY)
        sigCtx.lineTo(x, y)
        sigCtx.stroke()
        lastX = x
        lastY = y
      }

      const endDraw = () => {
        drawing = false
      }

      sigCanvas.addEventListener('mousedown', (e) => {
        const rect = sigCanvas.getBoundingClientRect()
        startDraw(e.clientX - rect.left, e.clientY - rect.top)
      })
      sigCanvas.addEventListener('mousemove', (e) => {
        const rect = sigCanvas.getBoundingClientRect()
        draw(e.clientX - rect.left, e.clientY - rect.top)
      })
      sigCanvas.addEventListener('mouseup', endDraw)
      sigCanvas.addEventListener('mouseleave', endDraw)

      sigCanvas.addEventListener(
        'touchstart',
        (e) => {
          e.preventDefault()
          const rect = sigCanvas.getBoundingClientRect()
          const touch = e.touches[0]
          startDraw(touch.clientX - rect.left, touch.clientY - rect.top)
        },
        { passive: false },
      )
      sigCanvas.addEventListener(
        'touchmove',
        (e) => {
          e.preventDefault()
          const rect = sigCanvas.getBoundingClientRect()
          const touch = e.touches[0]
          draw(touch.clientX - rect.left, touch.clientY - rect.top)
        },
        { passive: false },
      )
      sigCanvas.addEventListener('touchend', endDraw)

      sigCanvas.addEventListener('pointerdown', (e) => {
        const rect = sigCanvas.getBoundingClientRect()
        startDraw(e.clientX - rect.left, e.clientY - rect.top)
      })
      sigCanvas.addEventListener('pointermove', (e) => {
        const rect = sigCanvas.getBoundingClientRect()
        draw(e.clientX - rect.left, e.clientY - rect.top)
      })
      sigCanvas.addEventListener('pointerup', endDraw)

      const buttonContainer = document.createElement('div')
      Object.assign(buttonContainer.style, {
        display: 'flex',
        gap: '12px',
        marginTop: '16px',
        justifyContent: 'center',
      })

      const confirmBtn = document.createElement('button')
      confirmBtn.textContent = 'تأكيد'
      Object.assign(confirmBtn.style, {
        padding: '10px 24px',
        backgroundColor: '#2563eb',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
      })
      confirmBtn.onclick = async () => {
        const dataUrl = sigCanvas.toDataURL('image/png')
        const base64 = dataUrl.split(',')[1]

        const saved = await fileService.writeFile(`signatures/signature_${Date.now()}.png`, base64)

        overlay.remove()

        resolve({
          path: saved ? `signatures/signature_${Date.now()}.png` : dataUrl,
          dataUrl,
          width: sigCanvas.width,
          height: sigCanvas.height,
        })
      }

      const clearBtn = document.createElement('button')
      clearBtn.textContent = 'مسح'
      Object.assign(clearBtn.style, {
        padding: '10px 24px',
        backgroundColor: '#f3f4f6',
        color: '#374151',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
      })
      clearBtn.onclick = () => {
        sigCtx.fillStyle = options?.backgroundColor ?? '#ffffff'
        sigCtx.fillRect(0, 0, width, height)
      }

      const cancelBtn = document.createElement('button')
      cancelBtn.textContent = 'إلغاء'
      Object.assign(cancelBtn.style, {
        padding: '10px 24px',
        backgroundColor: '#fef2f2',
        color: '#dc2626',
        border: '1px solid #fca5a5',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
      })
      cancelBtn.onclick = () => {
        overlay.remove()
        resolve(null)
      }

      buttonContainer.appendChild(cancelBtn)
      buttonContainer.appendChild(clearBtn)
      buttonContainer.appendChild(confirmBtn)

      canvasContainer.appendChild(sigCanvas)
      container.appendChild(title)
      container.appendChild(canvasContainer)
      container.appendChild(buttonContainer)
      overlay.appendChild(container)
      document.body.appendChild(overlay)
    })
  }
}

export const signatureCaptureWorkflow = new SignatureCaptureWorkflow()
