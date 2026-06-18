import { RichText, TenTapStartKit, useEditorBridge, type EditorBridge } from '@10play/tentap-editor'
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native'
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import {
  mobileDocumentBody,
  mobileMarkdownBodyToTentapHtml,
  mobileNoteEditableContent,
} from '../../workspace/mobileDocumentContent'
import { mobileHtmlWithResolvedAttachmentUris } from '../../workspace/mobileAttachmentUris'
import type { MobileEditorBlock, MobileNote } from '../../workspace/mobileWorkspaceModel'
import { probeProps, type MobileLayoutProbe } from '../../qa/mobileLayoutProbe'
import { mobileColors, mobileSpace } from '../../ui/tokens'
import { MobileMarkdownFormattingToolbar } from './MobileMarkdownFormattingToolbar'
import { mobileTentapEditorCss } from './MobileWysiwygMarkdownEditorCss'
import {
  applyNativeWysiwygFormat,
  nativeWysiwygFormattingActions,
  type NativeWysiwygCommandBridge,
} from './MobileWysiwygFormatCommands'
import { nativeWysiwygDocumentContentFromJson } from './MobileWysiwygDocumentSerialization'
import { MobileWysiwygWikilinkPicker } from './MobileWysiwygWikilinkPicker'
import {
  nativeWysiwygDocumentWithInsertedWikilink,
  nativeWysiwygDocumentWithInsertedAttachment,
  nativeWysiwygInlineAutocompleteAtSelection,
  type NativeWysiwygAttachmentPayload,
  type NativeWysiwygInlineAutocomplete,
  type NativeWysiwygInlineAutocompleteKind,
  type NativeWysiwygSelection,
  type NativeWysiwygWikilinkPayload,
} from './MobileWysiwygWikilinkBridgeModel'
import {
  nativeWysiwygMutationLogLine,
  nativeWysiwygMutationProbeContent,
  nativeWysiwygMutationProof,
} from '../../qa/nativeWysiwygMutationProbe'
import {
  nativeWysiwygAutocompleteLogLine,
  nativeWysiwygAutocompleteProbeContent,
  nativeWysiwygAutocompleteProbeSelection,
  nativeWysiwygAutocompleteProof,
} from '../../qa/nativeWysiwygAutocompleteProbe'
import {
  nativeWysiwygWikilinkInsertLogLine,
  nativeWysiwygWikilinkInsertProbePayload,
  nativeWysiwygWikilinkInsertProof,
} from '../../qa/nativeWysiwygWikilinkInsertProbe'

type MobileWysiwygMarkdownEditorProps = {
  blocks: MobileEditorBlock[]
  bullets: string[]
  compact: boolean
  layoutProbe?: MobileLayoutProbe
  note: MobileNote
  notes: MobileNote[]
  onImportAttachment?: () => Promise<NativeWysiwygAttachmentPayload | null>
  onUpdateContent: (noteId: string, content: string) => void
  vaultRootUri?: string | null
  wysiwygAutocompleteProbe?: boolean
  wysiwygWikilinkInsertProbe?: boolean
  wysiwygMutationProbe?: boolean
}

type JsonReadableEditorBridge = EditorBridge & {
  getJSON: () => Promise<unknown>
}

type EditorStateReadableBridge = EditorBridge & {
  getEditorState: () => {
    selection?: {
      from?: unknown
      to?: unknown
    }
  }
}

type CssInjectableEditorBridge = EditorBridge & {
  injectCSS: (css: string, tag?: string) => void
}

