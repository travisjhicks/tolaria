import { expect, test, type Locator, type Page } from '@playwright/test'
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { basename, join, relative } from 'node:path'
import {
  desktopNoteItemParity,
  desktopParityColors,
  desktopSidebarParity,
} from '../src/ui/desktopParity'
import { buildLocalVaultWorkspaceSnapshot, type LocalVaultFile } from '../src/workspace/localVaultSnapshot'
import type { MobileWorkspaceSnapshot } from '../src/workspace/mobileWorkspaceModel'
import { HOST_WORKSPACE_SNAPSHOT_STORAGE_KEY } from '../src/workspace/readOnlyWorkspaceRepository'

type ScreenshotRecord = {
  description: string
  path: string
  project: string
  viewport: { height: number; width: number } | null
}

const screenshotDir = process.env.MOBILE_QA_SCREENSHOT_DIR ?? '/tmp/tolaria-mobile-ui-screenshots'
const localVaultPath = process.env.MOBILE_QA_VAULT_PATH
const layoutTolerance = 1.5

type CssQuery = {
  locator: Locator
  property: string
}

type CssExpectation = CssQuery & {
  expected: string
}

type LayoutExpectation = {
  actual: number
  expected: number
  message: string
}

type ColorNormalizationRequest = {
  color: string
  page: Page
}

const tabletScenarioStates = [
  {
    description: 'empty-inbox',
    expectedText: 'All notes are organized',
    scenario: 'empty-inbox',
  },
  {
    description: 'long-title',
    expectedText: 'A Very Long Note Title That Should Stay Readable',
    scenario: 'long-title',
  },
  {
    description: 'property-heavy',
    expectedText: 'Depends on',
    scenario: 'property-heavy',
  },
  {
    description: 'folder-tree',
    expectedText: 'Research Backlog',
    landscapeOnly: true,
    scenario: 'folder-tree',
  },
]

const phoneStates = [
  {
    description: 'sidebar-open',
    expectedText: 'Tolaria',
    query: '?phoneState=sidebar',
  },
  {
    description: 'editor-open',
    expectedText: 'Workflow Orchestration Essay',
    query: '?phoneState=editor',
  },
]

const phoneScenarioStates = [
  {
    description: 'long-title-list',
    expectedText: 'A Very Long Note Title That Should Stay Readable',
    query: '?scenario=long-title',
  },
  {
    description: 'property-heavy-editor',
    expectedText: 'Mobile UI Parity Review',
    query: '?scenario=property-heavy&phoneState=editor',
  },
]

const tabletProjectNames = ['tablet-landscape', 'tablet-portrait'] as const
const currentScreenshotNames = new Set([
  ...tabletProjectNames.flatMap((projectName) => [
    `${projectName}-initial.png`,
    `${projectName}-selected-open-source-project.png`,
    ...tabletScenarioStates
      .filter((scenarioState) => projectName === 'tablet-landscape' || !scenarioState.landscapeOnly)
      .map((scenarioState) => `${projectName}-${scenarioState.description}.png`),
  ]),
  'phone-portrait-initial.png',
  ...phoneStates.map((phoneState) => `phone-portrait-${phoneState.description}.png`),
  ...phoneScenarioStates.map((phoneState) => `phone-portrait-${phoneState.description}.png`),
  ...(localVaultPath ? [
    'tablet-landscape-local-vault.png',
    'tablet-portrait-local-vault.png',
    'phone-portrait-local-vault.png',
  ] : []),
])

let localVaultSnapshotPromise: Promise<MobileWorkspaceSnapshot | null> | null = null

async function recordScreenshot(record: ScreenshotRecord) {
  const manifestPath = join(screenshotDir, 'manifest.json')
  let existing: ScreenshotRecord[] = []
  try {
    existing = JSON.parse(await readFile(manifestPath, 'utf8')) as ScreenshotRecord[]
  } catch {
    existing = []
  }

  const next = existing.filter((item) => currentScreenshotNames.has(basename(item.path)) && item.path !== record.path)
  next.push(record)
  await writeFile(manifestPath, `${JSON.stringify(next, null, 2)}\n`)
}

async function captureUiState({
  description,
  page,
  projectName,
}: {
  description: string
  page: import('@playwright/test').Page
  projectName: string
}) {
  await mkdir(screenshotDir, { recursive: true })
  const screenshotPath = join(screenshotDir, `${projectName}-${description}.png`)
  await page.screenshot({ fullPage: true, path: screenshotPath })
  await recordScreenshot({
    description,
    path: screenshotPath,
    project: projectName,
    viewport: page.viewportSize(),
  })
}

