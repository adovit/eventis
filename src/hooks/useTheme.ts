import { useCallback, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface UseThemeReturn {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

/**
 * useTheme — manages dark/light mode for Eventis.
 *
 * Derives initial state from the <html> class already applied by the
 * inline FOUC-prevention script in index.html — this avoids a DOM mismatch
 * on first render where React state and the document class disagree.
 *
 * Persistence: localStorage("theme") = "dark" | "light"
 * Fallback:    prefers-color-scheme (handled by the FOUC script; this hook
 *              only listens for OS changes after the component mounts)
 */
export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Read from the class already applied by the FOUC script
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    }
    return 'light'
  })

  const applyTheme = useCallback((next: Theme) => {
    const root = document.documentElement
    if (next === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', next)
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    applyTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, applyTheme])

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next)
  }, [applyTheme])

  // Sync with real-time OS preference changes (only when user has no explicit
  // localStorage preference — i.e. they rely on the system default)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    function handleChange(e: MediaQueryListEvent) {
      if (!localStorage.getItem('theme')) {
        applyTheme(e.matches ? 'dark' : 'light')
      }
    }
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [applyTheme])

  return { theme, toggleTheme, setTheme }
}
