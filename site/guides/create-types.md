# Create Types

Create a type when several notes share the same role in your system.

## Steps

1. Create a note in the `type/` folder.
2. Set `type: Type` in frontmatter.
3. Give the document a clear H1.
4. Add optional icon, color, sort, and sidebar label.

```yaml
---
type: Type
icon: briefcase
color: blue
sidebar_label: Projects
sort: modified:desc
---

# Project
```

## Use Types Sparingly

A type should represent a recurring category, not a one-off label. If you only need a temporary grouping, use a saved view or property instead.

