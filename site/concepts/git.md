# Git

Git is Tolaria's history and sync layer. It keeps the model local-first while still supporting remote backup and multi-device workflows.

## What Tolaria Uses Git For

- Local commit history.
- Diff views.
- Per-note history.
- Pull and push.
- Conflict detection and resolution.
- Remote connection for local-only vaults.

## Local Commits

You can commit changes inside Tolaria without leaving the app. This gives you useful restore points even before a remote is configured.

## Remotes

Connect a compatible Git remote when you want sync or backup. Tolaria relies on your system Git authentication, so GitHub CLI, SSH keys, credential helpers, and existing Git configuration can continue to work.

