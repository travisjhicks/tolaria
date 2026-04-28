# File Layout

A typical vault stays simple.

```txt
my-vault/
  project-alpha.md
  weekly-review.md
  people/
    ada-lovelace.md
  attachments/
    diagram.png
  type/
    project.md
    person.md
  views/
    active-projects.yml
```

## Root Notes

Tolaria can work with flat vaults and nested folders. Type is not inferred from folder location; it comes from frontmatter.

## Special Folders

| Folder | Purpose |
| --- | --- |
| `type/` | Type definition documents. |
| `views/` | Saved custom views. |
| `attachments/` | Images and other attached files. |

## Git Files

If the vault is a Git repository, `.git/` belongs to Git. Tolaria reads Git state but does not treat `.git/` as notes.

