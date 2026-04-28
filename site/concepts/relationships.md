# Relationships

Relationships make a vault feel like a graph instead of a pile of documents.

## Relationship Fields

Any frontmatter field containing wikilinks can become a relationship.

```yaml
belongs_to:
  - "[[product-work]]"
related_to:
  - "[[documentation]]"
blocked_by:
  - "[[release-process]]"
```

Tolaria does not need a hardcoded list of relationship names. It detects relationship fields dynamically.

## Body Links Versus Relationship Fields

Use body links when the relationship appears naturally in writing. Use frontmatter relationships when the connection is important enough to show in navigation, filters, or the Inspector.

## Backlinks

Tolaria can show incoming links and inverse relationships, making it easier to navigate from a note to the rest of its context.

