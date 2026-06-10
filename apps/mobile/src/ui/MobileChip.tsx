import { type StyleProp, type ViewStyle } from 'react-native'
import { Badge } from '../components/ui/badge'
import { Text } from '../components/ui/text'
import { cn } from '../components/ui/utils'

type MobileChipTone = 'blue' | 'gray' | 'green' | 'orange' | 'purple' | 'red'

export function MobileChip({
  label,
  style,
  tone = 'green',
}: {
  label: string
  style?: StyleProp<ViewStyle>
  tone?: MobileChipTone
}) {
  return (
    <Badge className={cn('rounded-md border-transparent px-2 py-1', chipClassNames[tone])} style={style} variant="secondary">
      <Text className={cn('text-xs font-semibold leading-none', chipTextClassNames[tone])} numberOfLines={1}>{label}</Text>
    </Badge>
  )
}

const chipClassNames: Record<MobileChipTone, string> = {
  blue: 'bg-blue-50',
  gray: 'bg-muted',
  green: 'bg-emerald-50',
  orange: 'bg-orange-50',
  purple: 'bg-violet-50',
  red: 'bg-red-50',
}

const chipTextClassNames: Record<MobileChipTone, string> = {
  blue: 'text-primary',
  gray: 'text-muted-foreground',
  green: 'text-emerald-700',
  orange: 'text-orange-700',
  purple: 'text-violet-700',
  red: 'text-red-700',
}
