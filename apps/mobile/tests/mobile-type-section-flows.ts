import { expect, type Page } from '@playwright/test'

export async function createRenameAndDeleteTypeSection(page: Page) {
  await page.getByTestId('sidebar-section-create-types').click()
  await expect(page.getByTestId('workspace-create-type-name-input')).toBeVisible()
  await page.getByTestId('workspace-create-type-name-input').fill('Decision')
  await page.getByTestId('workspace-action-sheet-createType').getByRole('button', { exact: true, name: 'Create' }).click()
  await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()

  const decisionSection = page.getByTestId('sidebar-item-type-decision')
  await expect(decisionSection).toContainText('Decisions')
  await expect(decisionSection.getByTestId('sidebar-item-type-decision-count')).toHaveText('0')
  await expect(page.getByTestId('note-list-toolbar-title')).toHaveText('Decisions')
  await expect(page.getByTestId('note-list-toolbar-subtitle')).toHaveText('0')

  await longPressTestId(page, 'sidebar-item-type-decision')
  await expect(page.getByTestId('workspace-action-sheet-editTypeSection')).toBeVisible()
  await expect(page.getByTestId('workspace-type-section-type-name-input')).toHaveValue('Decision')
  await page.getByTestId('workspace-type-section-type-name-input').fill('Initiative')
  await page.getByTestId('workspace-action-sheet-editTypeSection').getByRole('button', { name: 'Save' }).click()
  await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()
  await expect(decisionSection).toBeHidden()

  const initiativeSection = page.getByTestId('sidebar-item-type-initiative')
  await expect(initiativeSection).toContainText('Initiatives')
  await expect(page.getByTestId('note-list-toolbar-title')).toHaveText('Initiatives')

  await longPressTestId(page, 'sidebar-item-type-initiative')
  await expect(page.getByTestId('workspace-action-sheet-editTypeSection')).toBeVisible()
  await page.getByTestId('workspace-delete-type-action').click()
  await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()
  await expect(initiativeSection).toBeHidden()
  await expect(page.getByTestId('note-list-toolbar-title')).toHaveText('Inbox')
}

async function longPressTestId(page: Page, testId: string) {
  const target = page.getByTestId(testId)
  const box = await target.boundingBox()
  if (!box) throw new Error(`Cannot long-press missing target: ${testId}`)

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(700)
  await page.mouse.up()
}
