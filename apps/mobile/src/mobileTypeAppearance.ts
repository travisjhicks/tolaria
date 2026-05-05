export type MobileChipAppearance = {
  backgroundColor: string
  borderColor: string
  color: string
}

const neutralAppearance: MobileChipAppearance = {
  backgroundColor: '#f6f5f2',
  borderColor: '#dedbd4',
  color: '#66615a',
}

const appearances: Record<string, MobileChipAppearance> = {
  Essay: {
    backgroundColor: '#eaf6ee',
    borderColor: '#b8dec5',
    color: '#3f7f5f',
  },
  Evergreen: {
    backgroundColor: '#edf6e4',
    borderColor: '#c8dfaa',
    color: '#5f7f36',
  },
  Note: neutralAppearance,
  Project: {
    backgroundColor: '#eef3ff',
    borderColor: '#c7d8ff',
    color: '#356fd6',
  },
  Resource: {
    backgroundColor: '#f4edff',
    borderColor: '#ddcaff',
    color: '#7a54b8',
  },
  'Release Note': {
    backgroundColor: '#fff2e6',
    borderColor: '#f3cfaa',
    color: '#a56620',
  },
}

export function mobileTypeAppearance(type: string) {
  return appearances[type] ?? neutralAppearance
}

export function mobileRelationshipAppearance(type?: string) {
  return type ? mobileTypeAppearance(type) : neutralAppearance
}
