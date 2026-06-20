import { expect, test, type Page } from '@playwright/test'

test.describe('phone whiteboard action parity', () => {
  test('edits desktop-compatible tldraw fences from phone More actions', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'phone-portrait', 'Phone whiteboard actions run on the phone editor shell.')

    await page.goto('/')
    await createPhoneNote(page, 'Phone Whiteboard Source')
    await writeWhiteboardFence(page)
    await editWhiteboardFence(page)
    await assertWhiteboardFenceSource(page)
  })
})

async function createPhoneNote(page: Page, title: string) {
  await page.getByTestId('note-list-create-action').click()
  await page.getByTestId('workspace-create-note-title-input').fill(title)
  await page.getByTestId('workspace-action-sheet-createNote').getByRole('button', { exact: true, name: 'Create' }).click()
  await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()
  await page.getByTestId(`note-row-${noteRowSlug(title)}.md`).click()
  await expect(page.getByTestId('phone-editor-screen')).toBeVisible()
  await expect(page.getByTestId('editor-toolbar-title')).toHaveText(title)
}

async function writeWhiteboardFence(page: Page) {
  await page.getByTestId('editor-edit-action').click()
  await expect(page.getByTestId('editor-markdown-input')).toBeVisible()
  await page.getByTestId('editor-markdown-input').fill([
    '# Phone Whiteboard Source',
    '',
    '```tldraw id="phone-board" height="520"',
    '{}',
    '```',
  ].join('\n'))
  await page.getByTestId('editor-edit-action').click()
  await expect(page.getByTestId('editor-title')).toHaveText('Phone Whiteboard Source')
}

async function editWhiteboardFence(page: Page) {
  await page.getByTestId('editor-more-action').click()
  await page.getByTestId('workspace-action-edit-whiteboard').click()
  await expect(page.getByTestId('workspace-whiteboard-editor')).toBeVisible()
  await expect(page.getByTestId('workspace-whiteboard-height-input')).toHaveValue('520')
  await page.getByTestId('workspace-whiteboard-height-input').fill('640')
  await page.getByTestId('workspace-whiteboard-width-input').fill('900')
  await page.getByTestId('workspace-whiteboard-snapshot-input').fill('{ "document": { "phone": true } }')
  await page.getByTestId('workspace-whiteboard-editor').getByRole('button', { name: 'Save' }).click()
  await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()
}

async function assertWhiteboardFenceSource(page: Page) {
  await page.getByTestId('editor-source-action').click()
  await expect(page.getByTestId('editor-markdown-input')).toHaveValue(/```tldraw id="phone-board" height="640" width="900"/u)
  await expect(page.getByTestId('editor-markdown-input')).toHaveValue(/\{ "document": \{ "phone": true \} \}/u)
}

function noteRowSlug(title: string) {
  return title.trim().toLowerCase().replace(/\s+/gu, '-')
}
