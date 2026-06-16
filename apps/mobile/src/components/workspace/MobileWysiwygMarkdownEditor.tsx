import type { MobileLayoutProbe } from '../../qa/mobileLayoutProbe'
import { MobileMarkdownSourceEditor, type MobileMarkdownSourceEditorProps } from './MobileMarkdownSourceEditor'

type MobileWysiwygMarkdownEditorProps = MobileMarkdownSourceEditorProps & {
  layoutProbe?: MobileLayoutProbe
  wysiwygMutationProbe?: boolean
}

export function MobileWysiwygMarkdownEditor({
  layoutProbe,
  wysiwygMutationProbe,
  ...props
}: MobileWysiwygMarkdownEditorProps) {
  void layoutProbe
  void wysiwygMutationProbe
  return <MobileMarkdownSourceEditor {...props} />
}
