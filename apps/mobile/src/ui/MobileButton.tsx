import type { ReactNode } from 'react'
import { type StyleProp, type ViewStyle } from 'react-native'
import { Button, type ButtonProps } from '../components/ui/button'
import { Text } from '../components/ui/text'
import { cn } from '../components/ui/utils'

type MobileButtonVariant = 'primary' | 'secondary' | 'ghost'

export function MobileButton({
  disabled = false,
  icon,
  label,
  onPress,
  style,
  variant = 'secondary',
}: {
  disabled?: boolean
  icon?: ReactNode
  label: string
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  variant?: MobileButtonVariant
}) {
  const buttonVariant = buttonVariantByMobileVariant[variant]

  return (
    <Button
      className={cn('min-h-9 rounded-md px-3 active:opacity-75', buttonClassNames[variant])}
      disabled={disabled}
      onPress={onPress}
      size="sm"
      style={style}
      variant={buttonVariant}
    >
      {icon}
      <Text className={cn('text-sm font-semibold', labelClassNames[variant])} numberOfLines={1}>{label}</Text>
    </Button>
  )
}

const buttonVariantByMobileVariant: Record<MobileButtonVariant, ButtonProps['variant']> = {
  ghost: 'ghost',
  primary: 'default',
  secondary: 'secondary',
}

const buttonClassNames: Record<MobileButtonVariant, string> = {
  ghost: 'bg-transparent px-2 shadow-none',
  primary: '',
  secondary: 'bg-secondary',
}

const labelClassNames: Record<MobileButtonVariant, string> = {
  ghost: 'text-muted-foreground',
  primary: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
}
