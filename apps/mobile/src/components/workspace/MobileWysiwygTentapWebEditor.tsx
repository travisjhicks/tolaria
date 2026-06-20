import React from 'react'
import { createRoot } from 'react-dom/client'
import { EditorContent } from '@tiptap/react'
import { TenTapStartKit, useTenTap } from '@10play/tentap-editor/web'
import { MobileCodeBlockBridge } from './MobileWysiwygCodeBlockBridge'
import { MobileMathInlineBridge } from './MobileWysiwygMathBridge'

declare global {
  interface Window {
    contentInjected: boolean | undefined
    dynamicHeight?: boolean
  }
}

const mobileTenTapExtensions = [...TenTapStartKit, MobileCodeBlockBridge, MobileMathInlineBridge]

function enabledTenTapExtensions() {
  return mobileTenTapExtensions.filter((extension) => (
    !window.whiteListBridgeExtensions
    || window.whiteListBridgeExtensions.includes(extension.name)
  ))
}

export function MobileWysiwygTenTapEditor() {
  const editor = useTenTap({ bridges: enabledTenTapExtensions() })

  return (
    <EditorContent
      editor={editor}
      className={window.dynamicHeight ? 'dynamic-height' : undefined}
    />
  )
}

function renderWhenInjected() {
  if (!window.contentInjected) {
    window.setTimeout(renderWhenInjected, 1)
    return
  }

  const container = document.getElementById('root')
  if (!container) return

  createRoot(container).render(<MobileWysiwygTenTapEditor />)
}

renderWhenInjected()
