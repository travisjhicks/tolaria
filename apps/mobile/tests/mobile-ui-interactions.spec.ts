import { expect, test } from '@playwright/test'
import { performance } from 'node:perf_hooks'
import {
  firstSidebarFolder,
  installLocalVaultSnapshot,
  localVaultPath,
  type LocalVaultSnapshotState,
} from './local-vault-snapshot-loader'

test.describe('mobile UI lab interactions', () => {
  test('exercises read-only tablet action flows', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'tablet-landscape', 'Read-only action flows use the full-width tablet layout.')

    await page.goto('/')

    await page.getByTestId('note-list-search-action').click()
    await expect(page.getByTestId('workspace-search-input')).toBeVisible()
    await page.getByTestId('workspace-search-input').fill('Release')
    await expect(page.getByTestId('workspace-search-result-release-2026-05-02')).toBeVisible()
    await page.getByTestId('workspace-search-result-release-2026-05-02').click()
    await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()
    await expect(page.getByTestId('editor-title')).toHaveText('v2026-05-02')

    await page.getByTestId('editor-favorite-action').click()
    await expect(page.getByLabel('Remove from Favorites')).toBeVisible()

    await page.getByTestId('note-list-create-action').click()
    await expect(page.getByTestId('workspace-create-note-title-input')).toBeVisible()
    await page.getByTestId('workspace-create-note-title-input').fill('Mobile QA Draft')
    await page.getByTestId('workspace-action-sheet-createNote').getByRole('button', { name: 'Create' }).click()
    await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()

    await page.getByTestId('property-action-add-property').click()
    await expect(page.getByTestId('workspace-property-name-input')).toBeVisible()
    await page.getByTestId('workspace-property-name-input').fill('Priority')
    await page.getByTestId('workspace-property-value-input').fill('High')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()

    await page.getByTestId('property-action-add-relationship').click()
    await expect(page.getByTestId('workspace-relationship-name-input')).toBeVisible()
    await page.getByTestId('workspace-relationship-name-input').fill('Related to')
    await page.getByTestId('workspace-relationship-note-title-input').fill('Release Notes')
    await page.getByTestId('workspace-action-sheet-addRelationship').getByRole('button', { name: 'Add' }).click()
    await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()

    await page.getByTestId('editor-more-action').click()
    await expect(page.getByText('Archive Note')).toBeVisible()
    await expect(page.getByText('Copy deep link to current item')).toBeVisible()
    await page.getByTestId('workspace-action-sheet-backdrop').click()
    await expect(page.getByTestId('workspace-action-sheet')).toBeHidden()
  })

  test('keeps large local-vault read-only interactions within tablet budgets', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'tablet-landscape', 'Large-vault performance checks run once on the primary tablet layout.')

    const state = await installRequiredLocalVaultSnapshot(page)
    assertSnapshotBuildBudgets(state)
    await assertLocalVaultRenderBudget(page, state)
    await assertNoteSwitchBudget(page, state)
    await assertTypeNavigationBudget(page, state)
    await assertFolderNavigationBudget(page, state)
  })
})

async function installRequiredLocalVaultSnapshot(page: PageLike): Promise<LocalVaultSnapshotState> {
  const state = await installLocalVaultSnapshot(page)
  test.skip(!state, `Local vault path is not readable: ${localVaultPath}`)
  if (!state) throw new Error(`Local vault path is not readable: ${localVaultPath}`)
  return state
}

function assertSnapshotBuildBudgets(state: LocalVaultSnapshotState) {
  expect(state.fileCount).toBeGreaterThan(0)
  expect(state.totalDurationMs).toBeLessThan(10_000)
  expect(state.buildDurationMs).toBeLessThan(1_000)
}

async function assertLocalVaultRenderBudget(page: PageLike, state: LocalVaultSnapshotState) {
  const firstNote = state.snapshot.notes[0]
  if (!firstNote) throw new Error('Expected at least one visible local-vault note.')

  const renderDurationMs = await measureDuration(async () => {
    await page.goto('/?source=host-vault')
    await expect(page.getByText(firstNote.title).first()).toBeVisible()
  })
  expect(renderDurationMs).toBeLessThan(3_000)
}

async function assertNoteSwitchBudget(page: PageLike, state: LocalVaultSnapshotState) {
  const secondNote = state.snapshot.notes[1]
  if (!secondNote) throw new Error('Expected at least two visible local-vault notes.')

  const noteSwitchDurationMs = await measureDuration(async () => {
    await page.getByTestId(`note-row-${secondNote.id}`).click()
    await expect(page.getByTestId('editor-title')).toHaveText(secondNote.title)
  })
  expect(noteSwitchDurationMs).toBeLessThan(700)
}

async function assertTypeNavigationBudget(page: PageLike, state: LocalVaultSnapshotState) {
  const typeItem = state.snapshot.sidebarSections.find((section) => section.id === 'types')?.items?.[0]
  if (!typeItem) return

  const typeNavigationDurationMs = await measureDuration(async () => {
    await page.getByRole('button', { name: typeItem.label }).click()
    await expect(page.getByTestId('note-list-toolbar-title')).toHaveText(typeItem.label)
  })
  expect(typeNavigationDurationMs).toBeLessThan(700)
}

async function assertFolderNavigationBudget(page: PageLike, state: LocalVaultSnapshotState) {
  const folder = firstSidebarFolder(state.snapshot)
  if (!folder) return

  const folderNavigationDurationMs = await measureDuration(async () => {
    await page.getByRole('button', { name: folder.name }).first().click()
    await expect(page.getByTestId('note-list-toolbar-title')).toHaveText(folder.name)
  })
  expect(folderNavigationDurationMs).toBeLessThan(700)
}

async function measureDuration(action: () => Promise<void>): Promise<number> {
  const startedAt = performance.now()
  await action()
  return performance.now() - startedAt
}

type PageLike = Parameters<typeof installLocalVaultSnapshot>[0]
