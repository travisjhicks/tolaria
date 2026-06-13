import type { ReactNode } from 'react'
import { Plus, X } from 'phosphor-react-native'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '../ui/text'
import { mobileCopy, mobileText } from '../../i18n/mobileText'
import { MobileChip } from '../../ui/MobileChip'
import { MobilePanel, MobileToolbar, MobileToolbarTitle } from '../../ui/MobilePanel'
import { MobilePropertyRow } from '../../ui/MobilePropertyRow'
import { desktopPanelParity, desktopPropertyParity } from '../../ui/desktopParity'
import { mobileColors, mobileRadius, mobileSpace, mobileType } from '../../ui/tokens'
import type { MobileNote, MobileRelationship, MobileRelationshipValue, MobileTone } from '../../workspace/mobileWorkspaceModel'
import { MobileTypeIcon } from './MobileWorkspaceIcons'
import { chipTone, noteTypeColor, noteTypeSoftColor, statusTone, tagTone } from './mobileWorkspaceTone'

export function MobilePropertiesPanel({
  compact,
  note,
}: {
  compact: boolean
  note: MobileNote | null
}) {
  return (
    <MobilePanel style={[panelStyles.panel, compact ? panelStyles.panelCompact : null]} testID="properties-panel">
      <MobileToolbar>
        <MobileToolbarTitle title={mobileCopy.properties} />
      </MobileToolbar>
      <ScrollView contentContainerStyle={panelStyles.content}>
        {note ? <NoteProperties note={note} /> : <PropertiesEmptyState />}
      </ScrollView>
    </MobilePanel>
  )
}

function NoteProperties({ note }: { note: MobileNote }) {
  return (
    <>
      <MobilePropertyRow label="Type" value={<MobileChip label={note.type} tone={chipTone(note.typeTone)} />} />
      {note.status ? <MobilePropertyRow label={mobileText('noteList.sort.status')} value={<MobileChip label={note.status} tone={statusTone(note.status)} />} /> : null}
      <MobilePropertyRow label={mobileText('noteList.sort.created')} value={note.created} />
      <MobilePropertyRow label={mobileCopy.modified} value={note.modified} />
      <MobilePropertyRow label={mobileText('inspector.properties.workspace')} value={<WorkspaceBadge label={note.workspace} />} />
      <PropertySection label="Tags">
        <TagWrap labels={note.tags} />
      </PropertySection>
      <MobilePropertyRow label="Links" value={`${note.links}`} />
      {note.relationships.map((relationship) => (
        <PropertySection
          key={`${relationship.kind}-${relationship.label ?? relationship.values.map((value) => value.title).join('-')}`}
          label={relationshipHeading(relationship)}
        >
          <RelationshipValues values={relationship.values} />
        </PropertySection>
      ))}
      <PropertyActionRow label={mobileText('inspector.properties.addProperty')} />
      <PropertyActionRow label={mobileText('inspector.relationship.addRelationship')} />
    </>
  )
}

function PropertiesEmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{mobileText('inspector.empty.noNoteSelected')}</Text>
      <Text style={styles.emptyText}>{mobileText('inspector.empty.noProperties')}</Text>
    </View>
  )
}

function PropertySection({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <View style={propertyStyles.sectionRow}>
      <Text style={propertyStyles.sectionLabel}>{label}</Text>
      <View style={propertyStyles.sectionValue}>{children}</View>
    </View>
  )
}

function PropertyActionRow({ label }: { label: string }) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" style={({ pressed }) => [actionStyles.row, pressed ? actionStyles.rowPressed : null]}>
      <View style={actionStyles.label}>
        <View style={actionStyles.iconSlot}>
          <Plus color={mobileColors.textMuted} size={14} />
        </View>
        <Text numberOfLines={1} style={actionStyles.text}>{label}</Text>
      </View>
      <View style={actionStyles.value} />
    </Pressable>
  )
}

