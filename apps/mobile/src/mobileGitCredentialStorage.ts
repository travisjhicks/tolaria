import type { MobileGitAuthStrategy } from './mobileGitRemote'
import type { MobileGitCredentialState } from './mobileGitSyncPlan'
import type { MobileVaultAuthRequirement } from './mobileVaultConfig'

export type MobileGitCredentialKind = 'githubOAuthToken' | 'sshKeyReference'

export type MobileGitCredentialSecret = {
  accessToken: string
  scope?: string
  tokenType: string
}

export type MobileGitCredentialRecord = {
  host: string
  kind: MobileGitCredentialKind
  secret?: MobileGitCredentialSecret
  strategy: MobileGitAuthStrategy
  storedAt: string
}

export type MobileGitCredentialStorage = {
  loadState: (requirement: MobileVaultAuthRequirement) => Promise<MobileGitCredentialState>
  remove: (requirement: MobileVaultAuthRequirement) => Promise<void>
  saveRecord: (record: MobileGitCredentialRecord) => Promise<void>
}

export function createMobileGitCredentialRecord({
  requirement,
  secret,
  storedAt,
}: {
  requirement: MobileVaultAuthRequirement
  secret?: MobileGitCredentialSecret
  storedAt: string
}): MobileGitCredentialRecord {
  return {
    host: normalizeCredentialHost(requirement.host),
    kind: credentialKind(requirement.strategy),
    ...(secret ? { secret } : {}),
    strategy: requirement.strategy,
    storedAt,
  }
}

export function createMobileGitCredentialKey(requirement: MobileVaultAuthRequirement) {
  return [
    'tolaria',
    'git-credential',
    requirement.strategy,
    normalizeCredentialHost(requirement.host),
  ].join(':')
}

export function parseMobileGitCredentialRecord(content: string | null): MobileGitCredentialRecord | null {
  if (!content) {
    return null
  }

  try {
    return normalizeMobileGitCredentialRecord(JSON.parse(content))
  } catch {
    return null
  }
}

export function mobileGitCredentialState({
  record,
  requirement,
}: {
  record: MobileGitCredentialRecord | null
  requirement: MobileVaultAuthRequirement
}): MobileGitCredentialState {
  return record && matchesRequirement({ record, requirement })
    ? { state: 'available' }
    : { state: 'missing' }
}

export function serializeMobileGitCredentialRecord(record: MobileGitCredentialRecord) {
  return JSON.stringify(record)
}

function normalizeMobileGitCredentialRecord(value: unknown): MobileGitCredentialRecord | null {
  if (!isCredentialRecord(value)) {
    return null
  }

  return {
    host: normalizeCredentialHost(value.host),
    kind: value.kind,
    ...(isCredentialSecret(value.secret) ? { secret: value.secret } : {}),
    strategy: value.strategy,
    storedAt: value.storedAt,
  }
}

function matchesRequirement({
  record,
  requirement,
}: {
  record: MobileGitCredentialRecord
  requirement: MobileVaultAuthRequirement
}) {
  return record.strategy === requirement.strategy
    && record.host === normalizeCredentialHost(requirement.host)
    && record.kind === credentialKind(requirement.strategy)
}

function credentialKind(strategy: MobileGitAuthStrategy): MobileGitCredentialKind {
  return strategy === 'githubOAuth' ? 'githubOAuthToken' : 'sshKeyReference'
}

function normalizeCredentialHost(host: string) {
  return host.trim().toLowerCase()
}

function isCredentialRecord(value: unknown): value is MobileGitCredentialRecord {
  return typeof value === 'object'
    && value !== null
    && hasText((value as MobileGitCredentialRecord).host)
    && isCredentialKind((value as MobileGitCredentialRecord).kind)
    && isCredentialStrategy((value as MobileGitCredentialRecord).strategy)
    && hasText((value as MobileGitCredentialRecord).storedAt)
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isCredentialKind(value: unknown): value is MobileGitCredentialKind {
  return value === 'githubOAuthToken' || value === 'sshKeyReference'
}

function isCredentialStrategy(value: unknown): value is MobileGitAuthStrategy {
  return value === 'githubOAuth' || value === 'sshKey'
}

function isCredentialSecret(value: unknown): value is MobileGitCredentialSecret {
  return typeof value === 'object'
    && value !== null
    && hasText((value as MobileGitCredentialSecret).accessToken)
    && hasText((value as MobileGitCredentialSecret).tokenType)
    && isOptionalText((value as MobileGitCredentialSecret).scope)
}

function isOptionalText(value: unknown): value is string | undefined {
  return value === undefined || hasText(value)
}
