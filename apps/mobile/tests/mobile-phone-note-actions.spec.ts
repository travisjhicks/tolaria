import { expect, test, type Page } from '@playwright/test'

test.describe('phone note action parity', () => {
  test('exercises phone More-sheet note commands', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'phone-portrait', 'Phone note actions run on the phone editor shell.')

    await createPhoneNote(page, 'Phone Action Source')
    await changePhoneNoteType(page)
    await setAndRemovePhoneNoteIcon(page)
    await moveAndRenamePhoneNote(page)
    await togglePhoneNoteWidth(page)
    await archiveOrganizeAndDeletePhoneNote(page)
  })
})

async function createPhoneNote(page: Page, title: string) {
  await page.goto('/')
  await page.getByTestId('note-list-create-action').click()
  await page.getByTestId('workspace-create-note-title-input').fill(title)
  await page.getByTestId('workspace-action-sheet-createNote').getByRole('button', { exact: true, name: 'Create' }).click()
  await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()
  await page.getByTestId(`note-row-${noteRowSlug(title)}.md`).click()
  await expect(page.getByTestId('phone-editor-screen')).toBeVisible()
  await expectBodyOnlyPhoneNote(page, title)
}

async function changePhoneNoteType(page: Page) {
  await page.getByTestId('editor-more-action').click()
  await page.getByTestId('workspace-action-change-note-type').click()
  await expect(page.getByTestId('workspace-change-type-input')).toBeVisible()
  await page.getByTestId('workspace-change-type-input').fill('Procedure')
  await page.getByTestId('workspace-action-sheet-changeNoteType').getByRole('button', { name: 'Save' }).click()
  await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()
  await page.getByTestId('phone-properties-action').click()
  await expect(page.getByTestId('property-row-type')).toContainText('Procedure')
  await page.getByTestId('phone-back-action').click()
  await expect(page.getByTestId('phone-editor-screen')).toBeVisible()
}

async function setAndRemovePhoneNoteIcon(page: Page) {
  await expect(page.getByTestId('editor-toolbar-note-icon')).toBeHidden()
  await page.getByTestId('editor-more-action').click()
  await page.getByTestId('workspace-action-set-note-icon').click()
  await expect(page.getByTestId('workspace-note-icon-input')).toHaveValue('')
  await page.getByTestId('workspace-note-icon-input').fill('rocket')
  await page.getByTestId('workspace-action-sheet-setNoteIcon').getByRole('button', { name: 'Save' }).click()
  await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()
  await expect(page.getByTestId('editor-toolbar-note-icon')).toBeVisible()

  await page.getByTestId('editor-more-action').click()
  await expect(page.getByTestId('workspace-action-remove-note-icon')).toBeVisible()
  await page.getByTestId('workspace-action-remove-note-icon').click()
  await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()
  await expect(page.getByTestId('editor-toolbar-note-icon')).toBeHidden()
}

async function moveAndRenamePhoneNote(page: Page) {
  await page.getByTestId('editor-more-action').click()
  await page.getByTestId('workspace-action-move-note-folder').click()
  await expect(page.getByTestId('workspace-move-folder-input')).toBeVisible()
  await page.getByTestId('workspace-move-folder-input').fill('Tolaria')
  await page.getByTestId('workspace-move-folder-suggestion-tolaria-mobile-ui').click()
  await page.getByTestId('workspace-action-sheet-moveNoteToFolder').getByRole('button', { name: 'Save' }).click()
  await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()

  await page.getByTestId('editor-more-action').click()
  await page.getByTestId('workspace-action-rename-file').click()
  await expect(page.getByTestId('workspace-rename-file-input')).toHaveValue('phone-action-source')
  await page.getByTestId('workspace-rename-file-input').fill('phone-action-renamed')
  await page.getByTestId('workspace-action-sheet-renameNoteFile').getByRole('button', { name: 'Save' }).click()
  await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()
  await expectBodyOnlyPhoneNote(page, 'Phone Action Source')
}

async function togglePhoneNoteWidth(page: Page) {
  await page.getByTestId('editor-more-action').click()
  await expect(page.getByText('Switch to wide note width')).toBeVisible()
  await page.getByTestId('workspace-action-toggle-note-width').click()
  await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()

  await page.getByTestId('editor-more-action').click()
  await expect(page.getByText('Switch to normal note width')).toBeVisible()
  await page.getByTestId('workspace-action-sheet-toolbar').getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()
}

async function archiveOrganizeAndDeletePhoneNote(page: Page) {
  await page.getByTestId('editor-more-action').click()
  await page.getByTestId('workspace-action-archive-note').click()
  await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()
  await page.getByTestId('phone-back-action').click()
  await expect(phoneActionRow(page)).toBeHidden()

  await openPhoneSidebar(page)
  await page.getByTestId('sidebar-item-archive').click()
  await expect(page.getByTestId('note-list-toolbar-title')).toHaveText('Archive')
  await phoneActionRow(page).click()
  await page.getByTestId('editor-more-action').click()
  await expect(page.getByText('Unarchive Note')).toBeVisible()
  await page.getByTestId('workspace-action-archive-note').click()
  await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()
  await page.getByTestId('phone-back-action').click()
  await expect(phoneActionRow(page)).toBeHidden()

  await openPhoneSidebar(page)
  await page.getByTestId('sidebar-item-all-notes').click()
  await phoneActionRow(page).click()
  await page.getByTestId('editor-more-action').click()
  await page.getByTestId('workspace-action-organize-note').click()
  await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()
  await page.getByTestId('phone-back-action').click()
  await expect(phoneActionRow(page)).toBeVisible()

  await phoneActionRow(page).click()
  await page.getByTestId('editor-more-action').click()
  await page.getByTestId('workspace-action-delete-note').click()
  await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()
  await expect(page.getByTestId('phone-editor-screen')).toBeVisible()
  await expect(page.getByTestId('editor-title')).toHaveText('Workflow Orchestration Essay')
  await page.getByTestId('phone-back-action').click()
  await expect(page.getByTestId('phone-note-list-screen')).toBeVisible()
  await expect(phoneActionRow(page)).toBeHidden()
}

async function openPhoneSidebar(page: Page) {
  if (await page.getByTestId('phone-sidebar-screen').isVisible()) return

  await page.getByTestId('phone-sidebar-action').click()
  await expect(page.getByTestId('phone-sidebar-screen')).toBeVisible()
}

async function expectBodyOnlyPhoneNote(page: Page, title: string) {
  await expect(page.getByTestId('editor-toolbar-title')).toHaveText(title)
  await expect(page.getByTestId('editor-title')).toBeHidden()
}

function phoneActionRow(page: Page) {
  return page.getByRole('button', { name: 'Phone Action Source' }).first()
}

function noteRowSlug(title: string) {
  return title.trim().toLowerCase().replace(/\s+/gu, '-')
}
