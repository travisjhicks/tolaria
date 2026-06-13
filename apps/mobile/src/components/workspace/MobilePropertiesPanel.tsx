import type { ReactNode } from 'react'
import { Plus, X } from 'phosphor-react-native'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '../ui/text'
import { mobileCopy, mobileText } from '../../i18n/mobileText'
import { MobileChip } from '../../ui/MobileChip'
import { MobilePanel, MobileToolbar, MobileToolbarTitle } from '../../ui/MobilePanel'
import { MobilePropertyRow } from '../../ui/MobilePropertyRow'
import { desktopPanelParity, desktopPropertyParity, desktopRelationshipParity } from '../../ui/desktopParity'
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
      <MobileToolbar testID="properties-toolbar">
        <MobileToolbarTitle testID="properties-toolbar-title" title={mobileCopy.properties} variant="inspector" />
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
      <MobilePropertyRow label="Type" testID="property-row-type" value={<MobileChip label={note.type} tone={chipTone(note.typeTone)} />} />
      {note.status ? <MobilePropertyRow label={mobileText('noteList.sort.status')} testID="property-row-status" value={<MobileChip label={note.status} tone={statusTone(note.status)} />} /> : null}
      <MobilePropertyRow label={mobileText('noteList.sort.created')} testID="property-row-created" value={note.created} />
      <MobilePropertyRow label={mobileCopy.modified} testID="property-row-modified" value={note.modified} />
      <MobilePropertyRow label={mobileText('inspector.properties.workspace')} testID="property-row-workspace" value={<WorkspaceBadge label={note.workspace} />} />
      <PropertySection label="Tags" testID="property-section-tags">
        <TagWrap labels={note.tags} />
      </PropertySection>
      <MobilePropertyRow label="Links" testID="property-row-links" value={`${note.links}`} />
      {note.relationships.map((relationship) => (
        <PropertySection
          key={`${relationship.kind}-${relationship.label ?? relationship.values.map((value) => value.title).join('-')}`}
          label={relationshipHeading(relationship)}
          testID={`property-section-${relationship.kind}`}
        >
          <RelationshipValues values={relationship.values} />
        </PropertySection>
      ))}
      <PropertyActionRow label={mobileText('inspector.properties.addProperty')} testID="property-action-add-property" />
      <PropertyActionRow label={mobileText('inspector.relationship.addRelationship')} testID="property-action-add-relationship" />
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
  testID,
}: {
  children: ReactNode
  label: string
  testID?: string
}) {
  return (
    <View style={propertyStyles.sectionRow} testID={testID}>
      <Text style={propertyStyles.sectionLabel} testID={testID ? `${testID}-label` : undefined}>{label}</Text>
      <View style={propertyStyles.sectionValue} testID={testID ? `${testID}-value` : undefined}>{children}</View>
    </View>
  )
}

function PropertyActionRow({ label, testID }: { label: string; testID: string }) {
  const visibleLabel = label.replace(/^\+\s*/, '')

  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" style={({ pressed }) => [actionStyles.row, pressed ? actionStyles.rowPressed : null]} testID={testID}>
      <View style={actionStyles.label}>
        <View style={actionStyles.iconSlot}>
          <Plus color={mobileColors.textMuted} size={14} />
        </View>
        <Text numberOfLines={1} style={actionStyles.text}>{visibleLabel}</Text>
      </View>
      <View style={actionStyles.value} />
    </Pressable>
  )
}

function RelationshipValues({ values }: { values: MobileRelationshipValue[] }) {
  return (
    <View style={relationshipStyles.values}>
      {values.map((value) => (
        <View key={`${value.type}-${value.title}`} style={[relationshipStyles.row, relationshipRowTone(value.typeTone)]} testID={`relationship-row-${testIdSegment(value.title)}`}>
          <MobileTypeIcon size={desktopRelationshipParity.iconSize} tone={value.typeTone} type={value.type} />
          <Text numberOfLines={1} style={[relationshipStyles.text, relationshipTextTone(value.typeTone)]} testID={`relationship-row-${testIdSegment(value.title)}-text`}>{value.title}</Text>
          <View style={relationshipStyles.remove}>
            <X color={noteTypeColor(value.typeTone)} size={desktopRelationshipParity.removeIconSize} weight="bold" />
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
    <View style={propertyStyles.tagWrap} testID="property-tags-wrap">
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

function testIdSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
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
    minHeight: desktopRelationshipParity.removeIconSize,
    minWidth: desktopRelationshipParity.removeIconSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: mobileRadius.pill,
  },
  row: {
    minHeight: desktopPropertyParity.rowMinHeight,
    alignItems: 'center',
    flexDirection: 'row',
    gap: desktopRelationshipParity.rowGap,
    borderRadius: desktopRelationshipParity.rowRadius,
    paddingHorizontal: desktopRelationshipParity.rowPaddingHorizontal,
    paddingVertical: desktopRelationshipParity.rowPaddingVertical,
    width: '100%',
  },
  text: {
    flex: 1,
    fontSize: desktopRelationshipParity.textFontSize,
    fontWeight: desktopRelationshipParity.textFontWeight,
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
    borderRadius: desktopPropertyParity.actionRowRadius,
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
