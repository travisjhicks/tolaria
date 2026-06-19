#!/usr/bin/env node
/* global console, process, setTimeout, URL */

import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import {
  assertNativeMobileLayoutMetrics,
  assertNativePhoneLayoutMetrics,
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
import {
  assertNativeWysiwygPersistenceProofs,
  formatNativeWysiwygPersistenceFailures,
  parseNativeWysiwygPersistenceProofs,
} from '../src/qa/nativeWysiwygPersistenceProbe.ts'

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
  --phone-state <state> Assert compact phone layout metrics for list, sidebar, editor, or properties.
  --require-wysiwyg     Also require WYSIWYG editor layout metrics from editorMode=wysiwyg QA URLs.
  --require-wysiwyg-mutation
                       Also require the native TenTap mutation/save proof from wysiwygMutationProbe=1.
                       This route checks WYSIWYG editor metrics plus mutation proof instead of
                       default fixture shell metrics.
  --require-wysiwyg-persistence
                       Also require the native TenTap save to persist through Expo FileSystem.
                       This route uses an isolated native vault, so it checks WYSIWYG editor metrics
                       plus persistence proof instead of default fixture shell metrics.
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

function parseOptions(args) {
  if (args.includes('--help')) return { help: true }

  return {
    help: false,
    last: readOption(args, '--last', defaultLogWindow),
    openUrl: readOption(args, '--open-url', undefined),
    phoneState: readPhoneState(args),
    requestedDevice: readOption(args, '--device', process.env.MOBILE_QA_SIMULATOR_UDID),
    requireWysiwyg: args.includes('--require-wysiwyg'),
    requireWysiwygMutation: args.includes('--require-wysiwyg-mutation'),
    requireWysiwygPersistence: args.includes('--require-wysiwyg-persistence'),
    waitMs: readWaitMs(args),
  }
}

function readPhoneState(args) {
  const value = readOption(args, '--phone-state', undefined)
  if (!value) return undefined
  if (value === 'editor' || value === 'list' || value === 'properties' || value === 'sidebar') return value

  throw new Error('--phone-state must be one of: list, sidebar, editor, properties')
}

function readWaitMs(args) {
  const waitMs = Number(readOption(args, '--wait', '3000'))
  if (!Number.isFinite(waitMs) || waitMs < 0) {
    throw new Error('--wait must be a non-negative number of milliseconds')
  }

  return waitMs
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

function collectSimulatorLogs(device, { includeWysiwygMutation, includeWysiwygPersistence, last, start }) {
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
    simulatorLogPredicate({ includeWysiwygMutation, includeWysiwygPersistence }),
  ])
}

function simulatorLogPredicate({ includeWysiwygMutation, includeWysiwygPersistence }) {
  const predicates = ['eventMessage CONTAINS "TOLARIA_MOBILE_LAYOUT_METRIC"']
  if (includeWysiwygMutation) {
    predicates.push('eventMessage CONTAINS "TOLARIA_MOBILE_WYSIWYG_MUTATION_PROBE"')
  }
  if (includeWysiwygPersistence) {
    predicates.push('eventMessage CONTAINS "TOLARIA_MOBILE_WYSIWYG_PERSISTENCE_PROBE"')
  }

  return predicates.join(' OR ')
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

async function startMetricSinkServer() {
  const metrics = []
  const server = createServer((request, response) => {
    if (request.method !== 'POST') {
      response.statusCode = 404
      response.end()
      return
    }

    collectRequestBody(request)
      .then((body) => {
        metrics.push(JSON.parse(body))
        response.statusCode = 204
        response.end()
      })
      .catch(() => {
        response.statusCode = 400
        response.end()
      })
  })

  await listenOnLoopback(server)
  const { port } = server.address()

  return {
    close: () => closeServer(server),
    logText: () => metrics.map(metricLogLine).join('\n'),
    url: `http://127.0.0.1:${port}`,
  }
}

function collectRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = ''
    request.setEncoding('utf8')
    request.on('data', (chunk) => { body += chunk })
    request.on('end', () => resolve(body))
    request.on('error', reject)
  })
}

function listenOnLoopback(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject)
      resolve()
    })
  })
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
}

function metricLogLine(metric) {
  return `TOLARIA_MOBILE_LAYOUT_METRIC ${JSON.stringify(metric)}`
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
  const options = parseOptions(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }

  await runNativeQa(options)
}