type TimerHandle = ReturnType<typeof setTimeout>
type NativeTentapEditorBridgeOptions = Omit<MobileWysiwygMarkdownEditorProps, 'notes'> & {
  initialDocumentContent: string
  onInlineAutocomplete: NativeWysiwygInlineAutocompleteHandler
}
type NativeTentapEditorSurfaceProps = {
  editor: EditorBridge
  injectEditorCss: () => void
  insertWikilink: (payload: NativeWysiwygWikilinkPayload, selection?: NativeWysiwygSelection) => void
  insertAttachment: (payload: NativeWysiwygAttachmentPayload, selection?: NativeWysiwygSelection) => void
  layoutProbe?: MobileLayoutProbe
  notes: MobileNote[]
  onCloseWikilinkPicker: () => void
  onImportAttachment?: () => Promise<NativeWysiwygAttachmentPayload | null>
  onOpenToolbarWikilinkPicker: () => void
  pickerState: NativeWysiwygPickerState | null
  sourceNote: MobileNote
}
type NativeTentapEditorRefs = {
  acceptsEditorChangesRef: MutableRefObject<boolean>
  contentRef: MutableRefObject<string>
  editorReadyTimerRef: MutableRefObject<TimerHandle | null>
  editorRef: MutableRefObject<EditorBridge | null>
  firstEditorSerializationRef: MutableRefObject<boolean>
  hasAcceptedEditorChangeRef: MutableRefObject<boolean>
  inlineAutocompleteTimerRef: MutableRefObject<TimerHandle | null>
  saveTimerRef: MutableRefObject<TimerHandle | null>
}
type NativeWysiwygInlineAutocompleteHandler = (match: NativeWysiwygInlineAutocomplete | null) => void
type NativeWysiwygPickerState = {
  kind: NativeWysiwygInlineAutocompleteKind
  query: string
  replacementRange?: NativeWysiwygSelection
  source: 'inline' | 'toolbar'
}
type NativeWysiwygDocumentBuilder<Payload> = (request: {
  json: unknown
  payload: Payload
  selection?: NativeWysiwygSelection
}) => unknown | null
type NativeWysiwygEditorMutation<Payload> = (
  editor: EditorBridge | null,
  payload: Payload,
  selection?: NativeWysiwygSelection,
) => Promise<boolean>

type ContentSettableEditorBridge = EditorBridge & {
  setContent: (content: unknown) => void
}
type SelectionSettableEditorBridge = EditorBridge & {
  setSelection: (from: number, to: number) => void
}

export function MobileWysiwygMarkdownEditor({
  blocks,
  bullets,
  compact,
  layoutProbe,
  note,
  notes,
  onImportAttachment,
  onUpdateContent,
  vaultRootUri = null,
  wysiwygAutocompleteProbe = false,
  wysiwygWikilinkInsertProbe = false,
  wysiwygMutationProbe = false,
}: MobileWysiwygMarkdownEditorProps) {
  const [pickerState, setPickerState] = useState<NativeWysiwygPickerState | null>(null)
  const handleInlineAutocomplete = useCallback((match: NativeWysiwygInlineAutocomplete | null) => {
    setPickerState((current) => inlineAutocompletePickerState(current, match))
  }, [])
  const handleOpenToolbarWikilinkPicker = useCallback(() => {
    setPickerState({
      kind: 'wikilink',
      query: '',
      source: 'toolbar',
    })
  }, [])
  const handleCloseWikilinkPicker = useCallback(() => {
    setPickerState(null)
  }, [])
  const bridge = useNativeTentapEditorBridge({
    blocks,
    bullets,
    compact,
    initialDocumentContent: initialNativeEditorContent({ blocks, bullets, note }),
    note,
    onInlineAutocomplete: handleInlineAutocomplete,
    onUpdateContent,
    vaultRootUri,
    wysiwygAutocompleteProbe,
    wysiwygWikilinkInsertProbe,
    wysiwygMutationProbe,
  })

  return (
    <NativeTentapEditorSurface
      {...bridge}
      layoutProbe={layoutProbe}
      notes={notes}
      onImportAttachment={onImportAttachment}
      pickerState={pickerState}
      sourceNote={note}
      onCloseWikilinkPicker={handleCloseWikilinkPicker}
      onOpenToolbarWikilinkPicker={handleOpenToolbarWikilinkPicker}
    />
  )
}

