# Mobile UI Parity

Tolaria mobile UI work starts from fixture-driven parity with desktop semantics. The goal is not to copy desktop layout mechanically. The goal is to recreate the same information architecture, interaction affordances, and visual quality with native React Native surfaces before production logic is wired.

## Fast QA Loop

Routine mobile UI work on `mobile-ui-foundation` uses the scoped checks:

```bash
pnpm mobile:lint
pnpm mobile:typecheck
pnpm mobile:test
pnpm mobile:qa:screenshots
```

`pnpm mobile:qa:screenshots` exports the Expo web bundle, serves it locally, drives the UI lab with Playwright, and writes screenshots plus a manifest to:

```text
/tmp/tolaria-mobile-ui-screenshots
```

The default screenshot matrix is:

| Target | Viewport | Purpose |
| --- | --- | --- |
| Tablet landscape | 1366 x 1024 | First production target and primary quality bar |
| Tablet portrait | 1024 x 1366 | Tablet reflow and panel density |
| Phone portrait | 390 x 844 | Early visibility into phone reduction pressure |

The tablet state matrix currently captures:

| Scenario | Purpose |
| --- | --- |
| `default` | Baseline sidebar, note list, editor, properties, and sync footer |
| `selected-open-source-project` | Note selection state and properties refresh |
| `empty-inbox` | Empty list, no selected note, empty editor, empty properties, pull-required sync |
| `long-title` | Long title pressure across note rows, toolbar, and editor heading |
| `property-heavy` | Multi-tag note, grouped multi-value relationships, and property actions |
| `folder-tree` | Vault folder tree pressure in tablet landscape |

The phone navigation matrix currently captures:

| Scenario | Purpose |
| --- | --- |
| `initial` | Full-screen note list |
| `sidebar-open` | Left drawer over the note list, leaving a visible strip of list content on the right |
| `editor-open` | Note editor opened from the right with a back path to the list |
| `long-title-list` | Phone note list pressure with long titles |
| `property-heavy-editor` | Phone editor pressure with the property-heavy selected note |

Run the full desktop/native Tolaria gate only before promotion or when desktop/native production files are intentionally changed:

```bash
TOLARIA_MOBILE_FULL_GATE=1 git push
```

## Surface Parity Map

| Priority | Desktop Source | Mobile Target | Required Fixture States | Acceptance Bar |
| --- | --- | --- | --- | --- |
| P0 | Sidebar navigation | Native sidebar rail/list | all notes, inbox, archive, favorites, types, long counts | Touch targets stay stable; labels and counts do not overlap; active state is obvious |
| P0 | Note list | Native note list panel | selected note, favorite note, long title, multi-chip note, empty search | Dense enough for tablet work; rows remain readable; selected/favorite affordances are clear |
| P0 | Editor shell | Native editor container | title, breadcrumb, rich text preview, empty note | Reading area feels like Tolaria; title scale is appropriate; content width is controlled |
| P0 | Properties panel | Native property rows | type, date, status, relationships, empty values | Property labels align; chips match desktop semantics; actions are touch-safe |
| P1 | Search and quick open | Native search overlay/sheet | empty query, results, no results, keyboard focus | Results can be scanned quickly; mouse/touch selection is deterministic |
| P1 | Create note/type/status actions | Native modal/sheet controls | valid input, invalid input, type selection, collision | Controls use Tolaria primitives; disabled/loading/error states are visible |
| P2 | Phone shell | Reduced navigation and panels | list-only, editor-only, properties sheet, back stack | Phone removes surfaces deliberately after tablet parity is established |

## Mobile Primitive Layer

Mobile UI follows the same ownership model as desktop shadcn/ui. RNR-derived primitives live locally in `apps/mobile/src/components/ui`, and Tolaria-specific wrappers/compositions live in `apps/mobile/src/ui`.

Use the local primitive layer before adding new raw React Native controls. Product-specific surfaces can still use native `View`, `ScrollView`, and `Pressable` where they model Tolaria behavior, but text, buttons, badges/chips, and future shared controls should flow through the local RNR-backed components whenever practical.

## Per-Surface Workflow

1. Identify the desktop source component or workflow.
2. Add or update fixture data for the relevant states.
3. Compose the screen from `apps/mobile/src/components/ui` primitives and `apps/mobile/src/ui` Tolaria wrappers.
4. Run the fast QA loop and inspect screenshots.
5. Add interaction checks for taps, selection, scrolling, and state transitions.
6. Wire real data only after the fixture surface passes visual and interaction QA.

## Quality Rules

- Tablet landscape is the quality bar until the tablet shell is stable.
- Phone UI is allowed to lag, but screenshots must reveal where reduction is needed.
- Screens must avoid browser-default styling, text overlap, unstable dimensions, and decorative-only surfaces.
- Mobile-specific copy must go through the shared locale catalog when it becomes production UI copy.
- Business logic is not a substitute for visual completeness. A surface is not ready to wire until the fixture state is coherent.
