const tips = {
  pan: (
    <>
      <kbd className="font-sans">Space</kbd> + drag or middle-drag to pan
    </>
  ),
  zoom: <>Scroll to zoom</>,
  'add-node': <>Double click to add node</>,
  'remove-connection': <>Double click a connection to break it</>,
}

export function StatusBar({ tipKey }) {
  return (
    <div
      aria-live="polite"
      className="grid whitespace-nowrap text-xs text-muted-foreground [paint-order:stroke_fill] [-webkit-text-stroke:2px_var(--background)] [text-shadow:0_0_6px_var(--background),0_0_6px_var(--background),0_0_14px_var(--background),0_0_14px_var(--background),0_0_28px_var(--background),0_0_28px_var(--background),0_0_44px_var(--background),0_0_56px_var(--background)]"
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
