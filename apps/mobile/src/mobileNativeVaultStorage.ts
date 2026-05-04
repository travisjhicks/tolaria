import * as ExpoFileSystem from 'expo-file-system/legacy'
import { createExpoMobileVaultStorage } from './mobileExpoVaultStorage'

export function createNativeMobileVaultStorage() {
  return createExpoMobileVaultStorage(ExpoFileSystem)
}
