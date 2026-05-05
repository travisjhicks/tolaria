import {
  createMobileGitCredentialRecord,
  type MobileGitCredentialStorage,
} from './mobileGitCredentialStorage'
import type { MobileVaultAuthRequirement } from './mobileVaultConfig'

export type MobileGitHubOAuthToken = {
  accessToken: string
  scope?: string
  tokenType: string
}

export type MobileGitHubOAuthSessionResult =
  | {
      state: 'succeeded'
      token: MobileGitHubOAuthToken
    }
  | {
      state: 'cancelled'
    }
  | {
      message: string
      state: 'failed'
    }

export type MobileGitHubOAuthSession = {
  authorize: () => Promise<MobileGitHubOAuthSessionResult>
}

export type ConnectMobileGitHubOAuthResult =
  | {
      state: 'connected'
    }
  | {
      state: 'cancelled'
    }
  | {
      message: string
      state: 'failed'
    }

export async function connectMobileGitHubOAuth({
  credentialStorage,
  now,
  session,
}: {
  credentialStorage: MobileGitCredentialStorage
  now: () => string
  session: MobileGitHubOAuthSession
}): Promise<ConnectMobileGitHubOAuthResult> {
  const result = await session.authorize()

  if (result.state !== 'succeeded') {
    return result
  }

  await credentialStorage.saveRecord(createMobileGitCredentialRecord({
    requirement: githubRequirement(),
    secret: result.token,
    storedAt: now(),
  }))

  return { state: 'connected' }
}

export function githubRequirement(): MobileVaultAuthRequirement {
  return { host: 'github.com', strategy: 'githubOAuth' }
}