async function runNativeQa(options) {
  const device = selectDevice(options.requestedDevice)
  const metricSink = options.openUrl ? await startMetricSinkServer() : null

  try {
    const logStart = await openProbeIfRequested({ device, metricSink, options })
    const evidence = collectNativeQaEvidence({ device, logStart, metricSink, options })
    const metrics = latestNativeLayoutMetrics(parseNativeLayoutMetrics(layoutLogText(evidence.layoutLogs, options)))
    const { failures, mutationFailures, persistenceFailures } = nativeQaFailures({
      metrics,
      options,
      proofLogs: evidence.proofLogs,
    })

    if (hasNativeQaFailures({ failures, mutationFailures, persistenceFailures })) {
      throw new Error(formatNativeQaFailures({ failures, mutationFailures, persistenceFailures }))
    }

    console.log(`Native iOS layout metrics passed (${Object.keys(metrics).length} metrics).`)
  } finally {
    await metricSink?.close()
  }
}

async function openProbeIfRequested({ device, metricSink, options }) {
  if (!options.openUrl) return undefined

  assertNativeQaOpenUrl(options.openUrl, 'Native iOS layout metrics')
  const logStart = simulatorLogTimestamp(new Date(Date.now() - 1000))
  await openFreshProbeUrl(
    device,
    metricSinkUrl(nativeQaUrl(options.openUrl, {
      requireWysiwygMutation: requiresWysiwygMutationProof(options),
      requireWysiwygPersistence: options.requireWysiwygPersistence,
    }), metricSink),
    options.waitMs,
  )
  return logStart
}

function collectNativeQaEvidence({ device, logStart, metricSink, options }) {
  const simulatorLogs = collectSimulatorLogs(device, {
    includeWysiwygMutation: requiresWysiwygMutationProof(options),
    includeWysiwygPersistence: options.requireWysiwygPersistence,
    last: options.last,
    start: logStart,
  })

  return {
    layoutLogs: metricSink ? metricSink.logText() : simulatorLogs,
    proofLogs: simulatorLogs,
  }
}

function layoutLogText(logs, options) {
  return requiresWysiwygMutationProof(options) ? nativeWysiwygMutationPreProofLogText(logs) : logs
}

function nativeQaFailures({ metrics, options, proofLogs }) {
  return {
    failures: nativeLayoutFailures({
      metrics,
      phoneState: options.phoneState,
      requireWysiwyg: options.requireWysiwyg,
      requireWysiwygMutation: options.requireWysiwygMutation,
      requireWysiwygPersistence: options.requireWysiwygPersistence,
    }),
    mutationFailures: options.requireWysiwygMutation
      ? assertNativeWysiwygMutationProofs(parseNativeWysiwygMutationProofs(proofLogs))
      : [],
    persistenceFailures: options.requireWysiwygPersistence
      ? assertNativeWysiwygPersistenceProofs(parseNativeWysiwygPersistenceProofs(proofLogs))
      : [],
  }
}

function requiresWysiwygMutationProof(options) {
  return options.requireWysiwygMutation || options.requireWysiwygPersistence
}

function metricSinkUrl(url, metricSink) {
  return metricSink ? appendQueryParam(url, 'metricSink', metricSink.url) : url
}

function nativeQaUrl(openUrl, { requireWysiwygMutation, requireWysiwygPersistence }) {
  const mutationUrl = requireWysiwygMutation
    ? appendQueryParam(openUrl, 'wysiwygMutationProbe', '1')
    : openUrl

  return requireWysiwygPersistence
    ? appendQueryParam(mutationUrl, 'wysiwygPersistenceProbe', '1')
    : mutationUrl
}

function nativeLayoutFailures({ metrics, phoneState, requireWysiwyg, requireWysiwygMutation, requireWysiwygPersistence }) {
  if (requireWysiwygMutation || requireWysiwygPersistence) {
    return requireWysiwyg ? assertNativeWysiwygEditorLayoutMetrics(metrics) : []
  }

  if (phoneState) {
    return [
      ...assertNativePhoneLayoutMetrics(metrics, phoneState),
      ...(requireWysiwyg ? assertNativeWysiwygEditorLayoutMetrics(metrics) : []),
    ]
  }

  return [
    ...assertNativeMobileLayoutMetrics(metrics),
    ...(requireWysiwyg ? assertNativeWysiwygEditorLayoutMetrics(metrics) : []),
  ]
}

function hasNativeQaFailures({ failures, mutationFailures, persistenceFailures }) {
  return failureCount([failures, mutationFailures, persistenceFailures]) > 0
}

function failureCount(failureGroups) {
  return failureGroups.reduce((total, group) => total + group.length, 0)
}

function formatNativeQaFailures({ failures, mutationFailures, persistenceFailures }) {
  return [
    failures.length > 0 ? `Native iOS layout metrics failed:\n${formatNativeLayoutAssertionFailures(failures)}` : '',
    mutationFailures.length > 0 ? `Native WYSIWYG mutation proof failed:\n${formatNativeWysiwygMutationFailures(mutationFailures)}` : '',
    persistenceFailures.length > 0 ? `Native WYSIWYG persistence proof failed:\n${formatNativeWysiwygPersistenceFailures(persistenceFailures)}` : '',
  ].filter(Boolean).join('\n')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
