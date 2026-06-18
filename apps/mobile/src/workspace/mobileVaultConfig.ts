import type {
  MobilePrimaryNoteListPropertyOverrides,
  MobileVaultConfig,
  MobileVaultPrimaryNoteListConfig,
  MobileWorkspaceSnapshot,
} from './mobileWorkspaceModel'

type PrimaryNoteListTarget = keyof MobilePrimaryNoteListPropertyOverrides

export function normalizedDisplayProperties(displayProperties: string[]) {
  const seen = new Set<string>()
  return displayProperties
    .map((key) => key.trim())
    .filter((key) => {
      const normalized = key.toLowerCase()
      if (!normalized || seen.has(normalized)) return false
      seen.add(normalized)
      return true
    })
}

export function mobileVaultConfigWithPrimaryNoteListProperties(
  config: MobileVaultConfig | null | undefined,
  target: PrimaryNoteListTarget,
  displayProperties: string[],
): MobileVaultConfig {
  const normalizedConfig = normalizeMobileVaultConfig(config)
  const nextProperties = normalizedDisplayProperties(displayProperties)

  return {
    ...normalizedConfig,
    [target]: {
      ...(normalizedConfig[target] ?? {}),
      noteListProperties: nextProperties.length > 0 ? nextProperties : null,
    },
  }
}

export function mobileNoteListPropertyOverridesFromVaultConfig(
  config: MobileVaultConfig | null | undefined,
): MobilePrimaryNoteListPropertyOverrides | undefined {
  const normalizedConfig = normalizeMobileVaultConfig(config)
  const overrides: MobilePrimaryNoteListPropertyOverrides = {}

  addPrimaryNoteListOverride(overrides, 'allNotes', normalizedConfig.allNotes)
  addPrimaryNoteListOverride(overrides, 'inbox', normalizedConfig.inbox)

  return Object.keys(overrides).length > 0 ? overrides : undefined
}

export function snapshotWithMobileVaultConfig(
  snapshot: MobileWorkspaceSnapshot,
  config: MobileVaultConfig | null | undefined,
): MobileWorkspaceSnapshot {
  const vaultConfig = normalizeMobileVaultConfig(config)
  return {
    ...snapshot,
    noteListPropertyOverrides: mobileNoteListPropertyOverridesFromVaultConfig(vaultConfig),
    vaultConfig,
  }
}

export function parseMobileVaultConfig(content: string | null | undefined): MobileVaultConfig {
  if (!content) return {}

  try {
    return normalizeMobileVaultConfig(JSON.parse(content))
  } catch {
    return {}
  }
}

export function serializeMobileVaultConfig(config: MobileVaultConfig): string {
  return JSON.stringify(normalizeMobileVaultConfig(config))
}

export function normalizeMobileVaultConfig(value: unknown): MobileVaultConfig {
  if (!isRecord(value)) return {}

  const allNotes = normalizePrimaryNoteListConfig(value.allNotes)
  const inbox = normalizePrimaryNoteListConfig(value.inbox)
  const config: MobileVaultConfig = {}

  if (allNotes) config.allNotes = allNotes
  if (inbox) config.inbox = inbox

  return config
}

function addPrimaryNoteListOverride(
  overrides: MobilePrimaryNoteListPropertyOverrides,
  target: PrimaryNoteListTarget,
  config: MobileVaultPrimaryNoteListConfig | null | undefined,
) {
  const displayProperties = normalizedDisplayProperties(config?.noteListProperties ?? [])
  if (displayProperties.length > 0) overrides[target] = displayProperties
}

function normalizePrimaryNoteListConfig(value: unknown): MobileVaultPrimaryNoteListConfig | null {
  if (!isRecord(value)) return null

  const config: MobileVaultPrimaryNoteListConfig = {}
  if (Object.hasOwn(value, 'noteListProperties')) {
    config.noteListProperties = Array.isArray(value.noteListProperties)
      ? normalizedDisplayProperties(value.noteListProperties.filter(isString))
      : null
  }
  if (typeof value.explicitOrganization === 'boolean') {
    config.explicitOrganization = value.explicitOrganization
  }

  return Object.keys(config).length > 0 ? config : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}
