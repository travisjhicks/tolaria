import { describe, expect, it } from 'vitest'
import { createMobileVaultConfig, type MobileVaultConfig } from './mobileVaultConfig'
import { createMobileGitSyncPlan } from './mobileGitSyncPlan'

describe('createMobileGitSyncPlan', () => {
  it('keeps local-only vaults out of the sync/auth flow', () => {
    expect(createMobileGitSyncPlan({
      credentials: { state: 'missing' },
      sync: vaultConfig().sync,
    })).toEqual({
      state: 'localOnly',
      primaryAction: null,
    })
  })

  it('requires the configured auth strategy before remote sync', () => {
    expect(createMobileGitSyncPlan({
      credentials: { state: 'missing' },
      sync: githubVaultConfig().sync,
    })).toMatchObject({
      state: 'authRequired',
      authStrategy: 'githubOAuth',
      host: 'github.com',
      primaryAction: 'authenticate',
    })
  })

  it.each([
    { hasLocalChanges: false, canPush: false, primaryAction: 'pull' },
    { hasLocalChanges: true, canPush: true, primaryAction: 'push' },
  ] as const)('plans $primaryAction as the ready sync action', ({ canPush, hasLocalChanges, primaryAction }) => {
    expect(createMobileGitSyncPlan({
      credentials: { state: 'available' },
      hasLocalChanges,
      sync: githubVaultConfig().sync,
    })).toMatchObject({
      state: 'ready',
      canPull: true,
      canPush,
      primaryAction,
    })
  })

  it('surfaces active and failed operations around the same remote', () => {
    const sync = githubVaultConfig().sync

    expect(createMobileGitSyncPlan({
      credentials: { state: 'available' },
      operation: 'pull',
      sync,
    })).toMatchObject({
      state: 'syncing',
      operation: 'pull',
      primaryAction: null,
    })

    expect(createMobileGitSyncPlan({
      credentials: { state: 'available' },
      failure: { message: 'Authentication failed', operation: 'push' },
      sync,
    })).toMatchObject({
      state: 'failed',
      message: 'Authentication failed',
      operation: 'push',
      primaryAction: 'retry',
    })
  })
})

function vaultConfig(): MobileVaultConfig {
  return resultConfig(createMobileVaultConfig({ id: 'local', name: 'Local' }))
}

function githubVaultConfig(): MobileVaultConfig {
  return resultConfig(createMobileVaultConfig({
    id: 'tolaria',
    name: 'Tolaria',
    remoteUrl: 'https://github.com/refactoringhq/tolaria.git',
  }))
}

function resultConfig(result: ReturnType<typeof createMobileVaultConfig>): MobileVaultConfig {
  if (!result.ok) {
    throw new Error(result.error)
  }

  return result.config
}