test.describe('mobile UI lab screenshots', () => {
  test.beforeEach(async ({ page }) => {
    const snapshot = await localVaultSnapshot()
    if (!snapshot) return

    await page.addInitScript(
      ({ key, value }) => {
        window.localStorage.setItem(key, value)
      },
      {
        key: HOST_WORKSPACE_SNAPSHOT_STORAGE_KEY,
        value: JSON.stringify(snapshot),
      },
    )
  })

  test('captures the initial workspace reference state', async ({ page }, testInfo) => {
    await page.goto('/')

    await expect(page.getByText('Inbox').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Workflow Orchestration Essay' })).toBeVisible()

    if (testInfo.project.name !== 'phone-portrait') {
      await expect(page.getByText('Properties', { exact: true })).toBeVisible()
    }

    await captureUiState({
      description: 'initial',
      page,
      projectName: testInfo.project.name,
    })
  })

  test('captures a selected-note state on tablet layouts', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'phone-portrait', 'Phone layout captures the scrollable tablet preview only.')

    await page.goto('/')

    const openSourceProjectNote = page.getByText('How I Run an Open Source Project').first()

    await expect(openSourceProjectNote).toBeVisible()
    await openSourceProjectNote.click()
    await expect(openSourceProjectNote).toBeVisible()
    await expect(page.getByText('Procedure').last()).toBeVisible()

    await captureUiState({
      description: 'selected-open-source-project',
      page,
      projectName: testInfo.project.name,
    })
  })

  test('navigates tablet sidebar sections and folders', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'tablet-landscape', 'Sidebar navigation is exercised in the full-width tablet layout.')

    await page.goto('/')

    await page.getByRole('button', { name: 'Procedures' }).click()
    await expect(page.getByText('How I Run an Open Source Project').first()).toBeVisible()
    await expect(page.getByText('Procedure').last()).toBeVisible()

    await page.getByRole('button', { name: 'Releases' }).click()
    await expect(page.getByText('v2026-05-02').first()).toBeVisible()
    await expect(page.getByText('Release cleanup date, bug fixes, and mobile planning notes.').first()).toBeVisible()

    await page.getByRole('button', { name: 'Inbox' }).click()
    await expect(page.getByText('Workflow Orchestration Essay').first()).toBeVisible()
  })

  test('enforces tablet desktop-parity visual invariants', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'tablet-landscape', 'Desktop parity assertions use the full-width tablet reference layout.')

    await page.goto('/')

    await assertNoteListParity(page)
    await assertSidebarParity(page)
  })

  test('hides and reveals tablet chrome with horizontal swipe gestures', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'tablet-landscape', 'Tablet chrome gestures are exercised in the full-width tablet layout.')

    await page.goto('/')

    const sidebarTitle = page.getByText('Tolaria Vault')
    const noteListSubtitle = page.getByText('7 open notes')
    const propertiesTitle = page.getByText('Properties', { exact: true })

    await expect(sidebarTitle).toBeVisible()
    await swipeHorizontally(page, { x: 210, y: 220 }, { x: 90, y: 220 })
    await expect(sidebarTitle).toBeHidden()

    await swipeHorizontally(page, { x: 8, y: 220 }, { x: 140, y: 220 })
    await expect(sidebarTitle).toBeVisible()

    await expect(noteListSubtitle).toBeVisible()
    await swipeHorizontally(page, { x: 480, y: 220 }, { x: 330, y: 220 })
    await expect(noteListSubtitle).toBeHidden()

    await swipeHorizontally(page, { x: 270, y: 220 }, { x: 410, y: 220 })
    await expect(noteListSubtitle).toBeVisible()

    await expect(propertiesTitle).toBeVisible()
    await swipeHorizontally(page, { x: 1210, y: 220 }, { x: 1340, y: 220 })
    await expect(propertiesTitle).toBeHidden()

    const viewport = page.viewportSize()
    if (!viewport) throw new Error('Expected viewport for tablet gesture test.')

    await swipeHorizontally(page, { x: viewport.width - 8, y: 220 }, { x: viewport.width - 150, y: 220 })
    await expect(propertiesTitle).toBeVisible()
  })

  for (const scenarioState of tabletScenarioStates) {
    test(`captures the ${scenarioState.description} state on tablet layouts`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'phone-portrait', 'Phone layout captures the scrollable tablet preview only.')
      test.skip(Boolean(scenarioState.landscapeOnly) && testInfo.project.name !== 'tablet-landscape', 'Sidebar density is visible only in tablet landscape.')

      await page.goto(`/?scenario=${scenarioState.scenario}`)

      await expect(page.getByText(scenarioState.expectedText).first()).toBeVisible()

      await captureUiState({
        description: scenarioState.description,
        page,
        projectName: testInfo.project.name,
      })
    })
  }

  for (const phoneState of phoneStates) {
    test(`captures the phone ${phoneState.description} state`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'phone-portrait', 'Phone shell states are captured only in the phone viewport.')

      await page.goto(phoneState.query)

      await expect(page.getByText(phoneState.expectedText).first()).toBeVisible()

      await captureUiState({
        description: phoneState.description,
        page,
        projectName: testInfo.project.name,
      })
    })
  }

  for (const phoneState of phoneScenarioStates) {
    test(`captures the phone ${phoneState.description} scenario`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'phone-portrait', 'Phone shell scenarios are captured only in the phone viewport.')

      await page.goto(phoneState.query)

      await expect(page.getByText(phoneState.expectedText).first()).toBeVisible()

      await captureUiState({
        description: phoneState.description,
        page,
        projectName: testInfo.project.name,
      })
    })
  }

  test('captures an injected local vault read-only state', async ({ page }, testInfo) => {
    const snapshot = await localVaultSnapshot()
    test.skip(!snapshot, 'Set MOBILE_QA_VAULT_PATH to capture a real local vault snapshot.')
    if (!snapshot) return

    await page.goto('/?source=host-vault')

    await expect(page.getByText(snapshot.notes[0]?.title ?? '').first()).toBeVisible()

    await captureUiState({
      description: 'local-vault',
      page,
      projectName: testInfo.project.name,
    })
  })
})

