import { useEffect } from 'react'

interface ShortcutHandlers {
  onSwitchTab?: (tab: number) => void
  onFocusSearch?: () => void
  onRefresh?: () => void
  onToggleHelp?: () => void
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing in input/textarea
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      switch (e.key) {
        case '1':
          handlers.onSwitchTab?.(0)
          break
        case '2':
          handlers.onSwitchTab?.(1)
          break
        case '/':
          e.preventDefault()
          handlers.onFocusSearch?.()
          break
        case 'r':
          handlers.onRefresh?.()
          break
        case '?':
          handlers.onToggleHelp?.()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
