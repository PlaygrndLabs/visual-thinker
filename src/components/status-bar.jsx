const tips = {
  navigation: (
    <>
      <kbd className="font-sans">Space</kbd> + drag or middle-drag to pan
      <span className="mx-2 text-border">·</span>
      Scroll to zoom
    </>
  ),
  'add-node': <>Double click to add node</>,
}

export function StatusBar({ tipKey }) {
  return (
    <div
      aria-live="polite"
      className="grid whitespace-nowrap text-xs text-muted-foreground"
    >
      {Object.entries(tips).map(([key, tip]) => {
        const isActive = key === tipKey

        return (
          <span
            key={key}
            aria-hidden={!isActive}
            className={`col-start-1 row-start-1 text-center transition-opacity duration-200 ${
              isActive ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {tip}
          </span>
        )
      })}
    </div>
  )
}
