import { mobileDocumentBody } from '../workspace/mobileDocumentContent'
import type { MobileNote } from '../workspace/mobileWorkspaceModel'

type EditorDocumentTitleNote = Pick<MobileNote, 'rawContent' | 'title'>

export function shouldRenderEditorDocumentTitle(note: EditorDocumentTitleNote): boolean {
  if (!note.title.trim()) return false
  if (note.rawContent === undefined) return true

  return bodyStartsWithNonEmptyH1(mobileDocumentBody(note.rawContent))
}

function bodyStartsWithNonEmptyH1(body: string): boolean {
  const firstContentLine = body.split(/\r?\n/).find((line) => line.trim())
  return /^#\s+\S/u.test(firstContentLine?.trim() ?? '')
}