async function swipeHorizontally(
  page: Page,
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  const client = await page.context().newCDPSession(page)
  const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }

  await client.send('Input.dispatchTouchEvent', {
    touchPoints: [start],
    type: 'touchStart',
  })
  await client.send('Input.dispatchTouchEvent', {
    touchPoints: [midpoint],
    type: 'touchMove',
  })
  await client.send('Input.dispatchTouchEvent', {
    touchPoints: [end],
    type: 'touchMove',
  })
  await client.send('Input.dispatchTouchEvent', {
    touchPoints: [],
    type: 'touchEnd',
  })
  await client.detach()
}

async function assertNoteListParity(page: Page) {
  const noteListPanel = page.getByTestId('note-list-panel')
  const selectedRow = page.getByTestId('note-row-workflow-orchestration')
  const nextRow = page.getByTestId('note-row-open-source-project')

  await expect(noteListPanel).toBeVisible()
  await expect(selectedRow).toBeVisible()
  await expect(nextRow).toBeVisible()

  const panelBox = await requiredBox(noteListPanel)
  const selectedBox = await requiredBox(selectedRow)
  const nextBox = await requiredBox(nextRow)

  expectClose({ actual: selectedBox.x, expected: panelBox.x, message: 'selected note row starts at the note-list panel edge' })
  expectClose({ actual: selectedBox.width, expected: panelBox.width, message: 'selected note row spans the full note-list panel' })
  expectClose({ actual: nextBox.y, expected: selectedBox.y + selectedBox.height, message: 'note rows are separated by the desktop border, not by wrapper margins' })

  await expectCssValue({ locator: selectedRow, property: 'background-color', expected: await cssColor({ page, color: desktopParityColors.accentGreenLight }) })
  await expectCssValue({ locator: selectedRow, property: 'border-left-color', expected: await cssColor({ page, color: desktopParityColors.accentGreen }) })
  await expectCssValue({ locator: selectedRow, property: 'border-left-width', expected: `${desktopNoteItemParity.borderLeftWidth}px` })
  await expectCssValue({ locator: selectedRow, property: 'border-bottom-color', expected: await cssColor({ page, color: desktopParityColors.borderDefault }) })
  await expectCssValue({ locator: selectedRow, property: 'border-top-left-radius', expected: '0px' })
  await expectCssValue({ locator: selectedRow, property: 'margin-bottom', expected: '0px' })
  await expectChildCssValue({ locator: selectedRow, property: 'padding-top', expected: `${desktopNoteItemParity.padding.top}px` })
  await expectChildCssValue({ locator: selectedRow, property: 'padding-left', expected: `${desktopNoteItemParity.selectedPaddingLeft}px` })
  await expectChildCssValue({ locator: selectedRow, property: 'padding-right', expected: `${desktopNoteItemParity.padding.right}px` })
}

