import type { MobileGitTransport, MobileGitTransportRequest, MobileGitTransportResult } from './mobileGitTransport'

type MobileGitNativeOperation = 'pull' | 'push'

export type MobileGitNativeModule = {
  pull: (request: MobileGitNativeRequest) => Promise<MobileGitNativeResult>
  push: (request: MobileGitNativeRequest) => Promise<MobileGitNativeResult>
}

export type MobileGitNativeRequest = {
  remoteUrl: string
  vaultId: string
}

export type MobileGitNativeResult =
  | {
      ok: true
    }
  | {
      message: string
      ok: false
    }

export function createNativeMobileGitTransport(nativeModule?: MobileGitNativeModule | null): MobileGitTransport {
  return {
    pull: (request) => runNativeGitOperation({ nativeModule, operation: 'pull', request }),
    push: (request) => runNativeGitOperation({ nativeModule, operation: 'push', request }),
  }
}

async function runNativeGitOperation({
  nativeModule,
  operation,
  request,
}: {
  nativeModule?: MobileGitNativeModule | null
  operation: MobileGitNativeOperation
  request: MobileGitTransportRequest
}): Promise<MobileGitTransportResult> {
  if (!nativeModule) {
    return unavailableNativeModuleResult()
  }

  try {
    return nativeResult(await nativeModule[operation](nativeRequest(request)))
  } catch {
    return { message: 'Mobile Git native operation failed.', state: 'failed' }
  }
}

function nativeRequest(request: MobileGitTransportRequest): MobileGitNativeRequest {
  return {
    remoteUrl: request.remote.url,
    vaultId: request.vault.id,
  }
}

function nativeResult(result: MobileGitNativeResult): MobileGitTransportResult {
  return result.ok
    ? { state: 'completed' }
    : { message: result.message, state: 'failed' }
}

function unavailableNativeModuleResult(): MobileGitTransportResult {
  return {
    message: 'Mobile Git native module is not available yet.',
    state: 'failed',
  }
}
