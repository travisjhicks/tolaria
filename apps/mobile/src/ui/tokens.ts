import { desktopParityColors } from './desktopParity'

export const mobileColors = {
  app: desktopParityColors.surfaceApp,
  border: desktopParityColors.borderDefault,
  borderStrong: desktopParityColors.borderStrong,
  card: desktopParityColors.surfaceCard,
  blue: desktopParityColors.accentBlue,
  blueSoft: desktopParityColors.accentBlueLight,
  control: desktopParityColors.surfaceButton,
  controlPressed: desktopParityColors.borderStrong,
  danger: desktopParityColors.accentRed,
  dangerSoft: desktopParityColors.accentRedLight,
  editor: desktopParityColors.surfaceEditor,
  graySoft: desktopParityColors.stateHoverSubtle,
  green: desktopParityColors.accentGreen,
  greenSoft: desktopParityColors.accentGreenLight,
  orange: desktopParityColors.accentOrange,
  orangeSoft: desktopParityColors.accentOrangeLight,
  primary: desktopParityColors.accentBlue,
  primarySoft: desktopParityColors.accentBlueLight,
  purple: desktopParityColors.accentPurple,
  purpleSoft: desktopParityColors.accentPurpleLight,
  red: desktopParityColors.accentRed,
  redSoft: desktopParityColors.accentRedLight,
  selected: desktopParityColors.stateSelected,
  selectedStrong: desktopParityColors.stateSelectedStrong,
  sidebar: desktopParityColors.surfaceSidebar,
  text: desktopParityColors.textPrimary,
  textFaint: desktopParityColors.textFaint,
  textInverse: desktopParityColors.textInverse,
  textMuted: desktopParityColors.textSecondary,
  yellow: desktopParityColors.accentYellow,
  yellowSoft: desktopParityColors.accentYellowLight,
} as const

export const mobileSpace = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const

export const mobileRadius = {
  sm: 4,
  md: 6,
  lg: 8,
  pill: 999,
} as const

export const mobileType = {
  micro: 10,
  caption: 12,
  body: 14,
  bodyLarge: 16,
  title: 18,
  hero: 34,
} as const