async function assertSidebarParity(page: Page) {
  const primarySection = page.getByTestId('sidebar-section-primary')
  const favoritesTitle = page.getByTestId('sidebar-section-title-favorites')
  const favoritesTitleText = page.getByTestId('sidebar-section-title-text-favorites')
  const typesCount = page.getByTestId('sidebar-section-count-types')
  const inboxItem = page.getByTestId('sidebar-item-inbox')

  await expect(primarySection).toBeVisible()
  await expect(favoritesTitle).toBeVisible()
  await expect(inboxItem).toBeVisible()

  await expectCssValue({ locator: primarySection, property: 'padding-top', expected: `${desktopSidebarParity.topNavPadding.top}px` })
  await expectCssValue({ locator: primarySection, property: 'padding-left', expected: `${desktopSidebarParity.topNavPadding.left}px` })
  await expectCssValue({ locator: primarySection, property: 'border-bottom-color', expected: await cssColor({ page, color: desktopParityColors.borderDefault }) })
  await expectCssValue({ locator: favoritesTitle, property: 'padding-top', expected: `${desktopSidebarParity.groupHeaderPadding.withCount.top}px` })
  await expectCssValue({ locator: favoritesTitle, property: 'padding-left', expected: `${desktopSidebarParity.groupHeaderPadding.withCount.left}px` })
  await expectCssValue({ locator: favoritesTitleText, property: 'color', expected: await cssColor({ page, color: desktopParityColors.textSecondary }) })
  await expectCssValue({ locator: typesCount, property: 'font-size', expected: `${desktopSidebarParity.countPillTextSize}px` })
  await expectCssValue({ locator: typesCount, property: 'height', expected: '18px' })
  await expectCssValue({ locator: typesCount, property: 'border-radius', expected: `${desktopSidebarParity.countPillRadius}px` })
  await expectCssValue({ locator: inboxItem, property: 'background-color', expected: await cssColor({ page, color: desktopParityColors.accentBlueLight }) })
}

async function cssColor({ color, page }: ColorNormalizationRequest) {
  return page.evaluate((value) => {
    const node = document.createElement('div')
    node.style.color = value
    document.body.append(node)
    const computed = getComputedStyle(node).color
    node.remove()
    return computed
  }, color)
}

async function cssValue({ locator, property }: CssQuery) {
  return locator.evaluate((element, cssProperty) => getComputedStyle(element).getPropertyValue(cssProperty), property)
}

async function childCssValue({ locator, property }: CssQuery) {
  return locator.evaluate((element, cssProperty) => {
    const child = element.firstElementChild
    if (!child) throw new Error('Expected parity surface to have a child content element.')
    return getComputedStyle(child).getPropertyValue(cssProperty)
  }, property)
}

async function expectCssValue(expectation: CssExpectation) {
  expect(await cssValue(expectation)).toBe(expectation.expected)
}

async function expectChildCssValue(expectation: CssExpectation) {
  expect(await childCssValue(expectation)).toBe(expectation.expected)
}

async function requiredBox(locator: Locator) {
  const box = await locator.boundingBox()
  if (!box) throw new Error('Expected element to have a bounding box.')
  return box
}

function expectClose({ actual, expected, message }: LayoutExpectation) {
  expect(Math.abs(actual - expected), message).toBeLessThanOrEqual(layoutTolerance)
}

async function localVaultSnapshot(): Promise<MobileWorkspaceSnapshot | null> {
  if (!localVaultPath) return null

  localVaultSnapshotPromise ??= readLocalVaultFiles(localVaultPath).then((files) => buildLocalVaultWorkspaceSnapshot({
    files,
    vaultLabel: basename(localVaultPath),
    vaultPath: localVaultPath,
  }))

  return localVaultSnapshotPromise
}

async function readLocalVaultFiles(vaultPath: string): Promise<LocalVaultFile[]> {
  const markdownPaths = await listMarkdownFiles(vaultPath)
  const files: LocalVaultFile[] = []

  for (let index = 0; index < markdownPaths.length; index += 64) {
    files.push(...await Promise.all(markdownPaths.slice(index, index + 64).map((absolutePath) => readLocalVaultFile(vaultPath, absolutePath))))
  }

  return files
}

async function listMarkdownFiles(rootPath: string): Promise<string[]> {
  const entries = await readdir(rootPath, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const absolutePath = join(rootPath, entry.name)
    if (entry.isDirectory() && shouldReadDirectory(entry.name)) {
      files.push(...await listMarkdownFiles(absolutePath))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(absolutePath)
    }
  }

  return files
}

function shouldReadDirectory(name: string): boolean {
  return !name.startsWith('.') && name !== 'node_modules'
}

async function readLocalVaultFile(vaultPath: string, absolutePath: string): Promise<LocalVaultFile> {
  const [content, metadata] = await Promise.all([
    readFile(absolutePath, 'utf8'),
    stat(absolutePath),
  ])

  return {
    absolutePath,
    content,
    createdAt: metadata.birthtimeMs,
    modifiedAt: metadata.mtimeMs,
    relativePath: relative(vaultPath, absolutePath).replaceAll('\\', '/'),
    size: metadata.size,
  }
}
