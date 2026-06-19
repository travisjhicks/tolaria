import { expect, test, type Page } from '@playwright/test'

const mobileClipboardAttemptsGlobalKey = '__TOLARIA_MOBILE_CLIPBOARD_ATTEMPTS__'

test.describe('mobile command palette actions', () => {
  test('dispatches selected-note utility commands from the tablet command palette', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'tablet-landscape', 'Command palette action checks use the full-width tablet layout.')

    await page.goto('/')
    await openCommandPalette(page)
    await runCommand(page, 'copy path', 'copy-active-file-path')

    await expect(page.getByTestId('mobile-command-palette')).toBeHidden()
    await expect.poll(() => latestClipboardAttempt(page)).toBe(
      'Tolaria/Mobile UI/Workflow Orchestration Essay.md',
    )

    await openCommandPalette(page)
    await runCommand(page, 'move folder', 'move-note-to-folder')

    await expect(page.getByTestId('mobile-command-palette')).toBeHidden()
    await expect(page.getByTestId('workspace-move-folder-input')).toBeVisible()
  })

  test('creates typed notes from desktop-style dynamic commands', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'tablet-landscape', 'Command palette action checks use the full-width tablet layout.')

    await page.goto('/')
    await openCommandPalette(page)
    await runCommand(page, 'new essay', 'new-essay')

    await expect(page.getByTestId('mobile-command-palette')).toBeHidden()
    await expect(page.getByTestId('note-row-untitled.md')).toBeVisible()
    await expect(page.getByTestId('editor-toolbar-title')).toHaveText('Untitled')
    await expect(page.getByTestId('editor-title')).toBeHidden()
    await expect(page.getByTestId('property-row-type-edit')).toHaveText('Essay')
  })

  test('opens active note-list column customization from the tablet command palette', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'tablet-landscape', 'Command palette action checks use the full-width tablet layout.')

    await page.goto('/')
    await page.getByTestId('sidebar-item-all-notes').click()
    await expect(page.getByTestId('note-list-toolbar-title')).toHaveText('All Notes')

    await openCommandPalette(page)
    await runCommand(page, 'customize all columns', 'customize-note-list-columns')

    await expect(page.getByTestId('mobile-command-palette')).toBeHidden()
    await expect(page.getByTestId('workspace-action-sheet-editPrimaryListProperties')).toBeVisible()
    await expect(page.getByTestId('workspace-all-notes-file-visibility')).toBeVisible()
  })

  test('dispatches selected-folder commands from the tablet command palette', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'tablet-landscape', 'Command palette action checks use the full-width tablet layout.')

    await page.goto('/')
    await page.getByRole('button', { exact: true, name: 'Mobile UI' }).click()
    await expect(page.getByTestId('note-list-toolbar-title')).toHaveText('Mobile UI')

    await openCommandPalette(page)
    await runCommand(page, 'copy folder path', 'copy-selected-folder-path')

    await expect(page.getByTestId('mobile-command-palette')).toBeHidden()
    await expect.poll(() => latestClipboardAttempt(page)).toBe('Tolaria/Mobile UI')

    await openCommandPalette(page)
    await runCommand(page, 'rename folder', 'rename-folder')

    await expect(page.getByTestId('mobile-command-palette')).toBeHidden()
    await expect(page.getByTestId('workspace-action-sheet-editFolder')).toBeVisible()
    await expect(page.getByTestId('workspace-rename-folder-input')).toHaveValue('Mobile UI')
  })
})

async function openCommandPalette(page: Page) {
  await page.getByTestId('sidebar-command-palette-action').click()
  await expect(page.getByTestId('mobile-command-palette')).toBeVisible()
  await expect(page.getByTestId('mobile-command-palette-input')).toBeFocused()
}

async function runCommand(page: Page, query: string, commandId: string) {
  await page.getByTestId('mobile-command-palette-input').fill(query)
  await page.getByTestId(`mobile-command-palette-command-${commandId}`).click()
}

async function latestClipboardAttempt(page: Page) {
  return page.evaluate((key) => {
    const attempts = (window as unknown as Record<string, unknown>)[key]
    return Array.isArray(attempts) ? attempts.at(-1) : null
  }, mobileClipboardAttemptsGlobalKey)
}
