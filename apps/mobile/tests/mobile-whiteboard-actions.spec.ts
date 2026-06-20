import { expect, test, type Page } from '@playwright/test'

test.describe('mobile whiteboard action parity', () => {
  test('edits desktop-compatible tldraw fences from tablet More actions', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'tablet-landscape', 'Whiteboard More actions use the full-width tablet editor.')

    await page.goto('/')
    await createTabletNote(page, 'Whiteboard Source')
    await writeWhiteboardFence(page)
    await editWhiteboardFence(page)
    await assertWhiteboardFenceSource(page)
  })
})

async function createTabletNote(page: Page, title: string) {
  await page.getByTestId('note-list-create-action').click()
  await expect(page.getByTestId('workspace-create-note-title-input')).toBeVisible()
  await page.getByTestId('workspace-create-note-title-input').fill(title)
  await page.getByTestId('workspace-action-sheet-createNote').getByRole('button', { exact: true, name: 'Create' }).click()
  await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()
  await expect(page.getByTestId(`note-row-${noteRowSlug(title)}.md`)).toBeVisible()
  await expect(page.getByTestId('editor-toolbar-title')).toHaveText(title)
}

async function writeWhiteboardFence(page: Page) {
  await page.getByTestId('editor-edit-action').click()
  await expect(page.getByTestId('editor-markdown-input')).toBeVisible()
  await page.getByTestId('editor-markdown-input').fill([
    '# Whiteboard Source',
    '',
    '```tldraw id="qa-board" height="520"',
    '{}',
    '```',
  ].join('\n'))
  await page.getByTestId('editor-edit-action').click()
  await expect(page.getByTestId('editor-title')).toHaveText('Whiteboard Source')
}

async function editWhiteboardFence(page: Page) {
  await page.getByTestId('editor-more-action').click()
  await page.getByTestId('workspace-action-edit-whiteboard').click()
  await expect(page.getByTestId('workspace-whiteboard-editor')).toBeVisible()
  await expect(page.getByTestId('workspace-whiteboard-height-input')).toHaveValue('520')
  await page.getByTestId('workspace-whiteboard-height-input').fill('640')
  await page.getByTestId('workspace-whiteboard-width-input').fill('900')
  await page.getByTestId('workspace-whiteboard-snapshot-input').fill(JSON.stringify(desktopStoreSnapshot({ name: 'Tablet board' })))
  await page.getByTestId('workspace-whiteboard-text-shape-input').fill('Tablet board note')
  await page.getByTestId('workspace-whiteboard-structured-editor').getByRole('button', { name: 'Add' }).click()
  await page.getByTestId('workspace-whiteboard-editor').getByRole('button', { name: 'Save' }).click()
  await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()
}

async function assertWhiteboardFenceSource(page: Page) {
  await page.getByTestId('editor-source-action').click()
  await expect(page.getByTestId('editor-markdown-input')).toHaveValue(/```tldraw id="qa-board" height="640" width="900"/u)
  await expect(page.getByTestId('editor-markdown-input')).toHaveValue(/"schemaVersion": 2/u)
  await expect(page.getByTestId('editor-markdown-input')).toHaveValue(/Tablet board note/u)
  await expect(page.getByTestId('editor-markdown-input')).toHaveValue(/"type": "text"/u)
}

function noteRowSlug(title: string) {
  return title.trim().toLowerCase().replace(/\s+/gu, '-')
}

function desktopStoreSnapshot({ name }: { name: string }) {
  return {
    schema: {
      schemaVersion: 2,
      sequences: {},
    },
    store: {
      'document:document': {
        gridSize: 20,
        id: 'document:document',
        meta: {},
        name,
        typeName: 'document',
      },
      'page:page': {
        id: 'page:page',
        index: 'a1',
        meta: {},
        name: 'Page 1',
        typeName: 'page',
      },
    },
  }
}