function NativeTentapEditorSurface({
  editor,
  injectEditorCss,
  insertAttachment,
  insertWikilink,
  layoutProbe,
  notes,
  onCloseWikilinkPicker,
  onImportAttachment,
  onOpenToolbarWikilinkPicker,
  pickerState,
  sourceNote,
}: NativeTentapEditorSurfaceProps) {
  const handleFormat = useCallback(async (action: Parameters<typeof applyNativeWysiwygFormat>[1]) => {
    if (action === 'attachment') {
      const attachment = await onImportAttachment?.()
      if (!attachment) return

      insertAttachment(attachment)
      return
    }

    if (action === 'wikilink') {
      onOpenToolbarWikilinkPicker()
      return
    }
    applyNativeWysiwygFormat(editor as NativeWysiwygCommandBridge, action)
  }, [editor, insertAttachment, onImportAttachment, onOpenToolbarWikilinkPicker])
  const handleInsertWikilink = useCallback((payload: NativeWysiwygWikilinkPayload) => {
    insertWikilink(payload, pickerState?.replacementRange)
    onCloseWikilinkPicker()
  }, [insertWikilink, onCloseWikilinkPicker, pickerState?.replacementRange])

  return (
    <View {...probeProps(layoutProbe, 'editor.wysiwyg.form')} style={nativeEditorStyles.container} testID="editor-wysiwyg-form">
      <RichText
        editor={editor}
        {...probeProps(layoutProbe, 'editor.wysiwyg.richText')}
        style={nativeEditorStyles.richText}
        testID="editor-wysiwyg-input"
        onLoadEnd={injectEditorCss}
      />
      <KeyboardAvoidingView
        {...probeProps(layoutProbe, 'editor.wysiwyg.toolbarHost')}
        behavior="padding"
        style={nativeEditorStyles.toolbarHost}
      >
        <MobileMarkdownFormattingToolbar
          actions={nativeWysiwygFormattingActions}
          layoutProbe={layoutProbe}
          metricId="editor.wysiwyg.toolbar"
          onFormat={handleFormat}
        />
      </KeyboardAvoidingView>
      {pickerState ? (
        <MobileWysiwygWikilinkPicker
          initialQuery={pickerState.query}
          key={wikilinkPickerKey(pickerState)}
          kind={pickerState.kind}
          notes={notes}
          sourceNote={sourceNote}
          onClose={onCloseWikilinkPicker}
          onSelect={handleInsertWikilink}
        />
      ) : null}
    </View>
  )
}

function initialNativeEditorContent(
  props: Pick<MobileWysiwygMarkdownEditorProps, 'blocks' | 'bullets' | 'note'>,
): string {
  const { blocks, bullets, note } = props
  return mobileNoteEditableContent({
    ...note,
    editorBlocks: note.editorBlocks ?? blocks,
    editorBullets: bullets,
  })
}

function useNativeTentapEditorBridge({
  blocks,
  bullets,
  compact,
  initialDocumentContent,
  note,
  onInlineAutocomplete,
  onUpdateContent,
  vaultRootUri = null,
  wysiwygAutocompleteProbe = false,
  wysiwygWikilinkInsertProbe = false,
  wysiwygMutationProbe = false,
}: NativeTentapEditorBridgeOptions) {
  const initialBody = mobileDocumentBody(initialDocumentContent)
  const initialBodyHasContent = initialBody.trim().length > 0
  const [initialContent] = useState(() => mobileHtmlWithResolvedAttachmentUris(
    mobileMarkdownBodyToTentapHtml(initialBody),
    vaultRootUri,
  ))
  const refs = useNativeTentapEditorRefs(initialDocumentContent)

  const flushEditorDocument = useFlushEditorDocument({
    initialBodyHasContent,
    mutationProbeEnabled: wysiwygMutationProbe,
    noteId: note.id,
    onUpdateContent,
    refs,
    vaultRootUri,
    wikilinkInsertProbeEnabled: wysiwygWikilinkInsertProbe,
  })
  const scheduleEditorChange = useScheduleEditorChange(refs, flushEditorDocument, onInlineAutocomplete)
  const injectEditorCss = useEditorCssInjection({ compact, noteWidth: note.noteWidth, refs })
  const insertWikilink = useNativeWysiwygWikilinkInserter({ flushEditorDocument, refs })
  const insertAttachment = useNativeWysiwygAttachmentInserter({ flushEditorDocument, refs })

  const editor = useEditorBridge({
    avoidIosKeyboard: true,
    bridgeExtensions: TenTapStartKit,
    initialContent,
    onChange: scheduleEditorChange,
  })

  useEditorBridgeRef(refs.editorRef, editor)
  useEditableContentRef({ blocks, bullets, note, refs })
  useResetEditorChangeGate({ initialContent, noteId: note.id, refs })
  useNativeWysiwygAutocompleteProbe({ enabled: wysiwygAutocompleteProbe, refs })
  useNativeWysiwygWikilinkInsertProbe({ enabled: wysiwygWikilinkInsertProbe, flushEditorDocument, refs })
  useNativeWysiwygMutationProbe({ enabled: wysiwygMutationProbe, flushEditorDocument, refs, vaultRootUri })
  useFlushOnUnmount(refs, flushEditorDocument)

  return { editor, injectEditorCss, insertAttachment, insertWikilink }
}

