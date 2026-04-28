# Properties

Properties are frontmatter fields that Tolaria can display, filter, and edit.

## Common Properties

| Field | Purpose |
| --- | --- |
| `type` | Groups the note into a type such as Project, Person, or Topic. |
| `status` | Tracks lifecycle state such as Active, Done, or Blocked. |
| `url` | Stores a canonical external link. |
| `date` | Represents a single date. |
| `start_date`, `end_date` | Represents a date range. |
| `aliases` | Gives a note alternative names for wikilink resolution. |

## System Properties

Fields that start with `_` are system properties. They remain in plain text but are hidden from normal property editing.

Examples include `_icon`, `_color`, `_order`, and `_pinned_properties` on type documents.

## Property Editing

The Inspector is the safest place to edit structured properties. Use raw Markdown mode when you need direct control over YAML.

