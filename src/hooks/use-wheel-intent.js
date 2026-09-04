import { useCallback, useEffect, useRef } from 'react'

const wheelGestureEndDelay = 140

export function useWheelIntent({ onPan, onPanEnd, onPanStart }) {
  const gestureIntent = useRef(null)
  const gestureEndTimeout = useRef(null)

  const finishGesture = useCallback(() => {
    if (gestureIntent.current === 'pan') {
      onPanEnd()
    }

    gestureIntent.current = null
    gestureEndTimeout.current = null
  }, [onPanEnd])

  const onWheelCapture = useCallback(
    (event) => {
      clearTimeout(gestureEndTimeout.current)

      const isZoomOverride = event.ctrlKey || event.metaKey

      if (isZoomOverride) {
        gestureIntent.current = 'zoom'
      } else if (event.deltaX !== 0 && gestureIntent.current !== 'pan') {
        gestureIntent.current = 'pan'
        onPanStart()
      } else if (!gestureIntent.current) {
        gestureIntent.current = 'zoom'
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
    [finishGesture, onPan, onPanStart],
  )

  useEffect(
    () => () => clearTimeout(gestureEndTimeout.current),
    [],
  )

  return onWheelCapture
}