function useNativeTentapEditorRefs(initialDocumentContent: string): NativeTentapEditorRefs {
  const acceptsEditorChangesRef = useRef(false)
  const contentRef = useRef(initialDocumentContent)
  const editorReadyTimerRef = useRef<TimerHandle | null>(null)
  const editorRef = useRef<EditorBridge | null>(null)
  const firstEditorSerializationRef = useRef(true)
  const hasAcceptedEditorChangeRef = useRef(false)
  const inlineAutocompleteTimerRef = useRef<TimerHandle | null>(null)
  const saveTimerRef = useRef<TimerHandle | null>(null)

  return useMemo(() => ({
    acceptsEditorChangesRef,
    contentRef,
    editorReadyTimerRef,
    editorRef,
    firstEditorSerializationRef,
    hasAcceptedEditorChangeRef,
    inlineAutocompleteTimerRef,
    saveTimerRef,
  }), [
    acceptsEditorChangesRef,
    contentRef,
    editorReadyTimerRef,
    editorRef,
    firstEditorSerializationRef,
    hasAcceptedEditorChangeRef,
    inlineAutocompleteTimerRef,
    saveTimerRef,
  ])
}

function useFlushEditorDocument({
  initialBodyHasContent,
  mutationProbeEnabled,
  noteId,
  onUpdateContent,
  refs,
  vaultRootUri,
  wikilinkInsertProbeEnabled,
}: {
  initialBodyHasContent: boolean
  mutationProbeEnabled: boolean
  noteId: string
  onUpdateContent: (noteId: string, content: string) => void
  refs: NativeTentapEditorRefs
  vaultRootUri?: string | null
  wikilinkInsertProbeEnabled: boolean
}) {
  return useCallback(() => {
    flushEditorDocumentFromBridge({
      initialBodyHasContent,
      mutationProbeEnabled,
      noteId,
      onUpdateContent,
      refs,
      vaultRootUri,
      wikilinkInsertProbeEnabled,
    })
  }, [initialBodyHasContent, mutationProbeEnabled, noteId, onUpdateContent, refs, vaultRootUri, wikilinkInsertProbeEnabled])
}

function flushEditorDocumentFromBridge({
  initialBodyHasContent,
  mutationProbeEnabled,
  noteId,
  onUpdateContent,
  refs,
  vaultRootUri,
  wikilinkInsertProbeEnabled,
}: {
  initialBodyHasContent: boolean
  mutationProbeEnabled: boolean
  noteId: string
  onUpdateContent: (noteId: string, content: string) => void
  refs: NativeTentapEditorRefs
  vaultRootUri?: string | null
  wikilinkInsertProbeEnabled: boolean
}) {
  const editor = refs.editorRef.current
  if (!isJsonReadableEditorBridge(editor)) return

  void editor.getJSON()
    .then((json) => writeEditorJsonToMarkdown({
      initialBodyHasContent,
      json,
      mutationProbeEnabled,
      noteId,
      onUpdateContent,
      refs,
      vaultRootUri,
      wikilinkInsertProbeEnabled,
    }))
    .catch((error: unknown) => {
      console.warn('[mobile-editor] Failed to read TenTap JSON:', error)
    })
}

