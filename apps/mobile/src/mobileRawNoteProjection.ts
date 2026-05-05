import { readMobileNoteFrontmatter } from './mobileNoteFrontmatter'
import { projectMobileNotes, type MobileNote } from './mobileNoteProjection'

export function applyMobileRawNoteContent({
  content,
  noteId,
  notes,
}: {
  content: string
  noteId: string
  notes: MobileNote[]
}) {
  const updatedSources = notes.map((note) => {
    const updatedContent = note.id === noteId ? content : note.content
    const metadata = readMobileNoteFrontmatter(updatedContent)

    return {
      archived: metadata.archived ?? note.archived,
      belongsTo: metadata.belongsTo,
      content: updatedContent,
      customProperties: metadata.customProperties,
      date: metadata.date ?? note.date,
      favorite: metadata.favorite ?? note.favorite,
      favoriteIndex: metadata.favoriteIndex ?? note.favoriteIndex,
      filename: `${note.id}.md`,
      has: metadata.has,
      icon: metadata.icon ?? note.icon,
      id: note.id,
      modified: note.id === noteId ? 'Saved now' : note.modified,
      relatedTo: metadata.relatedTo,
      relationships: metadata.relationships,
      status: metadata.status ?? note.status,
      tags: metadata.tags,
      type: metadata.type ?? note.type,
    }
  })

  return projectMobileNotes(updatedSources)
}
