import { useEffect, useMemo, useRef } from 'react'
import { KeyboardAvoidingView, Platform, View } from 'react-native'
import type { WebViewMessageEvent } from 'react-native-webview'
import { RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor'
import type { MobileNote } from './mobileNoteProjection'
import { createMobileEditorDraft, type MobileEditorDraft } from './mobileEditorDraft'
import {
  createMobileEditorDocument,
  createMobileEditorHtml,
} from './mobileEditorDocument'
import { resolveMobileRelationshipNote } from './mobileRelationshipRefs'
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
  const handleMessage = (event: WebViewMessageEvent) => {
    const message = parseEditorMessage(event.nativeEvent.data)
    if (!message) return

    if (message.type === 'shortcut' && message.command === 'fileNewNote') {
      onCreateNote()
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

type MobileEditorMessage =
  | { target: string; type: 'openWikilink' }
  | { command: 'fileNewNote'; type: 'shortcut' }

function parseEditorMessage(data: string): MobileEditorMessage | null {
  try {
    const parsed = JSON.parse(data) as { command?: unknown; target?: unknown; type?: unknown }
    if (parsed.type === 'openWikilink' && typeof parsed.target === 'string') {
      return { target: parsed.target, type: 'openWikilink' }
    }
    if (parsed.type === 'shortcut' && parsed.command === 'fileNewNote') {
      return { command: 'fileNewNote', type: 'shortcut' }
    }
    return null
  } catch {
    return null
  }
}

const mobileEditorSetupScript = `
  document.documentElement.lang = navigator.language || "en";
  document.addEventListener("keydown", function(event) {
    if ((event.metaKey || event.ctrlKey) && !event.altKey && String(event.key).toLowerCase() === "n") {
      event.preventDefault();
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "shortcut",
        command: "fileNewNote"
      }));
      return;
    }
    if (event.key !== "Tab") return;
    var selection = window.getSelection();
    var node = selection && selection.anchorNode;
    var editor = document.querySelector(".ProseMirror");
    if (!editor || !node || !editor.contains(node.nodeType === 1 ? node : node.parentNode)) return;
    event.preventDefault();
    document.execCommand(event.shiftKey ? "outdent" : "indent");
  }, true);
  document.addEventListener("click", function(event) {
    var link = event.target && event.target.closest && event.target.closest("a[data-tolaria-wikilink='true']");
    if (!link) return;
    event.preventDefault();
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
      type: "openWikilink",
      target: decodeURIComponent(String(link.getAttribute("href") || "").replace(/^tolaria-note:/, ""))
    }));
  }, true);
  true;
`

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

  .ProseMirror a[data-tolaria-wikilink="true"] {
    color: #3367f6;
    font-weight: 650;
    text-decoration: none;
    border-radius: 5px;
    background: #e8eeff;
    padding: 1px 4px;
  }
`