function writeEditorJsonToMarkdown({
  initialBodyHasContent,
  json,
  mutationProbeEnabled,
  noteId,
  onUpdateContent,
  refs,
  vaultRootUri,
  wikilinkInsertProbeEnabled,
}: {
  initialBodyHasContent: boolean
  json: unknown
  mutationProbeEnabled: boolean
  noteId: string
  onUpdateContent: (noteId: string, content: string) => void
  refs: NativeTentapEditorRefs
  vaultRootUri?: string | null
  wikilinkInsertProbeEnabled: boolean
}) {
  const nextContent = nativeWysiwygDocumentContentFromJson({
    currentContent: refs.contentRef.current,
    initialBodyHasContent,
    isFirstSerialization: refs.firstEditorSerializationRef.current,
    json,
    vaultRootUri,
  })
  refs.firstEditorSerializationRef.current = false
  if (!nextContent.skipped && nextContent.content !== refs.contentRef.current) {
    onUpdateContent(noteId, nextContent.content)
    if (mutationProbeEnabled) publishNativeWysiwygMutationProof(noteId, nextContent.content)
    if (wikilinkInsertProbeEnabled) publishNativeWysiwygWikilinkInsertProof(noteId, nextContent.content)
  }
}

function useNativeWysiwygMutationProbe({
  enabled,
  flushEditorDocument,
  refs,
  vaultRootUri,
}: {
  enabled: boolean
  flushEditorDocument: () => void
  refs: NativeTentapEditorRefs
  vaultRootUri?: string | null
}) {
  useEffect(() => {
    if (!enabled) return undefined

    const contentTimer = setTimeout(() => {
      const editor = refs.editorRef.current
      if (!isContentSettableEditorBridge(editor)) return

      refs.hasAcceptedEditorChangeRef.current = true
      editor.setContent(nativeWysiwygMutationProbeContent(vaultRootUri))
      refs.saveTimerRef.current = setTimeout(flushEditorDocument, 500)
    }, 1500)

    return () => {
      clearTimeout(contentTimer)
      if (refs.saveTimerRef.current) clearTimeout(refs.saveTimerRef.current)
    }
  }, [enabled, flushEditorDocument, refs, vaultRootUri])
}

function useNativeWysiwygAutocompleteProbe({
  enabled,
  refs,
}: {
  enabled: boolean
  refs: NativeTentapEditorRefs
}) {
  useEffect(() => {
    if (!enabled) return undefined

    let detectTimer: TimerHandle | null = null
    let probeTimer: TimerHandle | null = null
    const runProbe = () => {
      if (!refs.acceptsEditorChangesRef.current) {
        probeTimer = setTimeout(runProbe, 250)
        return
      }

      const editor = refs.editorRef.current
      if (!isContentSettableEditorBridge(editor) || !isSelectionSettableEditorBridge(editor)) return

      editor.setContent(nativeWysiwygAutocompleteProbeContent())
      const selection = nativeWysiwygAutocompleteProbeSelection()
      editor.setSelection(selection.from, selection.to)
      detectTimer = setTimeout(() => {
        void detectNativeWysiwygInlineAutocomplete(editor)
          .then((match) => {
            console.info(nativeWysiwygAutocompleteLogLine(nativeWysiwygAutocompleteProof(match)))
          })
          .catch((error: unknown) => {
            console.warn('[mobile-editor] Failed to run native WYSIWYG autocomplete probe:', error)
          })
      }, 500)
    }

    probeTimer = setTimeout(runProbe, 500)

    return () => {
      if (detectTimer) clearTimeout(detectTimer)
      if (probeTimer) clearTimeout(probeTimer)
    }
  }, [enabled, refs])
}

function publishNativeWysiwygMutationProof(noteId: string, content: string): void {
  if (Platform.OS === 'web') return

  console.info(nativeWysiwygMutationLogLine(nativeWysiwygMutationProof({ content, noteId })))
}

