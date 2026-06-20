import {
  mobilePersonMentionAutocompleteSuggestions,
  mobileWikilinkAutocompleteSuggestions,
  mobileWikilinkAutocompleteTarget,
} from '../../workspace/mobileWikilinkAutocomplete'
import { searchEmojis, type EmojiEntry } from '../../../../../src/utils/emoji'
import type { MobileNote } from '../../workspace/mobileWorkspaceModel'
import type {
  NativeWysiwygInlineAutocompleteKind,
  NativeWysiwygMarkdownBlockPayload,
  NativeWysiwygPlainTextPayload,
  NativeWysiwygWikilinkPayload,
} from './MobileWysiwygWikilinkBridgeModel'
import {
  nativeWysiwygMarkdownBlockActions,
  type NativeWysiwygMarkdownBlockAction,
} from './MobileWysiwygFormatCommands'

const EMOJI_SHORTCODE_RESULT_LIMIT = 80
const slashCommandKeywords = {
  codeBlock: ['code', 'fence', 'snippet'],
  divider: ['divider', 'horizontal', 'rule', 'hr'],
  mathBlock: ['math', 'equation', 'latex', 'formula'],
  mermaid: ['mermaid', 'diagram', 'flowchart', 'graph'],
  table: ['table', 'grid'],
  whiteboard: ['whiteboard', 'tldraw', 'drawing', 'canvas'],
} as const satisfies Record<NativeWysiwygMarkdownBlockAction, readonly string[]>

export type MobileWysiwygSlashCommandSuggestion = {
  action: NativeWysiwygMarkdownBlockAction
  keywords: readonly string[]
}

export function mobileWysiwygWikilinkPickerSuggestions(
  notes: MobileNote[],
  query: string,
  kind: NativeWysiwygInlineAutocompleteKind = 'wikilink',
): MobileNote[] {
  if (kind === 'emoji') return []
  return kind === 'personMention'
    ? mobilePersonMentionAutocompleteSuggestions(notes, query)
    : mobileWikilinkAutocompleteSuggestions(notes, query)
}

export function mobileWysiwygEmojiPickerSuggestions(query: string): EmojiEntry[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return []

  return searchEmojis(normalizedQuery)
    .sort((left, right) => {
      const rankDelta = mobileWysiwygEmojiSuggestionRank(left, normalizedQuery)
        - mobileWysiwygEmojiSuggestionRank(right, normalizedQuery)
      return rankDelta || left.name.localeCompare(right.name)
    })
    .slice(0, EMOJI_SHORTCODE_RESULT_LIMIT)
}

export function mobileWysiwygSlashCommandPickerSuggestions(query: string): MobileWysiwygSlashCommandSuggestion[] {
  const normalizedQuery = query.trim().toLowerCase()
  const suggestions = nativeWysiwygMarkdownBlockActions.map((action) => ({
    action,
    keywords: slashCommandKeywords[action],
  }))

  if (!normalizedQuery) return suggestions
  return suggestions.filter((suggestion) => mobileWysiwygSlashCommandMatchesQuery(suggestion, normalizedQuery))
}

export function mobileWysiwygEmojiPayloadForEntry(
  entry: EmojiEntry,
): NativeWysiwygPlainTextPayload {
  return { text: entry.emoji }
}

export function mobileWysiwygSlashCommandPayloadForAction(
  action: NativeWysiwygMarkdownBlockAction,
): NativeWysiwygMarkdownBlockPayload {
  return { action }
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

function mobileWysiwygEmojiSuggestionRank(entry: EmojiEntry, query: string): number {
  const normalizedName = entry.name.toLowerCase()
  const tokens = normalizedName.split(/[^a-z0-9]+/u).filter(Boolean)
  if (normalizedName === query) return 0
  if (tokens.includes(query)) return 1
  if (tokens.some((token) => token.startsWith(query))) return 2
  if (normalizedName.startsWith(query)) return 3
  return 4
}

function mobileWysiwygSlashCommandMatchesQuery(
  suggestion: MobileWysiwygSlashCommandSuggestion,
  query: string,
): boolean {
  return suggestion.action.toLowerCase().includes(query)
    || suggestion.keywords.some((keyword) => keyword.includes(query))
}
