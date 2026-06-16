#!/usr/bin/env node
/* global console, process, setTimeout, URL */

import { spawnSync } from 'node:child_process'
import {
  assertNativeMobileLayoutMetrics,
  assertNativeWysiwygEditorLayoutMetrics,
  formatNativeLayoutAssertionFailures,
  latestNativeLayoutMetrics,
  parseNativeLayoutMetrics,
} from '../src/qa/nativeLayoutMetrics.ts'
import { assertNativeQaOpenUrl } from '../src/qa/nativeQaUrls.ts'
import {
  assertNativeWysiwygMutationProofs,
  formatNativeWysiwygMutationFailures,
  nativeWysiwygMutationPreProofLogText,
  parseNativeWysiwygMutationProofs,
} from '../src/qa/nativeWysiwygMutationProbe.ts'

const defaultLogWindow = '5m'
const defaultExpoGoBundleId = 'host.exp.Exponent'

function printHelp() {
  console.log(`Assert native iOS Simulator layout metrics for mobile UI QA.

Usage:
  node apps/mobile/scripts/assert-ios-layout-metrics.mjs [options]

Options:
  --device <udid>       Simulator UDID. Defaults to MOBILE_QA_SIMULATOR_UDID, then the booted iPad.
  --last <duration>     log show window when no URL is opened, such as 90s or 5m. Defaults to ${defaultLogWindow}.
  --open-url <url>      Open a simulator URL before collecting logs. Use Expo deep links with layoutProbe=1.
                       http(s) URLs are rejected because they open Mobile Safari, not the native app.
  --require-wysiwyg     Also require WYSIWYG editor layout metrics from editorMode=wysiwyg QA URLs.
  --require-wysiwyg-mutation
                       Also require the native TenTap mutation/save proof from wysiwygMutationProbe=1.
  --wait <ms>           Delay after opening a URL before collecting logs. Defaults to 3000.
  --help                Show this help.
`)
}