function publishNativeWysiwygWikilinkInsertProof(noteId: string, content: string): void {
  if (Platform.OS === 'web') return

  console.info(nativeWysiwygWikilinkInsertLogLine(nativeWysiwygWikilinkInsertProof({ content, noteId })))
}

function useNativeWysiwygWikilinkInserter({
  flushEditorDocument,
  refs,
}: {
  flushEditorDocument: () => void
  refs: NativeTentapEditorRefs
}) {
  return useNativeWysiwygInserter({
    flushEditorDocument,
    insertIntoEditor: insertWikilinkIntoNativeEditor,
    refs,
    warning: '[mobile-editor] Failed to insert native WYSIWYG wikilink:',
  })
}

function useNativeWysiwygAttachmentInserter({
  flushEditorDocument,
  refs,
}: {
  flushEditorDocument: () => void
  refs: NativeTentapEditorRefs
}) {
  return useNativeWysiwygInserter({
    flushEditorDocument,
    insertIntoEditor: insertAttachmentIntoNativeEditor,
    refs,
    warning: '[mobile-editor] Failed to insert native WYSIWYG attachment:',
  })
}

function useNativeWysiwygInserter<Payload>({
  flushEditorDocument,
  insertIntoEditor,
  refs,
  warning,
}: {
  flushEditorDocument: () => void
  insertIntoEditor: NativeWysiwygEditorMutation<Payload>
  refs: NativeTentapEditorRefs
  warning: string
}) {
  const { editorRef, hasAcceptedEditorChangeRef, saveTimerRef } = refs

  return useCallback((payload: Payload, selection?: NativeWysiwygSelection) => {
    void insertIntoEditor(editorRef.current, payload, selection)
      .then((inserted) => {
        if (!inserted) return

        hasAcceptedEditorChangeRef.current = true
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(flushEditorDocument, 250)
      })
      .catch((error: unknown) => {
        console.warn(warning, error)
      })
  }, [editorRef, flushEditorDocument, hasAcceptedEditorChangeRef, insertIntoEditor, saveTimerRef, warning])
}

async function insertWikilinkIntoNativeEditor(
  editor: EditorBridge | null,
  payload: NativeWysiwygWikilinkPayload,
  selection?: NativeWysiwygSelection,
): Promise<boolean> {
  return insertPayloadIntoNativeEditor(editor, payload, selection, nativeWysiwygDocumentWithInsertedWikilink)
}

async function insertAttachmentIntoNativeEditor(
  editor: EditorBridge | null,
  payload: NativeWysiwygAttachmentPayload,
  selection?: NativeWysiwygSelection,
): Promise<boolean> {
  return insertPayloadIntoNativeEditor(editor, payload, selection, nativeWysiwygDocumentWithInsertedAttachment)
}

async function insertPayloadIntoNativeEditor<Payload>(
  editor: EditorBridge | null,
  payload: Payload,
  selection: NativeWysiwygSelection | undefined,
  buildDocument: NativeWysiwygDocumentBuilder<Payload>,
): Promise<boolean> {
  if (!isJsonReadableEditorBridge(editor) || !isContentSettableEditorBridge(editor)) return false

  const json = await editor.getJSON()
  const nextJson = buildDocument({
    json,
    payload,
    selection: selection ?? nativeWysiwygEditorSelection(editor),
  })
  if (!nextJson) return false

  editor.setContent(nextJson)
  return true
}

function nativeWysiwygEditorSelection(editor: EditorBridge): NativeWysiwygSelection | undefined {
  if (!isEditorStateReadableBridge(editor)) return undefined

  const selection = editor.getEditorState().selection
  if (typeof selection?.from !== 'number' || typeof selection.to !== 'number') return undefined

  return {
    from: selection.from,
    to: selection.to,
  }
}

