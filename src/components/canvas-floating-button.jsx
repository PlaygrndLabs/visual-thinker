import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function CanvasFloatingButton({ className, grouped = false, ...props }) {
  return (
    <Button
      {...props}
      className={cn(
        'size-8 active:translate-y-0! disabled:opacity-100',
        grouped
          ? 'rounded-none'
          : 'rounded-md border border-border bg-background/95 shadow-[0_6px_18px_oklch(0.25_0.03_260/0.1)] backdrop-blur-sm',
        className,
      )}
      size="icon"
      variant="ghost"
    />
  )
}

export { CanvasFloatingButton }
