import { useEffect, useMemo, useRef } from 'react'
import { KeyboardAvoidingView, Platform, View } from 'react-native'
import { RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor'
import type { MobileNote } from './mobileNoteProjection'
import { createMobileEditorDraft, type MobileEditorDraft } from './mobileEditorDraft'
import {
  createMobileEditorDocument,
  createMobileEditorHtml,
} from './mobileEditorDocument'
import { styles } from './styles'

export function MobileEditorAdapter({
  note,
  onDraftChange,
}: {
  note: MobileNote
  onDraftChange?: (draft: MobileEditorDraft) => void
}) {
  const document = useMemo(() => createMobileEditorDocument(note), [note])
  const initialContent = useMemo(() => createMobileEditorHtml(document), [document])
  const draftTargetRef = useRef({ note, onDraftChange })
  useEffect(() => {
    draftTargetRef.current = { note, onDraftChange }
  }, [note, onDraftChange])
  const editor = useEditorBridge({
    avoidIosKeyboard: true,
    initialContent,
    onChange: () => {
      const draftTarget = draftTargetRef.current
      void editor.getHTML().then((editorHtml) => {
        draftTarget.onDraftChange?.(createMobileEditorDraft({ editorHtml, note: draftTarget.note }))
      })
    },
  })
  useEffect(() => {
    const timer = setTimeout(() => {
      applyMobileEditorWebViewSetup(editor)
    }, 250)

    return () => clearTimeout(timer)
  }, [editor, note.id])

  return (
    <View style={styles.editorAdapterContent}>
      <View style={styles.tentapEditor}>
        <RichText key={note.id} editor={editor} onLoad={() => applyMobileEditorWebViewSetup(editor)} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.tentapToolbar}
      >
        <Toolbar editor={editor} />
      </KeyboardAvoidingView>
    </View>
  )
}

function applyMobileEditorWebViewSetup(editor: ReturnType<typeof useEditorBridge>) {
  editor.injectCSS(mobileEditorCss, 'tolaria-mobile-editor')
  editor.injectJS('document.documentElement.lang = navigator.language || "en"; true;')
}

const mobileEditorCss = `
  * {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif !important;
  }

  html,
  body,
  #root,
  .ProseMirror {
    color: #292825;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
    font-size: 18px;
    line-height: 1.55;
  }

  .ProseMirror {
    padding: 0;
  }

  .ProseMirror h1 {
    font-family: inherit;
    font-size: 42px;
    font-weight: 760;
    letter-spacing: 0;
    line-height: 1.08;
    margin: 18px 0 28px;
  }

  .ProseMirror p,
  .ProseMirror li,
  .ProseMirror blockquote {
    font-family: inherit;
  }
`
