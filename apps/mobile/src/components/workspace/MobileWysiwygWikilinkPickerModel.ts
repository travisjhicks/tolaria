import {
  mobilePersonMentionAutocompleteSuggestions,
  mobileWikilinkAutocompleteSuggestions,
  mobileWikilinkAutocompleteTarget,
} from '../../workspace/mobileWikilinkAutocomplete'
import type { MobileNote } from '../../workspace/mobileWorkspaceModel'
import type {
  NativeWysiwygInlineAutocompleteKind,
  NativeWysiwygWikilinkPayload,
} from './MobileWysiwygWikilinkBridgeModel'

export function mobileWysiwygWikilinkPickerSuggestions(
  notes: MobileNote[],
  query: string,
  kind: NativeWysiwygInlineAutocompleteKind = 'wikilink',
): MobileNote[] {
  return kind === 'personMention'
    ? mobilePersonMentionAutocompleteSuggestions(notes, query)
    : mobileWikilinkAutocompleteSuggestions(notes, query)
}

export function mobileWysiwygWikilinkPayloadForNote(
  note: MobileNote,
  sourceNote?: MobileNote | null,
): NativeWysiwygWikilinkPayload {
  return {
    label: note.title,
    target: mobileWikilinkAutocompleteTarget(note, sourceNote),
  }
}
