import { useState } from 'react'

export function Logo() {
  const [isFading, setIsFading] = useState(false)
  const [isHidden, setIsHidden] = useState(false)

  if (isHidden) return null

  return (
    <h1 className="m-0">
      <button
        type="button"
        aria-label="Hide Visual Thinker logo"
        className={`m-0 border-0 bg-transparent p-0 select-none whitespace-nowrap text-foreground/85 transition-opacity duration-300 ease-out ${isFading ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
        onClick={() => setIsFading(true)}
        onTransitionEnd={(event) => {
          if (isFading && event.propertyName === 'opacity') setIsHidden(true)
        }}
        style={{
          fontFamily: "Georgia, 'Visual Thinker Serif Fallback', serif",
          fontSize: 'clamp(1.125rem, 1.4vw, 1.25rem)',
          fontWeight: 400,
          lineHeight: 1,
        }}
      >
        Visual Thinker
      </button>
    </h1>
  )
}
