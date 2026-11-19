import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    if (typeof window.matchMedia !== "function") return
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }
    const initialTimer = window.setTimeout(() => setIsMobile(mql.matches), 0)
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange)
      return () => {
        window.clearTimeout(initialTimer)
        mql.removeEventListener('change', onChange)
      }
    }

    mql.addListener(onChange)
    return () => {
      window.clearTimeout(initialTimer)
      mql.removeListener(onChange)
    }
  }, [])

  return isMobile
}