function useNativeWysiwygWikilinkInsertProbe({
  enabled,
  flushEditorDocument,
  refs,
}: {
  enabled: boolean
  flushEditorDocument: () => void
  refs: NativeTentapEditorRefs
}) {
  const hasInsertedProbeWikilinkRef = useRef(false)

  useEffect(() => {
    if (!enabled) {
      hasInsertedProbeWikilinkRef.current = false
      return undefined
    }
    if (hasInsertedProbeWikilinkRef.current) return undefined

    let insertTimer: TimerHandle | null = null
    const insertWhenReady = () => {
      if (!refs.acceptsEditorChangesRef.current) {
        insertTimer = setTimeout(insertWhenReady, 250)
        return
      }

      const editor = refs.editorRef.current
      hasInsertedProbeWikilinkRef.current = true
      void insertWikilinkIntoNativeEditor(editor, nativeWysiwygWikilinkInsertProbePayload())
        .then((inserted) => {
          if (!inserted) {
            hasInsertedProbeWikilinkRef.current = false
            return
          }

          refs.hasAcceptedEditorChangeRef.current = true
          refs.saveTimerRef.current = setTimeout(flushEditorDocument, 500)
        })
        .catch((error: unknown) => {
          hasInsertedProbeWikilinkRef.current = false
          console.warn('[mobile-editor] Failed to run native WYSIWYG wikilink insert probe:', error)
        })
    }

    insertTimer = setTimeout(insertWhenReady, 250)

    return () => {
      if (insertTimer) clearTimeout(insertTimer)
      if (refs.saveTimerRef.current) clearTimeout(refs.saveTimerRef.current)
    }
  }, [enabled, flushEditorDocument, refs])
}

function inlineAutocompletePickerState(
  current: NativeWysiwygPickerState | null,
  match: NativeWysiwygInlineAutocomplete | null,
): NativeWysiwygPickerState | null {
  if (current?.source === 'toolbar') return current
  if (!match) return current?.source === 'inline' ? null : current

  return {
    kind: match.kind,
    query: match.query,
    replacementRange: match.range,
    source: 'inline',
  }
}

function wikilinkPickerKey(state: NativeWysiwygPickerState): string {
  return [
    state.source,
    state.kind,
    state.query,
    state.replacementRange?.from ?? 'selection',
    state.replacementRange?.to ?? 'selection',
  ].join(':')
}

function useScheduleEditorChange(
  refs: NativeTentapEditorRefs,
  flushEditorDocument: () => void,
  onInlineAutocomplete: NativeWysiwygInlineAutocompleteHandler,
) {
  const {
    acceptsEditorChangesRef,
    editorRef,
    hasAcceptedEditorChangeRef,
    inlineAutocompleteTimerRef,
    saveTimerRef,
  } = refs

  return useCallback(() => {
    if (!acceptsEditorChangesRef.current) return
    hasAcceptedEditorChangeRef.current = true
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(flushEditorDocument, 250)
    if (inlineAutocompleteTimerRef.current) clearTimeout(inlineAutocompleteTimerRef.current)
    inlineAutocompleteTimerRef.current = setTimeout(() => {
      void detectNativeWysiwygInlineAutocomplete(editorRef.current)
        .then(onInlineAutocomplete)
        .catch((error: unknown) => {
          console.warn('[mobile-editor] Failed to detect native WYSIWYG autocomplete:', error)
        })
    }, 80)
  }, [
    acceptsEditorChangesRef,
    editorRef,
    flushEditorDocument,
    hasAcceptedEditorChangeRef,
    inlineAutocompleteTimerRef,
    onInlineAutocomplete,
    saveTimerRef,
  ])
}

async function detectNativeWysiwygInlineAutocomplete(
  editor: EditorBridge | null,
): Promise<NativeWysiwygInlineAutocomplete | null> {
  if (!isJsonReadableEditorBridge(editor)) return null

  return nativeWysiwygInlineAutocompleteAtSelection({
    json: await editor.getJSON(),
    selection: nativeWysiwygEditorSelection(editor),
  })
}

