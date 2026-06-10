import { useCallback, useRef } from 'react'

/**
 * Returns a debounced version of `fn` and a `flush` function to invoke it immediately.
 *
 * @param {Function} fn    - The function to debounce
 * @param {number}   delay - Debounce delay in ms
 * @returns {{ debounced: Function, flush: Function }}
 */
export const useDebounce = (fn, delay = 300) => {
  const timerRef    = useRef(null)
  const lastArgsRef = useRef(null)

  const flush = useCallback(
    (...args) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      const invokeArgs = args.length ? args : lastArgsRef.current
      if (invokeArgs && fn) {
        fn(...invokeArgs)
      }
    },
    [fn],
  )

  const debounced = useCallback(
    (...args) => {
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
