import type { MobileGitAuthStrategy, MobileGitRemote } from './mobileGitRemote'
import type { MobileVaultSync } from './mobileVaultConfig'

export type MobileGitCredentialState =
  | {
      state: 'missing'
    }
  | {
      state: 'available'
    }

export type MobileGitOperation = 'clone' | 'pull' | 'push'

export type MobileGitSyncPlan =
  | {
      state: 'localOnly'
      primaryAction: null
    }
  | {
      state: 'authRequired'
      authStrategy: MobileGitAuthStrategy
      host: string
      primaryAction: 'authenticate'
    }
  | {
      state: 'ready'
      canPull: true
      canPush: boolean
      primaryAction: MobileGitOperation
      remote: MobileGitRemote
    }
  | {
      state: 'syncing'
      operation: MobileGitOperation
      primaryAction: null
      remote: MobileGitRemote
    }
  | {
      state: 'failed'
      message: string
      operation: MobileGitOperation
      primaryAction: 'retry'
      remote: MobileGitRemote
    }

export function createMobileGitSyncPlan({
  credentials,
  failure,
  hasLocalChanges = false,
  operation,
  sync,
}: {
  credentials: MobileGitCredentialState
  failure?: { message: string; operation: MobileGitOperation }
  hasLocalChanges?: boolean
  operation?: MobileGitOperation
  sync: MobileVaultSync
}): MobileGitSyncPlan {
  if (sync.state === 'localOnly') {
    return { state: 'localOnly', primaryAction: null }
  }

  if (failure) {
    return failedPlan({ failure, remote: sync.remote })
  }

  if (operation) {
    return {
      state: 'syncing',
      operation,
      primaryAction: null,
      remote: sync.remote,
    }
  }

  if (credentials.state === 'missing') {
    return {
      state: 'authRequired',
      authStrategy: sync.authRequirement.strategy,
      host: sync.authRequirement.host,
      primaryAction: 'authenticate',
    }
  }

  return readyPlan({ hasLocalChanges, remote: sync.remote })
}

function readyPlan({
  hasLocalChanges,
  remote,
}: {
  hasLocalChanges: boolean
  remote: MobileGitRemote
}): MobileGitSyncPlan {
  return {
    state: 'ready',
    canPull: true,
    canPush: hasLocalChanges,
    primaryAction: hasLocalChanges ? 'push' : 'pull',
    remote,
  }
}

function failedPlan({
  failure,
  remote,
}: {
  failure: { message: string; operation: MobileGitOperation }
  remote: MobileGitRemote
}): MobileGitSyncPlan {
  return {
    state: 'failed',
    message: failure.message,
    operation: failure.operation,
    primaryAction: 'retry',
    remote,
  }
}
