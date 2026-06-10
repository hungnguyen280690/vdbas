import { useCallback, useRef } from 'react'

export const useDebounce = <T extends unknown[]>(
  fn: (...args: T) => void,
  delay = 300,
): { debounced: (...args: T) => void; flush: (...args: T) => void } => {
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastArgsRef = useRef<T | null>(null)

  const flush = useCallback(
    (...args: T) => {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
      const invokeArgs = args.length ? args : lastArgsRef.current
      if (invokeArgs && fn) fn(...invokeArgs)
    },
    [fn],
  )

  const debounced = useCallback(
    (...args: T) => {
      lastArgsRef.current = args
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        if (fn) fn(...args)
      }, delay)
    },
    [fn, delay],
  )

  return { debounced, flush }
}

export default useDebounce
