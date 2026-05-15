export function announceToScreenReader(message: string) {
  const el = document.getElementById('sr-announcer')
  if (el) {
    el.textContent = ''
    requestAnimationFrame(() => {
      el.textContent = message
    })
  }
}

export function createAriaLabel(label: string, description?: string): string {
  return description ? `${label} — ${description}` : label
}

export const ARIA_LIVE_REGION = (
  <div id="sr-announcer" role="status" aria-live="polite" aria-atomic="true" className="sr-only" />
)

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  )
}

export function trapFocus(container: HTMLElement, event: KeyboardEvent) {
  if (event.key !== 'Tab') {
    return
  }
  const elements = getFocusableElements(container)
  if (elements.length === 0) {
    return
  }

  const first = elements[0]
  const last = elements[elements.length - 1]

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

export function useAriaKeydown(keys: Record<string, () => void>) {
  return (event: React.KeyboardEvent) => {
    const handler = keys[event.key]
    if (handler) {
      event.preventDefault()
      handler()
    }
  }
}

export const focusStyles = {
  base: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background',
  within: 'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background rounded-xl',
}
