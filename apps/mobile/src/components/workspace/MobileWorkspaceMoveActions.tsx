import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '../ui/text'
import { mobileText } from '../../i18n/mobileText'
import { mobileColors, mobileSpace, mobileType } from '../../ui/tokens'

type MoveActionsProps = {
  canMoveDown: boolean
  canMoveUp: boolean
  onMoveDown: () => void
  onMoveUp: () => void
}

type SavedViewActionsProps = MoveActionsProps & {
  onDelete: () => void
}

type TypeSectionActionsProps = MoveActionsProps & {
  canDelete: boolean
  onDelete: () => void
}

type MoveActionLabels = {
  downLabel: string
  downTestID: string
  upLabel: string
  upTestID: string
}

const typeSectionMoveLabels = {
  downLabel: mobileText('sidebar.action.moveSectionDown'),
  downTestID: 'workspace-move-type-down-action',
  upLabel: mobileText('sidebar.action.moveSectionUp'),
  upTestID: 'workspace-move-type-up-action',
}

const savedViewMoveLabels = {
  downLabel: mobileText('sidebar.action.moveViewDown'),
  downTestID: 'workspace-move-view-down-action',
  upLabel: mobileText('sidebar.action.moveViewUp'),
  upTestID: 'workspace-move-view-up-action',
}

export const MobileTypeSectionActions = moveActionComponent<TypeSectionActionsProps>(
  typeSectionMoveLabels,
  ({ canDelete, onDelete }) => canDelete ? <DeleteTypeButton onPress={onDelete} /> : null,
)

export const MobileSavedViewActions = moveActionComponent<SavedViewActionsProps>(
  savedViewMoveLabels,
  ({ onDelete }) => <DeleteViewButton onPress={onDelete} />,
)

function moveActionComponent<Props extends MoveActionsProps>(
  labels: MoveActionLabels,
  trailingAction: (props: Props) => ReactNode,
) {
  return function ConfiguredMoveActions(props: Props) {
    return <SectionActions {...props} {...labels} trailingAction={trailingAction(props)} />
  }
}

function SectionActions({
  trailingAction,
  ...props
}: MoveActionsProps & {
  downLabel: string
  downTestID: string
  trailingAction?: ReactNode
  upLabel: string
  upTestID: string
}) {
  return (
    <View style={styles.actions}>
      <MoveActions {...props} />
      {trailingAction}
    </View>
  )
}

function MoveActions({
  canMoveDown,
  canMoveUp,
  downLabel,
  downTestID,
  onMoveDown,
  onMoveUp,
  upLabel,
  upTestID,
}: MoveActionsProps & {
  downLabel: string
  downTestID: string
  upLabel: string
  upTestID: string
}) {
  return (
    <View style={styles.actions}>
      <MoveButton disabled={!canMoveUp} label={upLabel} testID={upTestID} onPress={onMoveUp} />
      <MoveButton disabled={!canMoveDown} label={downLabel} testID={downTestID} onPress={onMoveDown} />
    </View>
  )
}

function MoveButton({
  disabled,
  label,
  onPress,
  testID,
}: {
  disabled: boolean
  label: string
  onPress: () => void
  testID: string
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        disabled ? styles.disabledButton : null,
        pressed && !disabled ? styles.pressedButton : null,
      ]}
      testID={testID}
      onPress={() => {
        if (!disabled) onPress()
      }}
    >
      <Text style={[styles.buttonText, disabled ? styles.disabledText : null]}>{label}</Text>
    </Pressable>
  )
}

function DeleteViewButton({ onPress }: { onPress: () => void }) {
  return (
    <DeleteButton
      label={mobileText('sidebar.action.deleteView')}
      testID="workspace-delete-view-action"
      onPress={onPress}
    />
  )
}

function DeleteTypeButton({ onPress }: { onPress: () => void }) {
  return (
    <DeleteButton
      label={mobileText('sidebar.action.deleteType')}
      testID="workspace-delete-type-action"
      onPress={onPress}
    />
  )
}

function DeleteButton({
  label,
  onPress,
  testID,
}: {
  label: string
  onPress: () => void
  testID: string
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, pressed ? styles.pressedButton : null]}
      testID={testID}
      onPress={onPress}
    >
      <Text style={styles.deleteText}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: mobileSpace.xs,
    marginRight: 'auto',
  },
  button: {
    borderRadius: 6,
    paddingHorizontal: mobileSpace.sm,
    paddingVertical: mobileSpace.xs,
  },
  buttonText: {
    color: mobileColors.textMuted,
    fontSize: mobileType.body,
    fontWeight: '500',
  },
  deleteText: {
    color: mobileColors.red,
    fontSize: mobileType.body,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.45,
  },
  disabledText: {
    color: mobileColors.textFaint,
  },
  pressedButton: {
    backgroundColor: mobileColors.graySoft,
  },
})
