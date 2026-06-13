import type { ReactNode } from 'react'
import { Plus, X } from 'phosphor-react-native'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '../ui/text'
import { mobileCopy, mobileText } from '../../i18n/mobileText'
import { MobileButton } from '../../ui/MobileButton'
import { MobileChip } from '../../ui/MobileChip'
import { MobilePanel, MobileToolbar, MobileToolbarTitle } from '../../ui/MobilePanel'
import { MobilePropertyRow } from '../../ui/MobilePropertyRow'
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
    <MobilePanel style={[styles.panel, compact ? styles.panelCompact : null]}>
      <MobileToolbar>
        <MobileToolbarTitle title={mobileCopy.properties} />
      </MobileToolbar>
      <ScrollView contentContainerStyle={styles.content}>
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
      <MobileButton
        icon={<Plus color={mobileColors.text} size={14} />}
        label={mobileText('inspector.properties.addProperty')}
        style={styles.fullWidthButton}
        variant="secondary"
      />
      <MobileButton
        icon={<Plus color={mobileColors.text} size={14} />}
        label={mobileText('inspector.relationship.addRelationship')}
        style={styles.fullWidthButton}
        variant="secondary"
      />
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
    <View style={styles.sectionRow}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.sectionValue}>{children}</View>
    </View>
  )
}

function RelationshipValues({ values }: { values: MobileRelationshipValue[] }) {
  return (
    <View style={styles.relationshipValues}>
      {values.map((value) => (
        <View key={`${value.type}-${value.title}`} style={[styles.relationshipRow, relationshipRowTone(value.typeTone)]}>
          <MobileTypeIcon size={12} tone={value.typeTone} type={value.type} />
          <Text numberOfLines={1} style={[styles.relationshipText, relationshipTextTone(value.typeTone)]}>{value.title}</Text>
          <View style={styles.relationshipRemove}>
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
    <View style={styles.tagWrap}>
      {labels.map((label) => <MobileChip key={label} label={label} tone={tagTone(label)} />)}
    </View>
  )
}

function WorkspaceBadge({ label }: { label: string }) {
  return <Text style={styles.workspaceBadge}>{label}</Text>
}

function relationshipRowTone(tone: MobileTone) {
  return { backgroundColor: noteTypeSoftColor(tone) }
}

function relationshipTextTone(tone: MobileTone) {
  return { color: noteTypeColor(tone) }
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: mobileSpace.md,
    paddingVertical: mobileSpace.sm,
  },
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
  fullWidthButton: {
    marginTop: mobileSpace.sm,
  },
  panel: {
    alignSelf: 'stretch',
    borderLeftWidth: StyleSheet.hairlineWidth,
    height: '100%',
    width: 300,
  },
  panelCompact: {
    width: 280,
  },
  relationshipRemove: {
    minHeight: 16,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: mobileRadius.pill,
    backgroundColor: mobileColors.card,
  },
  relationshipRow: {
    minHeight: 28,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.xs,
    borderRadius: mobileRadius.md,
    paddingHorizontal: mobileSpace.sm,
    paddingVertical: mobileSpace.xs,
    width: '100%',
  },
  relationshipText: {
    flex: 1,
    fontSize: mobileType.caption,
    fontWeight: '400',
  },
  relationshipValues: {
    alignItems: 'stretch',
    gap: mobileSpace.xs,
  },
  sectionLabel: {
    color: mobileColors.textMuted,
    fontSize: mobileType.caption,
  },
  sectionRow: {
    minHeight: 34,
    borderBottomColor: mobileColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: mobileSpace.sm,
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
