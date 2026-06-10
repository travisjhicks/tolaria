import type { ReactNode } from 'react'
import { Button } from '../components/ui/button'
import { cn } from '../components/ui/utils'

export function MobileIconButton({
  accessibilityLabel,
  children,
  onPress,
  selected = false,
}: {
  accessibilityLabel: string
  children: ReactNode
  onPress?: () => void
  selected?: boolean
}) {
  return (
    <Button
      accessibilityLabel={accessibilityLabel}
      className={cn('h-9 w-9 rounded-md active:opacity-70', selected ? 'bg-accent' : 'bg-card')}
      hitSlop={8}
      onPress={onPress}
      size="icon"
      variant={selected ? 'secondary' : 'ghost'}
    >
      {children}
    </Button>
  )
}
