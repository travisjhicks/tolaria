import { countWords, deriveDisplayTitleState, extractOutgoingLinks, extractSnippet } from '@tolaria/markdown'

export type MobileNoteRelationship = {
  id: string
  title: string
}

export type MobileNoteSource = {
  archived?: boolean
  belongsTo?: string[]
  id: string
  type: string
  has?: string[]
  icon: string
  date: string
  modified: string
  filename: string
  content: string
  relatedTo?: string[]
  status?: string
  tags: string[]
}

export type MobileNote = Omit<MobileNoteSource, 'filename'> & {
  archived: boolean
  backlinks: MobileNoteRelationship[]
  belongsTo: string[]
  has: string[]
  outgoingLinks: string[]
  relatedTo: string[]
  title: string
  snippet: string
  words: number
}

export function projectMobileNote(source: MobileNoteSource): MobileNote {
  const titleState = deriveDisplayTitleState({
    content: source.content,
    filename: source.filename,
  })

  return {
    id: source.id,
    archived: source.archived ?? false,
    belongsTo: source.belongsTo ?? [],
    type: source.type,
    has: source.has ?? [],
    icon: source.icon,
    date: source.date,
    modified: source.modified,
    content: source.content,
    relatedTo: source.relatedTo ?? [],
    status: source.status,
    tags: source.tags,
    backlinks: [],
    outgoingLinks: extractOutgoingLinks(source.content),
    title: titleState.title,
    snippet: extractSnippet(source.content),
    words: countWords(source.content),
  }
}

export function projectMobileNotes(sources: MobileNoteSource[]): MobileNote[] {
  const notes = sources.map(projectMobileNote)
  return notes.map((note) => ({
    ...note,
    backlinks: backlinksForNote({ note, notes }),
  }))
}

function backlinksForNote({
  note,
  notes,
}: {
  note: MobileNote
  notes: MobileNote[]
}) {
  const aliases = noteAliases(note)
  return notes
    .filter((source) => source.id !== note.id && source.outgoingLinks.some((link) => aliases.has(normalizeLinkKey(link))))
    .map((source) => ({ id: source.id, title: source.title }))
}

function noteAliases(note: MobileNote) {
  return new Set([note.id, note.title].map(normalizeLinkKey))
}

function normalizeLinkKey(value: string) {
  return value.trim().toLowerCase()
}
