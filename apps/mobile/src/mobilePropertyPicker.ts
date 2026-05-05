export type MobilePropertyPickerKey = 'date' | 'icon' | 'status' | 'tags' | 'type'

export function nextMobilePropertyPicker({
  current,
  selected,
}: {
  current: MobilePropertyPickerKey | null
  selected: MobilePropertyPickerKey
}) {
  return current === selected ? null : selected
}

export function mobilePropertyDisplayValue({
  fallback = 'None',
  value,
}: {
  fallback?: string
  value: string | undefined
}) {
  return value?.trim() || fallback
}
