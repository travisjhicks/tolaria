# Public Docs Plan

This document records the phase 1 information architecture for public Tolaria documentation. The public docs source lives in `site/`; the existing `docs/` directory remains contributor, architecture, and agent context.

## Audiences

| Audience | Needs | Primary location |
|---|---|---|
| New users | Install, first launch, understand the app layout, clone the starter vault | `site/start/` |
| Active users | Learn concrete workflows such as organizing, Git sync, custom views, and AI | `site/guides/` |
| Power users | Understand file layout, frontmatter, filters, shortcuts, and platform support | `site/reference/` |
| Contributors and agents | Architecture, abstractions, ADRs, development workflow | `docs/`, `AGENTS.md` |

## Hosting Shape

The GitHub Pages output should reserve the root for public docs and mount release assets underneath it:

```text
/                  public docs home
/releases/         release history
/download/         latest stable download redirect
/stable/latest.json
/alpha/latest.json
/latest.json       compatibility alias for alpha latest
/latest-canary.json compatibility alias for alpha latest
```

Every user-visible app change should answer:

```text
Public docs impact:
- updated: <pages>
- not needed because: <reason>
```
