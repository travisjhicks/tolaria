import { useEffect, useMemo, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, View } from 'react-native'
import type { WebViewMessageEvent } from 'react-native-webview'
import { RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor'
import { MobileEditorWikilinkSuggestions } from './MobileEditorWikilinkSuggestions'
import { parseEditorMessage } from './mobileEditorMessages'
import type { MobileNote } from './mobileNoteProjection'
import { createMobileEditorDraft, type MobileEditorDraft } from './mobileEditorDraft'
import {
  createMobileEditorDocument,
  createMobileEditorHtml,
} from './mobileEditorDocument'
import { resolveMobileRelationshipNote } from './mobileRelationshipRefs'
import { mobileEditorBridgeExtensions } from './mobileWikilinkEditorBridge'
import { mobileEditorCss, mobileEditorSetupScript } from './mobileEditorWebViewSetup'
import { styles } from './styles'

export function MobileEditorAdapter({
  notes,
  note,
  onCreateNote,
  onDraftChange,
  onOpenNote,
}: {
  notes: MobileNote[]
  note: MobileNote
  onCreateNote: () => void
  onDraftChange?: (draft: MobileEditorDraft) => void
  onOpenNote?: (noteId: string) => void
}) {
  const document = useMemo(() => createMobileEditorDocument(note), [note])
  const initialContent = useMemo(() => createMobileEditorHtml(document), [document])
  const [wikilinkQuery, setWikilinkQuery] = useState<string | null>(null)
  const draftTargetRef = useRef({ note, onDraftChange })
  useEffect(() => {
    draftTargetRef.current = { note, onDraftChange }
  }, [note, onDraftChange])
  const editor = useEditorBridge({
    avoidIosKeyboard: true,
    bridgeExtensions: mobileEditorBridgeExtensions,
    initialContent,
    onChange: () => {
      const draftTarget = draftTargetRef.current
      void editor.getHTML().then((editorHtml) => {
        draftTarget.onDraftChange?.(createMobileEditorDraft({ editorHtml, note: draftTarget.note }))
      })
    },
  })
  const handleMessage = (event: WebViewMessageEvent) => {
    const message = parseEditorMessage(event.nativeEvent.data)
    if (!message) return

    if (message.type === 'shortcut' && message.command === 'fileNewNote') {
      onCreateNote()
      return
    }
    if (message.type === 'wikilinkQuery') {
      setWikilinkQuery(message.query)
      return
    }
    if (message.type === 'listIndent') {
      handleListIndent({ direction: message.direction, editor })
      return
    }
    if (message.type !== 'openWikilink') return

    const targetNote = resolveMobileRelationshipNote({ notes, target: message.target })
    if (targetNote) {
      onOpenNote?.(targetNote.id)
    }
  }
  useEffect(() => {
    const timer = setTimeout(() => {
      applyMobileEditorWebViewSetup(editor)
    }, 250)

    return () => clearTimeout(timer)
  }, [editor, note.id])

  return (
    <View style={styles.editorAdapterContent}>
      <View style={styles.tentapEditor}>
        <RichText key={note.id} editor={editor} onLoad={() => applyMobileEditorWebViewSetup(editor)} onMessage={handleMessage} />
      </View>
      <MobileEditorWikilinkSuggestions
        excludeNoteId={note.id}
        notes={notes}
        onSelectNote={(targetNote) => {
          editor.insertWikilink({ label: targetNote.title, target: targetNote.id })
          setWikilinkQuery(null)
        }}
        query={wikilinkQuery}
      />
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
  editor.injectJS(mobileEditorSetupScript)
}

function handleListIndent({
  direction,
  editor,
}: {
  direction: 'in' | 'out'
  editor: ReturnType<typeof useEditorBridge>
}) {
  if (direction === 'in') {
    editor.sink()
    return
  }

  editor.lift()
}