function readOption(args, name, fallback) {
  const index = args.indexOf(name)
  if (index === -1) return fallback

  const value = args[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value`)
  }

  return value
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' })
  if (result.status !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim() || `exit ${result.status}`
    throw new Error(`${command} ${args.join(' ')} failed: ${detail}`)
  }

  return [result.stdout, result.stderr].filter(Boolean).join('\n')
}

function tryRun(command, args) {
  spawnSync(command, args, { encoding: 'utf8' })
}

function listBootedDevices() {
  const json = run('xcrun', ['simctl', 'list', 'devices', 'booted', '--json'])
  const parsed = JSON.parse(json)
  return Object.values(parsed.devices ?? {}).flat()
}

function selectDevice(requestedDevice) {
  if (requestedDevice) return requestedDevice

  const bootedDevices = listBootedDevices()
  const iPad = bootedDevices.find((device) => device.name?.toLowerCase().includes('ipad'))
  const selected = iPad ?? bootedDevices[0]
  if (!selected?.udid) {
    throw new Error('No booted iOS Simulator found. Start one with `pnpm mobile:ios` first.')
  }

  return selected.udid
}

function collectSimulatorLogs(device, { includeWysiwygMutation, last, start }) {
  const timeArgs = start ? ['--start', start] : ['--last', last]
  return run('xcrun', [
    'simctl',
    'spawn',
    device,
    'log',
    'show',
    ...timeArgs,
    '--style',
    'compact',
    '--predicate',
    simulatorLogPredicate(includeWysiwygMutation),
  ])
}

function simulatorLogPredicate(includeWysiwygMutation) {
  const layoutPredicate = 'eventMessage CONTAINS "TOLARIA_MOBILE_LAYOUT_METRIC"'
  if (!includeWysiwygMutation) return layoutPredicate

  return `${layoutPredicate} OR eventMessage CONTAINS "TOLARIA_MOBILE_WYSIWYG_MUTATION_PROBE"`
}

async function openFreshProbeUrl(device, url, waitMs) {
  if (isExpoGoUrl(url)) {
    terminateExpoGo(device)
    await sleep(500)
    const runId = Date.now().toString()
    run('xcrun', ['simctl', 'openurl', device, appendQueryParam(withLayoutProbe(url, true), 'qaRun', runId)])
    await sleep(Math.max(waitMs, 9000))
    return
  }

  const runId = Date.now().toString()
  run('xcrun', ['simctl', 'openurl', device, appendQueryParam(withLayoutProbe(url, false), 'qaRun', `${runId}-reset`)])
  await sleep(Math.min(waitMs, 750))
  run('xcrun', ['simctl', 'openurl', device, appendQueryParam(withLayoutProbe(url, true), 'qaRun', runId)])
  await sleep(waitMs)
}

function isExpoGoUrl(url) {
  const protocol = new URL(url).protocol.toLowerCase()
  return protocol === 'exp:' || protocol === 'exps:'
}

function terminateExpoGo(device) {
  const bundleId = process.env.MOBILE_QA_EXPO_GO_BUNDLE_ID ?? defaultExpoGoBundleId
  tryRun('xcrun', ['simctl', 'terminate', device, bundleId])
}

function withLayoutProbe(url, enabled) {
  const nextValue = enabled ? '1' : '0'
  if (url.includes('layoutProbe=')) {
    return url.replace(/([?&])layoutProbe=[^&]*/u, `$1layoutProbe=${nextValue}`)
  }

  return appendQueryParam(url, 'layoutProbe', nextValue)
}

function appendQueryParam(url, key, value) {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function simulatorLogTimestamp(date) {
  return [
    date.getFullYear(),
    padTimestampPart(date.getMonth() + 1),
    padTimestampPart(date.getDate()),
  ].join('-') + ' ' + [
    padTimestampPart(date.getHours()),
    padTimestampPart(date.getMinutes()),
    padTimestampPart(date.getSeconds()),
  ].join(':')
}

function padTimestampPart(value) {
  return String(value).padStart(2, '0')
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--help')) {
    printHelp()
    return
  }

  const device = selectDevice(readOption(args, '--device', process.env.MOBILE_QA_SIMULATOR_UDID))
  const openUrl = readOption(args, '--open-url', undefined)
  const last = readOption(args, '--last', defaultLogWindow)
  const requireWysiwyg = args.includes('--require-wysiwyg')
  const requireWysiwygMutation = args.includes('--require-wysiwyg-mutation')
  const waitMs = Number(readOption(args, '--wait', '3000'))
  let logStart

  if (openUrl) {
    assertNativeQaOpenUrl(openUrl, 'Native iOS layout metrics')
    logStart = simulatorLogTimestamp(new Date(Date.now() - 1000))
    await openFreshProbeUrl(device, nativeQaUrl(openUrl, { requireWysiwygMutation }), waitMs)
  }

  const logs = collectSimulatorLogs(device, {
    includeWysiwygMutation: requireWysiwygMutation,
    last,
    start: logStart,
  })
  const layoutLogs = requireWysiwygMutation ? nativeWysiwygMutationPreProofLogText(logs) : logs
  const metrics = latestNativeLayoutMetrics(parseNativeLayoutMetrics(layoutLogs))
  const failures = [
    ...assertNativeMobileLayoutMetrics(metrics),
    ...(requireWysiwyg ? assertNativeWysiwygEditorLayoutMetrics(metrics) : []),
  ]
  const mutationFailures = requireWysiwygMutation
    ? assertNativeWysiwygMutationProofs(parseNativeWysiwygMutationProofs(logs))
    : []

  if (failures.length > 0 || mutationFailures.length > 0) {
    throw new Error(formatNativeQaFailures({ failures, mutationFailures }))
  }

  console.log(`Native iOS layout metrics passed (${Object.keys(metrics).length} metrics).`)
}

function nativeQaUrl(openUrl, { requireWysiwygMutation }) {
  return requireWysiwygMutation
    ? appendQueryParam(openUrl, 'wysiwygMutationProbe', '1')
    : openUrl
}

function formatNativeQaFailures({ failures, mutationFailures }) {
  return [
    failures.length > 0 ? `Native iOS layout metrics failed:\n${formatNativeLayoutAssertionFailures(failures)}` : '',
    mutationFailures.length > 0 ? `Native WYSIWYG mutation proof failed:\n${formatNativeWysiwygMutationFailures(mutationFailures)}` : '',
  ].filter(Boolean).join('\n')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
