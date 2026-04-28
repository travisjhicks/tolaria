# Types

Types describe what kind of thing a note represents: Project, Person, Topic, Procedure, Event, or any category you create.

## Type Field

The `type:` field assigns a note to a type.

```yaml
type: Project
```

Tolaria does not infer type from folder location. Moving a file into another folder does not change its type.

## Type Documents

Type documents live in the `type/` folder and describe how a type should appear.

```yaml
---
type: Type
icon: folder
color: blue
sidebar_label: Projects
sort: modified:desc
---

# Project
```

## What Types Control

- Sidebar grouping.
- Type icon and color.
- Default sort.
- Pinned properties.
- New-note templates.

