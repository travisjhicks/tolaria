import './global.css'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { MobileUiLab } from './src/screens/MobileUiLab'
import { mobileColors } from './src/ui/tokens'

export function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ backgroundColor: mobileColors.app, flex: 1 }}>
        <StatusBar style="dark" />
        <MobileUiLab />
      </SafeAreaView>
    </SafeAreaProvider>
  )
}
