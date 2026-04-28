# Notes

A note is a Markdown file with optional YAML frontmatter. Tolaria reads the first H1 as the primary title and keeps the file on disk as the durable representation.

## Anatomy

```md
---
type: Project
status: Active
belongs_to:
  - "[[workspace]]"
---

# Launch Documentation

Draft the public Tolaria docs and keep them close to code changes.
```

## Titles

The first H1 is the main title. Older notes can still use a `title:` frontmatter fallback, but new notes should rely on the H1.

## Body Links

Use `[[wikilinks]]` to connect notes from the body. Tolaria can resolve links by filename, title, and aliases.

## Frontmatter

Use frontmatter for structured fields such as type, status, date, URL, and relationships. Keep free-form thinking in the body.

