import {
  Code,
  LinkSimple,
  ListBullets,
  Quotes,
  Table,
  TextB,
  TextHThree,
  TextHTwo,
  TextItalic,
} from 'phosphor-react-native'
import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { mobileText } from '../../i18n/mobileText'
import { MobileIconButton } from '../../ui/MobileIconButton'
import { desktopToolbarActionParity } from '../../ui/desktopParity'
import { mobileColors, mobileSpace } from '../../ui/tokens'
import type { MobileMarkdownFormatAction } from '../../workspace/mobileMarkdownFormatting'

type FormattingCommand = {
  action: MobileMarkdownFormatAction
  icon: (color: string) => ReactNode
  label: string
  testID: string
}

const formattingCommands: FormattingCommand[] = [
  {
    action: 'bold',
    icon: (color) => <TextB color={color} size={desktopToolbarActionParity.iconSize} />,
    label: mobileText('editor.formatting.bold'),
    testID: 'editor-format-bold',
  },
  {
    action: 'italic',
    icon: (color) => <TextItalic color={color} size={desktopToolbarActionParity.iconSize} />,
    label: mobileText('editor.formatting.italic'),
    testID: 'editor-format-italic',
  },
  {
    action: 'code',
    icon: (color) => <Code color={color} size={desktopToolbarActionParity.iconSize} />,
    label: mobileText('editor.formatting.code'),
    testID: 'editor-format-code',
  },
  {
    action: 'wikilink',
    icon: (color) => <LinkSimple color={color} size={desktopToolbarActionParity.iconSize} />,
    label: mobileText('editor.formatting.wikilink'),
    testID: 'editor-format-wikilink',
  },
  {
    action: 'heading2',
    icon: (color) => <TextHTwo color={color} size={desktopToolbarActionParity.iconSize} />,
    label: mobileText('editor.formatting.heading2'),
    testID: 'editor-format-heading-2',
  },
  {
    action: 'heading3',
    icon: (color) => <TextHThree color={color} size={desktopToolbarActionParity.iconSize} />,
    label: mobileText('editor.formatting.heading3'),
    testID: 'editor-format-heading-3',
  },
  {
    action: 'bulletList',
    icon: (color) => <ListBullets color={color} size={desktopToolbarActionParity.iconSize} />,
    label: mobileText('editor.formatting.bulletList'),
    testID: 'editor-format-bullet-list',
  },
  {
    action: 'quote',
    icon: (color) => <Quotes color={color} size={desktopToolbarActionParity.iconSize} />,
    label: mobileText('editor.formatting.quote'),
    testID: 'editor-format-quote',
  },
  {
    action: 'table',
    icon: (color) => <Table color={color} size={desktopToolbarActionParity.iconSize} />,
    label: mobileText('editor.formatting.table'),
    testID: 'editor-format-table',
  },
]

export function MobileMarkdownFormattingToolbar({
  onFormat,
}: {
  onFormat: (action: MobileMarkdownFormatAction) => void
}) {
  return (
    <View
      accessibilityLabel={mobileText('editor.formatting.toolbar')}
      style={styles.toolbar}
      testID="editor-formatting-toolbar"
    >
      {formattingCommands.map((command) => (
        <MobileIconButton
          accessibilityLabel={command.label}
          key={command.action}
          testID={command.testID}
          onPress={() => onFormat(command.action)}
        >
          {command.icon(mobileColors.textMuted)}
        </MobileIconButton>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mobileSpace.xs,
    paddingBottom: mobileSpace.xs,
  },
})
