# ADR-0111: Expo FileSystem for Mobile Vault Storage

Date: 2026-05-04

## Status

Accepted

## Context

Tolaria mobile stores vaults inside the app container first, then syncs them with Git. The storage boundary must work on iPad and iPhone immediately, keep Android feasible later, and avoid coupling the mobile note repository to native filesystem APIs.

Expo SDK 55 includes `expo-file-system`, a first-party Expo module with iOS and Android support. It gives Tolaria an app document directory for durable user data and can be tested behind a small adapter without invoking native filesystem calls in unit tests.

## Decision

Use `expo-file-system` as the mobile app-local vault storage dependency.

Keep all direct Expo filesystem calls inside the mobile storage adapter. The repository layer continues to depend only on `MobileVaultStorageDriver`, so future Git working-tree storage can replace or wrap the adapter without changing note-list/editor code.

## Consequences

- Mobile vaults start in Expo's document directory under a Tolaria-owned `vaults/` directory.
- Unit tests use a fake filesystem implementation instead of the simulator filesystem.
- Path validation is required at the adapter boundary to prevent reads or writes outside the selected vault root.
- The later Android port can keep the same contract, while any platform-specific document-directory behavior remains isolated to this adapter.
