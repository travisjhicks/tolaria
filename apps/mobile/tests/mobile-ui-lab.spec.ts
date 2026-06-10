import { expect, test } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'

type ScreenshotRecord = {
  description: string
  path: string
  project: string
  viewport: { height: number; width: number } | null
}

const screenshotDir = process.env.MOBILE_QA_SCREENSHOT_DIR ?? '/tmp/tolaria-mobile-ui-screenshots'

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
])

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
})
