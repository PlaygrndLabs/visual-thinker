import { useCallback, useEffect, useRef } from 'react'

const wheelGestureEndDelay = 140

export function useWheelIntent({
  onPan,
  onPanEnd,
  onPanStart,
  onZoomEnd,
  onZoomStart,
}) {
  const gestureIntent = useRef(null)
  const gestureEndTimeout = useRef(null)

  const finishGesture = useCallback(() => {
    if (gestureIntent.current === 'pan') {
      onPanEnd()
    } else if (gestureIntent.current === 'zoom') {
      onZoomEnd()
    }

    gestureIntent.current = null
    gestureEndTimeout.current = null
  }, [onPanEnd, onZoomEnd])

  const onWheelCapture = useCallback(
    (event) => {
      clearTimeout(gestureEndTimeout.current)

      const isZoomOverride = event.ctrlKey || event.metaKey

      if (isZoomOverride) {
        if (!gestureIntent.current) onZoomStart()
        gestureIntent.current = 'zoom'
      } else if (event.deltaX !== 0 && gestureIntent.current !== 'pan') {
        gestureIntent.current = 'pan'
        onPanStart()
      } else if (!gestureIntent.current) {
        gestureIntent.current = 'zoom'
        onZoomStart()
      }

      if (gestureIntent.current === 'pan') {
        event.preventDefault()
        event.stopPropagation()
        onPan({ x: -event.deltaX, y: -event.deltaY })
      }

      gestureEndTimeout.current = setTimeout(
        finishGesture,
        wheelGestureEndDelay,
      )
    },
    [finishGesture, onPan, onPanStart, onZoomStart],
  )

  useEffect(
    () => () => clearTimeout(gestureEndTimeout.current),
    [],
  )

  return onWheelCapture
}
