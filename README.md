# uhmm-acktually

> *"uhmm acktually you've done nothing yet hehe"*

A tiny, self-contained session logger for [Claude Code](https://claude.com/claude-code). It keeps a plain-text, human-readable record of what you and Claude did each session — committed right inside your repo — so any future session can get up to speed in seconds.

It comes in two halves:

1. **The logger** (Claude Code skill + Stop hook) — fully plug-and-play in any project.
2. **An optional web viewer** (a dev-only floating button) — drop-in for Next.js App Router apps.

---

## What you get

```
uhmm-acktually-logs/
  SUMMARY.md                     rolling "get up to speed" recap
  sessions/
    SESSION-YYYY-MM-DD-HHMM.md   one running log per work session
```

Everything is written as plain prose — no headings, no bullets — so it reads like
notes a person jotted to themselves. Files are committed to the repo.

Two ways entries get written:

- **Automatically**, after every turn, by the `Stop` hook (`.claude/hooks/uhmm-acktually.mjs`).
- **On demand**, when you run the `/uhmm-acktually` skill, which also refreshes `SUMMARY.md`.

---

## Install — the logger (any project)

This half is genuinely copy-paste. From this repo, copy the `.claude/` folder into
your project root (merge it if you already have one):

```
.claude/
  settings.json                       registers the Stop hook
  hooks/uhmm-acktually.mjs            writes the log entries
  skills/uhmm-acktually/SKILL.md      the /uhmm-acktually skill
```

That's it. Requirements:

- **Node.js** on your PATH (the hook runs `node`). No npm install, zero dependencies.
- If you already have a `.claude/settings.json`, merge the `hooks.Stop` block from
  the one here instead of overwriting.

The hook resolves its log directory from `CLAUDE_PROJECT_DIR` (falling back to the
current working directory), so it works wherever it's dropped. Logs land in
`uhmm-acktually-logs/` at your project root.

> Note: `settings.json` is committed, so the hook runs for anyone who clones the
> project. If you'd rather keep it per-machine, move the `hooks` block into
> `.claude/settings.local.json` (which is gitignored by Claude Code).

---

## Install — the web viewer (Next.js App Router, optional)

A dev-only floating button that surfaces the recap and the current session log on
your live (dev) site. It 404s in production, so nothing ever ships.

It's portable — the only runtime dependency is `framer-motion`, and it uses stock
Tailwind classes — but it does assume Next.js App Router, so it needs three steps:

1. Copy the route handler:
   `web/api/uhmm-acktually/route.ts` → `src/app/api/uhmm-acktually/route.ts`

2. Copy the component:
   `web/components/UhmmAcktually.tsx` → `src/app/components/UhmmAcktually.tsx`

3. Render it dev-only in your root layout (`src/app/layout.tsx`):

   ```tsx
   import UhmmAcktually from "./components/UhmmAcktually";

   // ...inside <body>:
   {process.env.NODE_ENV === "development" && <UhmmAcktually />}
   ```

Requirements: `framer-motion` installed and Tailwind CSS available. The route reads
`uhmm-acktually-logs/` relative to `process.cwd()`.

---

## Is it "fully plug-and-play"?

- **The logger:** yes. Copy `.claude/`, have Node installed, done.
- **The web viewer:** drop-in *for Next.js App Router projects* — copy two files,
  add one line to your layout, and have `framer-motion` + Tailwind. Not framework-agnostic.

---

## File map of this repo

```
.claude/
  settings.json
  hooks/uhmm-acktually.mjs
  skills/uhmm-acktually/SKILL.md
web/
  api/uhmm-acktually/route.ts        # Next.js route handler (dev-only)
  components/UhmmAcktually.tsx        # the floating button
```

The `web/` paths are laid out for reference; move the files into your `src/app/`
tree as shown above.

---

## License

MIT
