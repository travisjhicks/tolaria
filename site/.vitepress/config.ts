import { defineConfig } from "vitepress";

const base = process.env.VITEPRESS_BASE ?? "/";

export default defineConfig({
  title: "Tolaria",
  description:
    "Tolaria is a local-first Markdown knowledge base with native relationships, Git history, and AI workflows.",
  base,
  cleanUrls: true,
  head: [
    ["link", { rel: "icon", type: "image/png", href: `${base}landing/favicon.png` }],
    ["meta", { property: "og:title", content: "Tolaria" }],
    [
      "meta",
      {
        property: "og:description",
        content:
          "A second brain for the AI era. Free forever, local-first, Markdown-based, Git-ready, and AI-friendly.",
      },
    ],
  ],
  themeConfig: {
    logo: { src: "/landing/tolaria-icon.png", alt: "Tolaria" },
    nav: [
      { text: "Features", link: "/#features" },
      { text: "Start", link: "/start/install" },
      { text: "Concepts", link: "/concepts/vaults" },
      { text: "Guides", link: "/guides/capture-a-note" },
      { text: "Reference", link: "/reference/supported-platforms" },
      { text: "Releases", link: "/releases/" },
    ],
    search: {
      provider: "local",
    },
    socialLinks: [{ icon: "github", link: "https://github.com/refactoringhq/tolaria" }],
    sidebar: [
      {
        text: "Start Here",
        items: [
          { text: "Install Tolaria", link: "/start/install" },
          { text: "First Launch", link: "/start/first-launch" },
          { text: "Getting Started Vault", link: "/start/getting-started-vault" },
          { text: "Open Or Create A Vault", link: "/start/open-or-create-vault" },
        ],
      },
      {
        text: "Concepts",
        items: [
          { text: "Vaults", link: "/concepts/vaults" },
          { text: "Notes", link: "/concepts/notes" },
          { text: "Properties", link: "/concepts/properties" },
          { text: "Types", link: "/concepts/types" },
          { text: "Relationships", link: "/concepts/relationships" },
          { text: "Inbox", link: "/concepts/inbox" },
          { text: "Git", link: "/concepts/git" },
          { text: "AI", link: "/concepts/ai" },
        ],
      },
      {
        text: "Guides",
        items: [
          { text: "Capture A Note", link: "/guides/capture-a-note" },
          { text: "Organize The Inbox", link: "/guides/organize-inbox" },
          { text: "Use Wikilinks", link: "/guides/use-wikilinks" },
          { text: "Create Types", link: "/guides/create-types" },
          { text: "Build Custom Views", link: "/guides/build-custom-views" },
          { text: "Connect A Git Remote", link: "/guides/connect-a-git-remote" },
          { text: "Commit And Push", link: "/guides/commit-and-push" },
          { text: "Use The AI Panel", link: "/guides/use-ai-panel" },
          { text: "Use The Command Palette", link: "/guides/use-command-palette" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "Supported Platforms", link: "/reference/supported-platforms" },
          { text: "File Layout", link: "/reference/file-layout" },
          { text: "Frontmatter Fields", link: "/reference/frontmatter-fields" },
          { text: "View Filters", link: "/reference/view-filters" },
          { text: "Keyboard Shortcuts", link: "/reference/keyboard-shortcuts" },
          { text: "Docs Maintenance", link: "/reference/docs-maintenance" },
        ],
      },
      {
        text: "Troubleshooting",
        items: [
          { text: "Vault Not Loading", link: "/troubleshooting/vault-not-loading" },
          { text: "Git Authentication", link: "/troubleshooting/git-auth" },
          { text: "AI Agent Not Found", link: "/troubleshooting/ai-agent-not-found" },
          { text: "Sync Conflicts", link: "/troubleshooting/sync-conflicts" },
        ],
      },
    ],
    footer: {
      message: "Free and open source. Local-first, Git-first, and Markdown-based.",
      copyright:
        "Tolaria is AGPL-3.0-or-later. The Tolaria name and logo remain covered by the project trademark policy.",
    },
  },
});
