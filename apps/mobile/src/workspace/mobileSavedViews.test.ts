import { describe, expect, it } from 'vitest'
import { evaluateMobileSavedView, parseMobileSavedViewFile } from './mobileSavedViews'
import type { MobileNote } from './mobileWorkspaceModel'

describe('mobile saved views', () => {
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