function RelationshipValues({ values }: { values: MobileRelationshipValue[] }) {
  return (
    <View style={relationshipStyles.values}>
      {values.map((value) => (
        <View key={`${value.type}-${value.title}`} style={[relationshipStyles.row, relationshipRowTone(value.typeTone)]}>
          <MobileTypeIcon size={12} tone={value.typeTone} type={value.type} />
          <Text numberOfLines={1} style={[relationshipStyles.text, relationshipTextTone(value.typeTone)]}>{value.title}</Text>
          <View style={relationshipStyles.remove}>
            <X color={noteTypeColor(value.typeTone)} size={11} weight="bold" />
          </View>
        </View>
      ))}
    </View>
  )
}

function relationshipHeading(relationship: MobileRelationship): string {
  if (relationship.kind === 'custom') {
    return relationship.label ?? 'Custom'
  }

  if (relationship.kind === 'belongsTo') return 'Belongs to'
  if (relationship.kind === 'has') return 'Has'
  return 'Related to'
}

function TagWrap({ labels }: { labels: string[] }) {
  return (
    <View style={propertyStyles.tagWrap}>
      {labels.map((label) => <MobileChip key={label} label={label} tone={tagTone(label)} />)}
    </View>
  )
}

function WorkspaceBadge({ label }: { label: string }) {
  return <Text style={propertyStyles.workspaceBadge}>{label}</Text>
}

function relationshipRowTone(tone: MobileTone) {
  return { backgroundColor: noteTypeSoftColor(tone) }
}

function relationshipTextTone(tone: MobileTone) {
  return { color: noteTypeColor(tone) }
}

const panelStyles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: desktopPropertyParity.panelPadding,
  },
  panel: {
    alignSelf: 'stretch',
    borderLeftWidth: StyleSheet.hairlineWidth,
    height: '100%',
    width: desktopPanelParity.inspectorWidth,
  },
  panelCompact: {
    width: 280,
  },
})

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: mobileSpace.xxl,
  },
  emptyText: {
    marginTop: mobileSpace.sm,
    color: mobileColors.textMuted,
    fontSize: mobileType.body,
    textAlign: 'center',
  },
  emptyTitle: {
    color: mobileColors.text,
    fontSize: mobileType.title,
    fontWeight: '600',
    textAlign: 'center',
  },
})

const relationshipStyles = StyleSheet.create({
  remove: {
    minHeight: 16,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: mobileRadius.pill,
    backgroundColor: mobileColors.card,
  },
  row: {
    minHeight: desktopPropertyParity.rowMinHeight,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.xs,
    borderRadius: mobileRadius.md,
    paddingHorizontal: mobileSpace.sm,
    paddingVertical: mobileSpace.xs,
    width: '100%',
  },
  text: {
    flex: 1,
    fontSize: desktopPropertyParity.labelTextSize,
    fontWeight: '500',
  },
  values: {
    alignItems: 'stretch',
    gap: mobileSpace.xs,
  },
})

const propertyStyles = StyleSheet.create({
  sectionLabel: {
    color: mobileColors.textMuted,
    fontSize: desktopPropertyParity.labelTextSize,
  },
  sectionRow: {
    minHeight: desktopPropertyParity.rowMinHeight,
    borderBottomColor: mobileColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: mobileSpace.sm,
    paddingHorizontal: desktopPropertyParity.rowPaddingHorizontal,
    paddingVertical: mobileSpace.sm,
  },
  sectionValue: {
    minWidth: 0,
  },
  tagWrap: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mobileSpace.xs,
  },
  workspaceBadge: {
    overflow: 'hidden',
    borderRadius: mobileRadius.pill,
    backgroundColor: mobileColors.graySoft,
    color: mobileColors.textMuted,
    fontSize: mobileType.micro,
    fontWeight: '400',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
})

const actionStyles = StyleSheet.create({
  iconSlot: {
    width: desktopPropertyParity.labelIconSlot,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    minWidth: 0,
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: mobileSpace.xs,
  },
  row: {
    minHeight: desktopPropertyParity.rowMinHeight,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    borderRadius: mobileRadius.sm,
    paddingHorizontal: desktopPropertyParity.rowPaddingHorizontal,
  },
  rowPressed: {
    backgroundColor: mobileColors.graySoft,
  },
  text: {
    minWidth: 0,
    flex: 1,
    color: mobileColors.textMuted,
    fontSize: desktopPropertyParity.labelTextSize,
  },
  value: {
    flex: 1,
  },
})
