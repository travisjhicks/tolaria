import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createMobileSavedViewFilename,
  mobileSavedViewOrderUpdates,
  moveMobileSavedView,
  nextMobileSavedViewOrder,
  evaluateMobileSavedView,
  orderedMobileSavedViews,
  parseMobileSavedViewFile,
  serializeMobileSavedViewDefinition,
} from './mobileSavedViews'
import type { MobileNote, MobileSavedView } from './mobileWorkspaceModel'

describe('mobile saved views', () => {
  afterEach(() => vi.useRealTimers())

  it('parses desktop saved-view YAML and evaluates filters against mobile notes', () => {
    const view = parseMobileSavedViewFile({
      relativePath: 'views/active-projects.yml',
      content: `name: Active Projects
icon: rocket
color: blue
sort: "modified:desc"
filters:
  all:
    - field: type
      op: equals
      value: Project
    - field: status
      op: any_of
      value: [Active, Draft]
`,
    }, 0)

    expect(view).toMatchObject({
      filename: 'active-projects.yml',
      id: 'view-active-projects',
      definition: {
        color: 'blue',
        icon: 'rocket',
        name: 'Active Projects',
        sort: 'modified:desc',
      },
    })
    expect(evaluateMobileSavedView(view!, [
      note({ id: 'draft-project', modifiedAt: 10, status: 'Draft', title: 'Draft project', type: 'Project' }),
      note({ id: 'active-project', modifiedAt: 20, status: 'Active', title: 'Active project', type: 'Project' }),
      note({ id: 'done-project', modifiedAt: 30, status: 'Done', title: 'Done project', type: 'Project' }),
      note({ id: 'active-procedure', modifiedAt: 40, status: 'Active', title: 'Active procedure', type: 'Procedure' }),
    ]).map((candidate) => candidate.id)).toEqual(['active-project', 'draft-project'])
  })

  it('loads legacy desktop saved views from the pre-migration .laputa directory', () => {
    const view = parseMobileSavedViewFile({
      relativePath: '.laputa/views/legacy-focus.yml',
      content: `name: Legacy Focus
filters:
  all:
    - field: type
      op: equals
      value: Essay
`,
    }, 0)

    expect(view).toMatchObject({
      filename: 'legacy-focus.yml',
      id: 'view-legacy-focus',
      definition: { name: 'Legacy Focus' },
    })
    expect(evaluateMobileSavedView(view!, [
      note({ id: 'essay', type: 'Essay' }),
      note({ id: 'procedure', type: 'Procedure' }),
    ]).map((candidate) => candidate.id)).toEqual(['essay'])
  })

  it('parses desktop saved-view inline YAML quoted scalars', () => {
    const commaView = parseMobileSavedViewFile({
      relativePath: 'views/tagged.yml',
      content: `name: Tagged
listPropertiesDisplay: ["AI, UX", Status]
filters:
  all:
    - field: tags
      op: any_of
      value: ["AI, UX", Design]
`,
    }, 0)

    expect(commaView?.definition.listPropertiesDisplay).toEqual(['AI, UX', 'Status'])
    expect(evaluateMobileSavedView(commaView!, [
      note({ id: 'quoted-comma', tags: ['AI, UX'] }),
      note({ id: 'plain', tags: ['Design'] }),
      note({ id: 'split-would-be-wrong', tags: ['AI'] }),
    ]).map((candidate) => candidate.id)).toEqual(['quoted-comma', 'plain'])

    const hashView = parseMobileSavedViewFile({
      relativePath: 'views/hash-tags.yml',
      content: `name: Hash Tags # regular comment
listPropertiesDisplay: ["Topic #", Status]
filters:
  all:
    - field: tags
      op: any_of
      value: ["AI # UX", Design] # regular comment
`,
    }, 0)

    expect(hashView?.definition.name).toBe('Hash Tags')
    expect(hashView?.definition.listPropertiesDisplay).toEqual(['Topic #', 'Status'])
    expect(evaluateMobileSavedView(hashView!, [
      note({ id: 'hash-content', tags: ['AI # UX'] }),
      note({ id: 'plain', tags: ['Design'] }),
      note({ id: 'hash-prefix-only', tags: ['AI'] }),
    ]).map((candidate) => candidate.id)).toEqual(['hash-content', 'plain'])
  })

  it('parses desktop YAML escaped scalars and null shorthands', () => {
    const view = parseMobileSavedViewFile({
      relativePath: 'views/escaped-scalars.yml',
      content: String.raw`name: "Luca \"Focus\" \u2605"
icon: "~"
color: ~
listPropertiesDisplay: ["Quote \"A\"", 'Owner''s Status']
filters:
  all:
    - field: title
      op: equals
      value: "Mobile\nQA"
    - field: priority
      op: equals
      value:
    - field: category
      op: equals
      value: ~
`,
    }, 0)

    expect(view?.definition).toMatchObject({
      color: null,
      icon: '~',
      listPropertiesDisplay: ['Quote "A"', "Owner's Status"],
      name: 'Luca "Focus" \u2605',
    })
    expect(view?.definition.filters).toMatchObject({
      all: [
        { field: 'title', op: 'equals', value: 'Mobile\nQA' },
        { field: 'priority', op: 'equals', value: null },
        { field: 'category', op: 'equals', value: null },
      ],
    })
    expect(evaluateMobileSavedView(view!, [
      note({ id: 'missing-null-fields', title: 'Mobile\nQA' }),
      note({ id: 'empty-priority', properties: [{ key: 'priority', label: 'Priority', value: '' }], title: 'Mobile\nQA' }),
      note({ id: 'literal-backslash', title: String.raw`Mobile\nQA` }),
    ]).map((candidate) => candidate.id)).toEqual(['missing-null-fields'])
  })

  it('sorts saved views with desktop custom-property sort strings', () => {
    const parsedView = (name: string, sort: string, order: number) => parseMobileSavedViewFile({ content: `name: ${name}\nsort: "${sort}"\nfilters:\n  all: []\n`, relativePath: `views/${name.toLowerCase().replace(/\s+/gu, '-')}.yml` }, order)
    const rankedView = parsedView('Ranked', 'property:Priority:asc', 0)
    const datedView = parsedView('Dated', 'Due:desc', 1)
    const offsetDateView = parsedView('Offset Dates', 'property:Due:asc', 2)
    const typePropertyView = parsedView('Type Property', 'type:asc', 3)
    const notes = [
      note({ id: 'missing' }),
      note({ id: 'low', properties: [{ key: 'Priority', label: 'Priority', value: 3 }, { key: 'Due', label: 'Due', value: '2026-06-10' }] }),
      note({ id: 'high', properties: [{ key: 'Priority', label: 'Priority', value: 1 }, { key: 'Due', label: 'Due', value: '2026-06-20' }] }),
    ]

    expect(evaluateMobileSavedView(rankedView!, notes).map((candidate) => candidate.id)).toEqual(['high', 'low', 'missing'])
    expect(evaluateMobileSavedView(datedView!, notes).map((candidate) => candidate.id)).toEqual(['high', 'low', 'missing'])
    expect(evaluateMobileSavedView(offsetDateView!, [
      note({ id: 'late-us-evening', properties: [{ key: 'Due', label: 'Due', value: '2026-06-10T23:00:00-05:00' }] }),
      note({ id: 'utc-midnight', properties: [{ key: 'Due', label: 'Due', value: '2026-06-11T00:00:00Z' }] }),
    ]).map((candidate) => candidate.id)).toEqual(['utc-midnight', 'late-us-evening'])
    expect(evaluateMobileSavedView(typePropertyView!, [
      note({ id: 'missing', type: 'Book' }),
      note({ id: 'frontmatter-zeta', properties: [{ key: 'type', label: 'type', value: 'Zeta' }], type: 'Essay' }),
      note({ id: 'frontmatter-alpha', properties: [{ key: 'type', label: 'type', value: 'Alpha' }], type: 'Procedure' }),
    ]).map((candidate) => candidate.id)).toEqual(['frontmatter-alpha', 'frontmatter-zeta', 'missing'])
  })

  it('sorts desktop scalar-array custom properties by the whole array text', () => {
    const view = parseMobileSavedViewFile({
      content: 'name: Ranked Tags\nsort: "property:Tags:asc"\nfilters:\n  all: []\n',
      relativePath: 'views/ranked-tags.yml',
    }, 0)

    expect(evaluateMobileSavedView(view!, [
      note({ id: 'same-first-late', properties: [{ key: 'Tags', label: 'Tags', value: ['alpha', 'zeta'] }] }),
      note({ id: 'same-first-early', properties: [{ key: 'Tags', label: 'Tags', value: ['alpha', 'beta'] }] }),
      note({ id: 'later-first', properties: [{ key: 'Tags', label: 'Tags', value: ['bravo'] }] }),
    ]).map((candidate) => candidate.id)).toEqual(['same-first-early', 'same-first-late', 'later-first'])
  })

  it('sorts saved views with desktop built-in sort semantics', () => {
    const createdView = parseMobileSavedViewFile(
      { content: 'name: Created\nsort: "created:desc"\nfilters:\n  all: []\n', relativePath: 'views/created.yml' },
      0,
    )
    const statusView = parseMobileSavedViewFile(
      { content: 'name: Status\nsort: "status:asc"\nfilters:\n  all: []\n', relativePath: 'views/status.yml' },
      1,
    )

    expect(evaluateMobileSavedView(createdView!, [
      note({ createdAt: null, id: 'missing-created-newer-modified', modifiedAt: 3000 }),
      note({ createdAt: 2000, id: 'created-middle', modifiedAt: 1000 }),
      note({ createdAt: 1000, id: 'created-older', modifiedAt: 5000 }),
    ]).map((candidate) => candidate.id)).toEqual(['missing-created-newer-modified', 'created-middle', 'created-older'])

    expect(evaluateMobileSavedView(statusView!, [
      note({ id: 'done', modifiedAt: 1000, status: 'Done' }),
      note({ id: 'active-older', modifiedAt: 1000, status: 'Active' }),
      note({ id: 'empty-status', modifiedAt: 4000, status: '' }),
      note({ id: 'paused', modifiedAt: 1000, status: 'Paused' }),
      note({ id: 'active-newer', modifiedAt: 3000, status: 'Active' }),
    ]).map((candidate) => candidate.id)).toEqual(['active-newer', 'active-older', 'paused', 'done', 'empty-status'])
  })

  it('supports relationship and custom-property fields in saved-view filters', () => {
    const view = parseMobileSavedViewFile({
      relativePath: 'views/blocked-mobile.yml',
      content: `name: Blocked Mobile
filters:
  all:
    - field: depends_on
      op: contains
      value: Expo
    - field: priority
      op: equals
      value: High
`,
    }, 0)

    expect(evaluateMobileSavedView(view!, [
      note({
        id: 'match',
        properties: [{ key: 'priority', label: 'Priority', value: 'High' }],
        relationships: [
          {
            key: 'depends_on',
            kind: 'custom',
            values: [{ title: 'Expo Layout QA', type: 'Procedure', typeTone: 'purple' }],
          },
        ],
      }),
      note({
        id: 'wrong-priority',
        properties: [{ key: 'priority', label: 'Priority', value: 'Low' }],
        relationships: [
          {
            key: 'depends_on',
            kind: 'custom',
            values: [{ title: 'Expo Layout QA', type: 'Procedure', typeTone: 'purple' }],
          },
        ],
      }),
    ]).map((candidate) => candidate.id)).toEqual(['match'])
  })

  it('filters relationship fields by desktop frontmatter key instead of relationship category', () => {
    const hasView = parseMobileSavedViewFile({
      relativePath: 'views/has-roadmap.yml',
      content: `name: Has Roadmap
filters:
  all:
    - field: has
      op: contains
      value: Roadmap
`,
    }, 0)
    const customHasView = parseMobileSavedViewFile({
      relativePath: 'views/has-part-roadmap.yml',
      content: `name: Has Part Roadmap
filters:
  all:
    - field: has_part
      op: contains
      value: Roadmap
`,
    }, 1)
    const notes = [
      note({
        id: 'canonical-has',
        relationships: [{
          key: 'has',
          kind: 'has',
          values: [{ title: 'Roadmap', type: 'Note', typeTone: 'gray' }],
        }],
      }),
      note({
        id: 'custom-has-part',
        relationships: [{
          key: 'has_part',
          kind: 'has',
          values: [{ title: 'Roadmap', type: 'Note', typeTone: 'gray' }],
        }],
      }),
    ]

    expect(evaluateMobileSavedView(hasView!, notes).map((candidate) => candidate.id)).toEqual(['canonical-has'])
    expect(evaluateMobileSavedView(customHasView!, notes).map((candidate) => candidate.id)).toEqual(['custom-has-part'])
  })

  it('evaluates discoverable desktop built-in saved-view fields', () => {
    const view = parseMobileSavedViewFile({
      relativePath: 'views/procedure-docs.yml',
      content: `name: Procedure Docs
filters:
  all:
    - field: isa
      op: equals
      value: Procedure
    - field: filename
      op: contains
      value: runbook
    - field: favorite
      op: equals
      value: true
    - field: body
      op: contains
      value: checklist
`,
    }, 0)

    expect(evaluateMobileSavedView(view!, [
      note({
        favorite: true,
        id: 'Procedures/mobile-runbook.md',
        path: 'Procedures/mobile-runbook.md',
        snippet: 'Release checklist and QA steps',
        type: 'Procedure',
      }),
      note({
        favorite: true,
        id: 'Procedures/mobile-runbook-draft.md',
        path: 'Procedures/mobile-runbook-draft.md',
        snippet: 'Draft without the keyword',
        type: 'Procedure',
      }),
      note({
        favorite: true,
        id: 'Procedures/mobile-guide.md',
        path: 'Procedures/mobile-guide.md',
        snippet: 'Release checklist and QA steps',
        type: 'Procedure',
      }),
    ]).map((candidate) => candidate.id)).toEqual(['Procedures/mobile-runbook.md'])
  })

  it('resolves desktop-non-built-in filter fields through custom properties', () => {
    const view = parseMobileSavedViewFile({ content: 'name: Custom\nfilters:\n  all:\n    - field: created\n      op: equals\n      value: 2026-06-01\n    - field: modified\n      op: equals\n      value: custom-modified\n    - field: path\n      op: equals\n      value: Roadmap\n    - field: organized\n      op: equals\n      value: planned\n', relativePath: 'views/custom.yml' }, 0)
    const notes = [note({ createdAt: Date.parse('2020-01-01'), id: 'custom-property-match', modifiedAt: Date.parse('2020-01-02'), organized: false, path: 'Actual/Location.md', properties: [{ key: 'created', label: 'created', value: '2026-06-01' }, { key: 'modified', label: 'modified', value: 'custom-modified' }, { key: 'path', label: 'path', value: 'Roadmap' }, { key: 'organized', label: 'organized', value: 'planned' }] }), note({ createdAt: Date.parse('2026-06-01'), id: 'metadata-only-match', modifiedAt: Date.parse('2020-01-02'), organized: true, path: 'Roadmap' })]
    expect(evaluateMobileSavedView(view!, notes).map((candidate) => candidate.id)).toEqual(['custom-property-match'])
  })

  it('round-trips nested desktop saved-view filter groups', () => {
    const view = parseMobileSavedViewFile({
      relativePath: 'views/nested-focus.yml',
      content: `name: Nested Focus
filters:
  all:
    - any:
        - field: type
          op: equals
          value: Project
        - all:
            - field: type
              op: equals
              value: Event
            - field: status
              op: equals
              value: Active
    - field: favorite
      op: equals
      value: true
`,
    }, 0)
    const notes = [
      note({ favorite: true, id: 'favorite-project', status: 'Draft', type: 'Project' }),
      note({ favorite: true, id: 'favorite-active-event', status: 'Active', type: 'Event' }),
      note({ favorite: true, id: 'favorite-draft-event', status: 'Draft', type: 'Event' }),
      note({ favorite: false, id: 'plain-project', status: 'Draft', type: 'Project' }),
    ]

    expect(evaluateMobileSavedView(view!, notes).map((candidate) => candidate.id)).toEqual([
      'favorite-project',
      'favorite-active-event',
    ])

    const serialized = serializeMobileSavedViewDefinition(view!.definition)
    const reparsed = parseMobileSavedViewFile({ content: serialized, relativePath: 'views/nested-focus.yml' }, 0)

    expect(serialized).toContain('    - any:')
    expect(serialized).toContain('        - all:')
    expect(evaluateMobileSavedView(reparsed!, notes).map((candidate) => candidate.id)).toEqual([
      'favorite-project',
      'favorite-active-event',
    ])
  })

  it('evaluates regex-enabled saved-view filters like desktop', () => {
    const view = parseMobileSavedViewFile({
      relativePath: 'views/regex.yml',
      content: `name: Regex
filters:
  all:
    - field: title
      op: contains
      value: "^Mobile\\s+QA"
      regex: true
`,
    }, 0)
    const invalidRegexView = parseMobileSavedViewFile({
      relativePath: 'views/invalid-regex.yml',
      content: `name: Invalid Regex
filters:
  all:
    - field: title
      op: contains
      value: "("
      regex: true
`,
    }, 1)
    const unsafeRegexView = parseMobileSavedViewFile({
      relativePath: 'views/unsafe-regex.yml',
      content: `name: Unsafe Regex
filters:
  all:
    - field: title
      op: contains
      value: "(a+)+$"
      regex: true
`,
    }, 2)
    const notes = [
      note({ id: 'match', title: 'Mobile QA Draft' }),
      note({ id: 'miss', title: 'Desktop QA Draft' }),
    ]

    expect(evaluateMobileSavedView(view!, notes).map((candidate) => candidate.id)).toEqual(['match'])
    expect(evaluateMobileSavedView(invalidRegexView!, notes)).toEqual([])
    expect(evaluateMobileSavedView(unsafeRegexView!, [
      note({ id: 'unsafe-would-match', title: 'aaaaaaaaaaaaaaaaaaaaaaaa' }),
    ])).toEqual([])
  })

  it('matches relationship array filters with desktop wikilink semantics', () => {
    const view = parseMobileSavedViewFile({
      relativePath: 'views/session-trail.yml',
      content: `name: Session Trail
filters:
  all:
    - field: related_to
      op: equals
      value: svc-session-trail
`,
    }, 0)

    expect(evaluateMobileSavedView(view!, [
      note({
        id: 'single',
        relationships: [relationship('related_to', [{ ref: '[[svc-session-trail]]', title: 'Trail' }])],
      }),
      note({
        id: 'aliased',
        relationships: [relationship('related_to', [{ ref: '[[svc-session-trail|Trail]]', title: 'Trail' }])],
      }),
      note({
        id: 'multiple',
        relationships: [relationship('related_to', [
          { ref: '[[svc-session-trail]]', title: 'Trail' },
          { ref: '[[other]]', title: 'Other' },
        ])],
      }),
    ]).map((candidate) => candidate.id)).toEqual(['single', 'aliased'])
  })

  it('keeps quoted desktop wikilink filter values as scalar strings', () => {
    const view = parseMobileSavedViewFile({
      relativePath: 'views/tolaria-links.yml',
      content: `name: Tolaria Links
filters:
  all:
    - field: related_to
      op: contains
      value: "[[tolaria]]"
`,
    }, 0)

    expect(evaluateMobileSavedView(view!, [
      note({
        id: 'match',
        relationships: [relationship('related_to', [{ ref: '[[tolaria]]', title: 'Tolaria' }])],
      }),
      note({
        id: 'miss',
        relationships: [relationship('related_to', [{ ref: '[[other]]', title: 'Other' }])],
      }),
    ]).map((candidate) => candidate.id)).toEqual(['match'])
  })

  it('uses exact desktop matching for property-array view filters', () => {
    const view = parseMobileSavedViewFile({
      relativePath: 'views/design-tags.yml',
      content: `name: Design Tags
filters:
  all:
    - field: tags
      op: contains
      value: Design
`,
    }, 0)

    expect(evaluateMobileSavedView(view!, [
      note({ id: 'exact', tags: ['Design'] }),
      note({ id: 'substring', tags: ['Design Systems'] }),
    ]).map((candidate) => candidate.id)).toEqual(['exact'])
  })

  it('matches relative date expressions in saved-view filters', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-07T12:00:00Z'))

    const todayView = parseMobileSavedViewFile({
      relativePath: 'views/today.yml',
      content: `name: Today
filters:
  all:
    - field: Date
      op: equals
      value: today
`,
    }, 0)
    const recentView = parseMobileSavedViewFile({
      relativePath: 'views/recent.yml',
      content: `name: Recent
filters:
  all:
    - field: Date
      op: after
      value: 10 days ago
`,
    }, 1)
    const notes = [
      note({ id: 'older', properties: [{ key: 'Date', label: 'Date', value: '2026-03-20' }] }),
      note({ id: 'recent', properties: [{ key: 'Date', label: 'Date', value: '2026-03-30' }] }),
      note({ id: 'today', properties: [{ key: 'Date', label: 'Date', value: '2026-04-07' }] }),
    ]

    expect(evaluateMobileSavedView(todayView!, notes).map((candidate) => candidate.id)).toEqual(['today'])
    expect(evaluateMobileSavedView(recentView!, notes).map((candidate) => candidate.id)).toEqual(['recent', 'today'])
  })

  it('clamps relative month and year filters to desktop date-fns calendar semantics', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 31, 12))

    const oneMonthAgoView = parseMobileSavedViewFile({
      relativePath: 'views/month-ago.yml',
      content: `name: Month Ago
filters:
  all:
    - field: Date
      op: equals
      value: one month ago
`,
    }, 0)
    const nextMonthView = parseMobileSavedViewFile({
      relativePath: 'views/next-month.yml',
      content: `name: Next Month
filters:
  all:
    - field: Date
      op: equals
      value: in one month
`,
    }, 1)
    const notes = [
      note({ id: 'desktop-month-past', properties: [{ key: 'Date', label: 'Date', value: '2026-02-28' }] }),
      note({ id: 'native-rollover-past', properties: [{ key: 'Date', label: 'Date', value: '2026-03-03' }] }),
      note({ id: 'desktop-month-future', properties: [{ key: 'Date', label: 'Date', value: '2026-04-30' }] }),
      note({ id: 'native-rollover-future', properties: [{ key: 'Date', label: 'Date', value: '2026-05-01' }] }),
    ]

    expect(evaluateMobileSavedView(oneMonthAgoView!, notes).map((candidate) => candidate.id)).toEqual(['desktop-month-past'])
    expect(evaluateMobileSavedView(nextMonthView!, notes).map((candidate) => candidate.id)).toEqual(['desktop-month-future'])

    vi.setSystemTime(new Date(2024, 1, 29, 12))
    const lastYearView = parseMobileSavedViewFile({
      relativePath: 'views/last-year.yml',
      content: `name: Last Year
filters:
  all:
    - field: Date
      op: equals
      value: one year ago
`,
    }, 2)

    expect(evaluateMobileSavedView(lastYearView!, [
      note({ id: 'desktop-year-past', properties: [{ key: 'Date', label: 'Date', value: '2023-02-28' }] }),
      note({ id: 'native-rollover-year', properties: [{ key: 'Date', label: 'Date', value: '2023-03-01' }] }),
    ]).map((candidate) => candidate.id)).toEqual(['desktop-year-past'])
  })

  it('rejects invalid ISO date-only values like desktop saved-view filters', () => {
    const invalidTargetView = parseMobileSavedViewFile({
      relativePath: 'views/invalid-target-date.yml',
      content: `name: Invalid Target Date
filters:
  all:
    - field: Date
      op: equals
      value: 2026-02-31
`,
    }, 0)
    const validTargetView = parseMobileSavedViewFile({
      relativePath: 'views/valid-target-date.yml',
      content: `name: Valid Target Date
filters:
  all:
    - field: Date
      op: equals
      value: 2026-03-03
`,
    }, 1)

    expect(evaluateMobileSavedView(invalidTargetView!, [
      note({ id: 'normalized-target-would-be-wrong', properties: [{ key: 'Date', label: 'Date', value: '2026-03-03' }] }),
    ])).toEqual([])
    expect(evaluateMobileSavedView(validTargetView!, [
      note({ id: 'normalized-field-would-be-wrong', properties: [{ key: 'Date', label: 'Date', value: '2026-02-31' }] }),
    ])).toEqual([])
  })

  it('serializes desktop-compatible saved-view YAML that can be parsed back', () => {
    const content = serializeMobileSavedViewDefinition({
      color: 'purple',
      filters: {
        all: [
          { field: 'type', op: 'equals', value: 'Procedure' },
          { field: 'status', op: 'any_of', value: ['Active', 'Draft'] },
        ],
      },
      icon: null,
      listPropertiesDisplay: ['Status', 'belongs_to'],
      name: 'Active Procedures',
      sort: 'modified:desc',
    })
    const parsed = parseMobileSavedViewFile({ content, relativePath: 'views/active-procedures.yml' }, 0)

    expect(content).toContain('name: "Active Procedures"')
    expect(content).toContain('listPropertiesDisplay:')
    expect(content).toContain('filters:')
    expect(parsed?.definition).toMatchObject({
      color: 'purple',
      filters: {
        all: [
          { field: 'type', op: 'equals', value: 'Procedure' },
          { field: 'status', op: 'any_of', value: ['Active', 'Draft'] },
        ],
      },
      listPropertiesDisplay: ['Status', 'belongs_to'],
      name: 'Active Procedures',
      sort: 'modified:desc',
    })
  })

  it('creates desktop-style unique view filenames', () => {
    expect(createMobileSavedViewFilename('Active Procedures', ['active-procedures.yml'])).toBe('active-procedures-2.yml')
    expect(createMobileSavedViewFilename('CON', [])).toBe('con-view.yml')
  })

  it('assigns new saved views after the highest desktop order', () => {
    expect(nextMobileSavedViewOrder([
      viewFixture('alpha.yml', 'Alpha', 0),
      viewFixture('beta.yml', 'Beta', 4),
      viewFixture('gamma.yml', 'Gamma', null),
    ])).toBe(5)
    expect(nextMobileSavedViewOrder([
      viewFixture('alpha.yml', 'Alpha', null),
      viewFixture('beta.yml', 'Beta', null),
    ])).toBe(2)
  })

  it('orders saved views by desktop order and filename instead of display name', () => {
    expect(orderedMobileSavedViews([
      viewFixture('zeta.yml', 'Alpha', null),
      viewFixture('alpha.yml', 'Zeta', null),
      viewFixture('middle.yml', 'Middle', 20),
      viewFixture('first.yml', 'First', 10),
    ]).map((view) => view.filename)).toEqual([
      'first.yml',
      'middle.yml',
      'alpha.yml',
      'zeta.yml',
    ])
  })

  it('moves saved views and builds dense desktop order updates', () => {
    const views = [
      viewFixture('alpha.yml', 'Alpha', 0),
      viewFixture('beta.yml', 'Beta', 1),
      viewFixture('gamma.yml', 'Gamma', 2),
    ]
    const moved = moveMobileSavedView(views, 'view-gamma', 'up')

    expect(moved?.map((view) => view.filename)).toEqual(['alpha.yml', 'gamma.yml', 'beta.yml'])
    expect(mobileSavedViewOrderUpdates(moved ?? []).map(({ filename, definition }) => ({
      filename,
      order: definition.order,
    }))).toEqual([
      { filename: 'alpha.yml', order: 0 },
      { filename: 'gamma.yml', order: 1 },
      { filename: 'beta.yml', order: 2 },
    ])
    expect(moveMobileSavedView(views, 'alpha.yml', 'up')).toBeNull()
  })
})

function note(overrides: Partial<MobileNote>): MobileNote {
  return {
    created: '-',
    date: '-',
    favorite: false,
    id: 'note',
    links: 0,
    modified: '-',
    relationships: [],
    snippet: '',
    status: '',
    tags: [],
    title: 'Note',
    type: 'Note',
    typeTone: 'gray',
    workspace: 'TV',
    ...overrides,
  }
}

function relationship(key: string, values: Array<{ ref: string; title: string }>) {
  return {
    key,
    kind: 'custom' as const,
    values: values.map((value) => ({
      ...value,
      type: 'Note',
      typeTone: 'gray' as const,
    })),
  }
}

function viewFixture(filename: string, name: string, order: number | null): MobileSavedView {
  return {
    definition: {
      color: null,
      filters: { all: [] },
      icon: null,
      name,
      order,
      sort: null,
    },
    filename,
    id: `view-${filename.replace(/\.yml$/u, '')}`,
  }
}
