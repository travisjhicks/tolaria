export type MobileMarkdownFormatAction =
  | 'bold'
  | 'bulletList'
  | 'code'
  | 'heading2'
  | 'heading3'
  | 'italic'
  | 'quote'
  | 'table'
  | 'wikilink'

export type MobileMarkdownSelection = {
  end: number
  start: number
}

export type MobileMarkdownFormatResult = {
  selection: MobileMarkdownSelection
  text: string
}

type MarkdownEditRequest = {
  action: MobileMarkdownFormatAction
  selection: MobileMarkdownSelection
  text: string
}

type InlineFormat = {
  placeholder: string
  prefix: string
  suffix: string
}

type MarkdownLine = {
  value: string
}

type LineMarker = {
  value: '- ' | '> ' | '## ' | '### '
}

type MarkdownReplacement = {
  value: string
}

const inlineFormats = {
  bold: { placeholder: 'bold text', prefix: '**', suffix: '**' },
  code: { placeholder: 'code', prefix: '`', suffix: '`' },
  italic: { placeholder: 'italic text', prefix: '*', suffix: '*' },
} as const satisfies Record<'bold' | 'code' | 'italic', InlineFormat>

const markdownTableSnippet = [
  '| Column | Value |',
  '| --- | --- |',
  '| Item | Detail |',
].join('\n')

export function applyMobileMarkdownFormat(
  text: string,
  selection: MobileMarkdownSelection,
  action: MobileMarkdownFormatAction,
): MobileMarkdownFormatResult {
  return new MarkdownEditSession({ action, selection, text }).apply()
}

class MarkdownEditSession {
  private readonly action: MobileMarkdownFormatAction
  private readonly range: MobileMarkdownSelection
  private readonly text: string

  constructor(request: MarkdownEditRequest) {
    this.action = request.action
    this.text = request.text
    this.range = this.normalizedSelection(request.selection)
  }

  apply(): MobileMarkdownFormatResult {
    if (this.action === 'heading2') return this.applyLineTransform((line) => this.headingLine(line, { value: '## ' }))
    if (this.action === 'heading3') return this.applyLineTransform((line) => this.headingLine(line, { value: '### ' }))
    if (this.action === 'bulletList') return this.applyLineTransform((line) => this.prefixedLine(line, { value: '- ' }))
    if (this.action === 'quote') return this.applyLineTransform((line) => this.prefixedLine(line, { value: '> ' }))
    if (this.action === 'table') return this.insertTable()
    if (this.action === 'wikilink') return this.applyWikilinkFormat()

    return this.applyInlineFormat(inlineFormats[this.action])
  }

  private applyInlineFormat(format: InlineFormat): MobileMarkdownFormatResult {
    const selected = this.selectedText()
    const inner = selected || format.placeholder
    const replacement = `${format.prefix}${inner}${format.suffix}`
    const innerStart = this.range.start + format.prefix.length
    const innerEnd = innerStart + inner.length

    return {
      selection: selected ? collapsedSelection(this.range.start + replacement.length) : { start: innerStart, end: innerEnd },
      text: this.replaceRange({ value: replacement }),
    }
  }

  private applyWikilinkFormat(): MobileMarkdownFormatResult {
    const selected = this.selectedText().trim()
    if (!selected) {
      return {
        selection: collapsedSelection(this.range.start + 2),
        text: this.replaceRange({ value: '[[' }),
      }
    }

    const replacement = `[[${selected}]]`
    return {
      selection: collapsedSelection(this.range.start + replacement.length),
      text: this.replaceRange({ value: replacement }),
    }
  }

  private applyLineTransform(transform: (line: MarkdownLine) => string): MobileMarkdownFormatResult {
    const range = this.selectedLineRange()
    const segment = this.text.slice(range.start, range.end)
    const replacement = segment
      .split('\n')
      .map((line) => transform({ value: line }))
      .join('\n')

    return {
      selection: collapsedSelection(range.start + replacement.length),
      text: this.replaceRange({ value: replacement }, range),
    }
  }

  private headingLine(line: MarkdownLine, marker: LineMarker): string {
    if (line.value.trim().length === 0) return marker.value
    return `${marker.value}${line.value.replace(/^#{1,6}\s+/u, '')}`
  }

  private prefixedLine(line: MarkdownLine, marker: LineMarker): string {
    if (line.value.trim().length === 0) return marker.value
    if (line.value.startsWith(marker.value)) return line.value
    return `${marker.value}${line.value}`
  }

  private insertTable(): MobileMarkdownFormatResult {
    const before = this.blockPrefix()
    const after = this.blockSuffix()
    const replacement = `${before}${markdownTableSnippet}${after}`
    const placeholderStart = this.range.start + before.length + markdownTableSnippet.indexOf('Column')

    return {
      selection: {
        start: placeholderStart,
        end: placeholderStart + 'Column'.length,
      },
      text: this.replaceRange({ value: replacement }),
    }
  }

  private blockPrefix(): string {
    if (this.range.start === 0 || this.text.slice(0, this.range.start).endsWith('\n\n')) return ''
    return this.text.slice(0, this.range.start).endsWith('\n') ? '\n' : '\n\n'
  }

  private blockSuffix(): string {
    if (this.range.end >= this.text.length || this.text.slice(this.range.end).startsWith('\n\n')) return ''
    return this.text.slice(this.range.end).startsWith('\n') ? '\n' : '\n\n'
  }

  private selectedLineRange(): MobileMarkdownSelection {
    const lineStart = this.text.lastIndexOf('\n', Math.max(0, this.range.start - 1)) + 1
    const nextLineBreak = this.text.indexOf('\n', this.range.end)

    return {
      start: lineStart,
      end: nextLineBreak === -1 ? this.text.length : nextLineBreak,
    }
  }

  private normalizedSelection(selection: MobileMarkdownSelection): MobileMarkdownSelection {
    const start = this.boundedOffset(Math.min(selection.start, selection.end))
    const end = this.boundedOffset(Math.max(selection.start, selection.end))

    return { start, end }
  }

  private boundedOffset(value: number): number {
    if (!Number.isFinite(value)) return this.text.length
    return Math.max(0, Math.min(this.text.length, value))
  }

  private selectedText(): string {
    return this.text.slice(this.range.start, this.range.end)
  }

  private replaceRange(replacement: MarkdownReplacement, range = this.range): string {
    return `${this.text.slice(0, range.start)}${replacement.value}${this.text.slice(range.end)}`
  }
}

function collapsedSelection(offset: number): MobileMarkdownSelection {
  return { start: offset, end: offset }
}
