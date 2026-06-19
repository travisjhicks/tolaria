import type { MobileLayoutProbe } from '../../qa/mobileLayoutProbe'
import { MobileMarkdownSourceEditor, type MobileMarkdownSourceEditorProps } from './MobileMarkdownSourceEditor'

type MobileWysiwygMarkdownEditorProps = MobileMarkdownSourceEditorProps & {
  layoutProbe?: MobileLayoutProbe
  wysiwygAutocompleteProbe?: boolean
  wysiwygFormatCommandProbe?: boolean
  wysiwygWikilinkInsertProbe?: boolean
  wysiwygMutationProbe?: boolean
  vaultRootUri?: string | null
}

export function MobileWysiwygMarkdownEditor({
  layoutProbe,
  wysiwygAutocompleteProbe,
  wysiwygFormatCommandProbe,
  wysiwygWikilinkInsertProbe,
  wysiwygMutationProbe,
  vaultRootUri,
  ...props
}: MobileWysiwygMarkdownEditorProps) {
  void layoutProbe
  void wysiwygAutocompleteProbe
  void wysiwygFormatCommandProbe
  void wysiwygWikilinkInsertProbe
  void wysiwygMutationProbe
  void vaultRootUri
  return <MobileMarkdownSourceEditor {...props} />
}
