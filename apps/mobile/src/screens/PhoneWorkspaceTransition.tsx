import type { ReactNode } from 'react'
import { StyleSheet, View, type ViewProps } from 'react-native'
import Animated, {
  FadeIn,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated'
import {
  phoneWorkspaceTransitionDirection,
  phoneWorkspaceTransitionDurationMs,
  type PhoneWorkspaceState,
  type PhoneWorkspaceTransitionDirection,
} from './phoneWorkspaceTransitions'

type PhoneWorkspaceTransitionProps = {
  children: ReactNode
  previousState: PhoneWorkspaceState
  state: PhoneWorkspaceState
  swipeHandlers?: ViewProps
}

export function PhoneWorkspaceTransition({
  children,
  previousState,
  state,
  swipeHandlers,
}: PhoneWorkspaceTransitionProps) {
  const direction = phoneWorkspaceTransitionDirection(previousState, state)

  return (
    <View
      {...swipeHandlers}
      style={styles.stage}
      testID="phone-transition-stage"
    >
      <Animated.View
        entering={enteringTransition(direction)}
        key={state}
        style={styles.stage}
      >
        {children}
      </Animated.View>
    </View>
  )
}

function enteringTransition(direction: PhoneWorkspaceTransitionDirection) {
  if (direction === 'fromLeft') return SlideInLeft.duration(phoneWorkspaceTransitionDurationMs)
  if (direction === 'fromRight') return SlideInRight.duration(phoneWorkspaceTransitionDurationMs)
  return FadeIn.duration(100)
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
  },
})
