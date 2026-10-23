export function IdeaCounter({ count }) {
  return (
    <p
      aria-live="polite"
      aria-label={`${count} ${count === 1 ? 'idea' : 'ideas'} on the canvas`}
      className="m-0 select-none whitespace-nowrap text-xs tabular-nums text-muted-foreground [text-shadow:0_0_6px_var(--background),0_0_6px_var(--background),0_0_14px_var(--background),0_0_14px_var(--background),0_0_28px_var(--background)]"
      data-testid="idea-counter"
    >
      {count} {count === 1 ? 'idea' : 'ideas'}
    </p>
  )
}
