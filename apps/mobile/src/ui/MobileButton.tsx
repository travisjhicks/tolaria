import type { ReactNode } from 'react'
import { type StyleProp, type ViewStyle } from 'react-native'
import { Button, type ButtonProps } from '../components/ui/button'
import { Text } from '../components/ui/text'
import { cn } from '../components/ui/utils'

type MobileButtonVariant = 'primary' | 'secondary' | 'ghost'
type MobileButtonDensity = 'default' | 'status'

export function MobileButton({
  density = 'default',
  disabled = false,
  icon,
  label,
  onPress,
  style,
  variant = 'secondary',
}: {
  density?: MobileButtonDensity
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
      className={cn(buttonDensityClassNames[density], buttonClassNames[variant])}
      disabled={disabled}
      onPress={onPress}
      size="sm"
      style={style}
      variant={buttonVariant}
    >
      {icon}
      <Text className={cn(labelDensityClassNames[density], labelClassNames[variant])} numberOfLines={1}>{label}</Text>
    </Button>
  )
}

const buttonVariantByMobileVariant: Record<MobileButtonVariant, ButtonProps['variant']> = {
  ghost: 'ghost',
  primary: 'default',
  secondary: 'secondary',
}

const buttonClassNames: Record<MobileButtonVariant, string> = {
  ghost: 'bg-transparent shadow-none',
  primary: '',
  secondary: 'bg-secondary',
}

const buttonDensityClassNames: Record<MobileButtonDensity, string> = {
  default: 'min-h-9 rounded-md px-3 active:opacity-75',
  status: 'h-6 min-h-0 rounded-sm px-1 py-0.5 active:opacity-75',
}

const labelClassNames: Record<MobileButtonVariant, string> = {
  ghost: 'text-muted-foreground',
  primary: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
}

const labelDensityClassNames: Record<MobileButtonDensity, string> = {
  default: 'text-sm font-medium',
  status: 'text-xs font-medium',
}
