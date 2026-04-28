# Open Or Create A Vault

A Tolaria vault is a folder on disk. The folder can contain Markdown notes, attachments, type definitions, saved views, and Git metadata.

## Open An Existing Folder

Choose an existing folder if you already have Markdown notes. Tolaria scans `.md` files and uses frontmatter when it exists.

Good starting points:

- A folder of plain Markdown files.
- An Obsidian-style vault.
- A Git repository containing notes.
- A copy of the Getting Started vault.

## Create A New Vault

Choose a new empty folder if you want Tolaria conventions from the start. New notes are created as Markdown files, and optional type definitions live in the `type/` folder.

## Git Repository Requirement

Tolaria's history and sync features expect the vault to be a Git repository. If a vault is not already a repository, Tolaria can initialize one for you.

Use Git because it gives Tolaria reliable local history, diff views, recovery, and remote sync without a proprietary backend.

