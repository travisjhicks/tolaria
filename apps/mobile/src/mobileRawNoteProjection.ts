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
      belongsTo: metadata.belongsTo.length > 0 ? metadata.belongsTo : note.belongsTo,
      content: updatedContent,
      date: metadata.date ?? note.date,
      filename: `${note.id}.md`,
      has: metadata.has.length > 0 ? metadata.has : note.has,
      icon: metadata.icon ?? note.icon,
      id: note.id,
      modified: note.id === noteId ? 'Saved now' : note.modified,
      relatedTo: metadata.relatedTo.length > 0 ? metadata.relatedTo : note.relatedTo,
      status: metadata.status ?? note.status,
      tags: metadata.tags.length > 0 ? metadata.tags : note.tags,
      type: metadata.type ?? note.type,
    }
  })

  return projectMobileNotes(updatedSources)
}
