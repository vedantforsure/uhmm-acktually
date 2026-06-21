# uhmm-acktually

> *"uhmm acktually you've done nothing yet hehe"*

A tiny session logger for [Claude Code](https://claude.com/claude-code). It keeps a plain-text, human-readable record of what you and Claude did each session — committed right inside your repo — so any future session can get up to speed in seconds.

> Just want the one-file install? It's a single self-installing markdown file at [vedantforsure/uhmm-acktually.md](https://github.com/vedantforsure/uhmm-acktually.md).

## Install (one file, then chill)

Drop the skill into your project, then run it once. The skill installs everything
else itself — it fetches the per-turn hook and wires up `settings.json` for you.

```bash
mkdir -p .claude/skills/uhmm-acktually
curl -fsSL -o .claude/skills/uhmm-acktually/SKILL.md \
  https://raw.githubusercontent.com/vedantforsure/uhmm-acktually/main/.claude/skills/uhmm-acktually/SKILL.md
```

Then in Claude Code:

```
/uhmm-acktually
```

On that first run it downloads `.claude/hooks/uhmm-acktually.mjs`, registers the
`Stop` hook, and logs the session. From then on logging is automatic after every
turn — you just keep working.

Only requirement: **Node.js** on your PATH (the hook runs `node`). No npm install, no dependencies.

## What you get

```
uhmm-acktually-logs/
  SUMMARY.md                     rolling "get up to speed" recap
  sessions/
    SESSION-YYYY-MM-DD-HHMM.md   one running log per work session
```

Everything is written as plain prose — no headings, no bullets — so it reads like
notes a person jotted to themselves. Entries get written two ways:

- **Automatically**, after every turn, by the `Stop` hook.
- **On demand**, when you run `/uhmm-acktually`, which also refreshes `SUMMARY.md`.

Next session, Claude reads these and is instantly caught up. No re-explaining the project.

## Optional: the web viewer (Next.js App Router)

A dev-only floating button that surfaces the recap and current session log on your
live (dev) site. It 404s in production, so nothing ever ships. Only runtime
dependency is `framer-motion`; it uses stock Tailwind classes.

1. Copy the route: `web/api/uhmm-acktually/route.ts` → `src/app/api/uhmm-acktually/route.ts`
2. Copy the component: `web/components/UhmmAcktually.tsx` → `src/app/components/UhmmAcktually.tsx`
3. Render it dev-only in `src/app/layout.tsx`:

   ```tsx
   import UhmmAcktually from "./components/UhmmAcktually";

   // ...inside <body>:
   {process.env.NODE_ENV === "development" && <UhmmAcktually />}
   ```

## Manual install (if you'd rather not let the skill do it)

Copy the whole `.claude/` folder from this repo into your project root (merge with
any existing `.claude/`). That gives you the skill, the hook, and the `settings.json`
hook registration directly.

> `settings.json` is committed, so the hook runs for anyone who clones the project.
> To keep it per-machine, move the `hooks` block into `.claude/settings.local.json`
> (gitignored by Claude Code).

## Repo layout

```
.claude/
  settings.json                       registers the Stop hook
  hooks/uhmm-acktually.mjs            writes the log entries
  skills/uhmm-acktually/SKILL.md      the /uhmm-acktually skill (self-installing)
web/
  api/uhmm-acktually/route.ts         Next.js route handler (dev-only)
  components/UhmmAcktually.tsx         the floating button
```

## License

MIT