function useEditorCssInjection({
  compact,
  noteWidth,
  refs,
}: {
  compact: boolean
  noteWidth: MobileNote['noteWidth']
  refs: NativeTentapEditorRefs
}) {
  const { acceptsEditorChangesRef, editorReadyTimerRef, editorRef } = refs

  return useCallback(() => {
    if (isCssInjectableEditorBridge(editorRef.current)) {
      editorRef.current.injectCSS(mobileTentapEditorCss(compact, noteWidth), 'tolaria-editor')
    }
    if (editorReadyTimerRef.current) clearTimeout(editorReadyTimerRef.current)
    editorReadyTimerRef.current = setTimeout(() => {
      acceptsEditorChangesRef.current = true
    }, 750)
  }, [acceptsEditorChangesRef, compact, editorReadyTimerRef, editorRef, noteWidth])
}

function useEditorBridgeRef(
  editorRef: MutableRefObject<EditorBridge | null>,
  editor: EditorBridge,
) {
  useEffect(() => {
    editorRef.current = editor
  }, [editor, editorRef])
}

function useEditableContentRef({
  blocks,
  bullets,
  note,
  refs,
}: {
  blocks: MobileEditorBlock[]
  bullets: string[]
  note: MobileNote
  refs: NativeTentapEditorRefs
}) {
  const { contentRef } = refs

  useEffect(() => {
    contentRef.current = mobileNoteEditableContent({
      ...note,
      editorBlocks: note.editorBlocks ?? blocks,
      editorBullets: bullets,
    })
  }, [blocks, bullets, contentRef, note])
}

function useResetEditorChangeGate({
  initialContent,
  noteId,
  refs,
}: {
  initialContent: string
  noteId: string
  refs: NativeTentapEditorRefs
}) {
  const { acceptsEditorChangesRef, firstEditorSerializationRef, hasAcceptedEditorChangeRef } = refs

  useEffect(() => {
    acceptsEditorChangesRef.current = false
    firstEditorSerializationRef.current = true
    hasAcceptedEditorChangeRef.current = false
  }, [acceptsEditorChangesRef, firstEditorSerializationRef, hasAcceptedEditorChangeRef, initialContent, noteId])
}

function useFlushOnUnmount(
  refs: NativeTentapEditorRefs,
  flushEditorDocument: () => void,
) {
  useEffect(() => () => {
    if (refs.editorReadyTimerRef.current) clearTimeout(refs.editorReadyTimerRef.current)
    if (refs.inlineAutocompleteTimerRef.current) clearTimeout(refs.inlineAutocompleteTimerRef.current)
    if (refs.saveTimerRef.current) clearTimeout(refs.saveTimerRef.current)
    if (refs.hasAcceptedEditorChangeRef.current) flushEditorDocument()
  }, [flushEditorDocument, refs])
}

function isJsonReadableEditorBridge(editor: EditorBridge | null): editor is JsonReadableEditorBridge {
  return typeof (editor as Partial<JsonReadableEditorBridge> | null)?.getJSON === 'function'
}

function isCssInjectableEditorBridge(editor: EditorBridge | null): editor is CssInjectableEditorBridge {
  return typeof (editor as Partial<CssInjectableEditorBridge> | null)?.injectCSS === 'function'
}

function isEditorStateReadableBridge(editor: EditorBridge | null): editor is EditorStateReadableBridge {
  return typeof (editor as Partial<EditorStateReadableBridge> | null)?.getEditorState === 'function'
}

function isContentSettableEditorBridge(editor: EditorBridge | null): editor is ContentSettableEditorBridge {
  return typeof (editor as Partial<ContentSettableEditorBridge> | null)?.setContent === 'function'
}

function isSelectionSettableEditorBridge(editor: EditorBridge | null): editor is SelectionSettableEditorBridge {
  return typeof (editor as Partial<SelectionSettableEditorBridge> | null)?.setSelection === 'function'
}

const nativeEditorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mobileColors.editor,
  },
  richText: {
    flex: 1,
    backgroundColor: mobileColors.editor,
  },
  toolbarHost: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: mobileColors.editor,
    borderTopColor: mobileColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: mobileSpace.md,
    paddingTop: mobileSpace.xs,
  },
})
