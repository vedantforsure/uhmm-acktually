---
name: uhmm-acktually
description: Log what we did this session to plain-text files in the repo (uhmm-acktually-logs/), and refresh the rolling project recap. On first use it self-installs an automatic per-turn Stop hook from GitHub so logging then runs hands-free. Invoke as /uhmm-acktually whenever you want to capture progress so a future session can get up to speed fast. Optional dev-only web viewer for Next.js apps lives in the repo.
---

# uhmm-acktually

Keep a lightweight, human-readable record of what we do, stored as plain text
**in the project itself** so any future session can get up to speed in seconds.

There are two layers:
- **this skill** (`/uhmm-acktually`) — writes a log entry and refreshes the recap on demand.
- **a Stop hook** — writes an entry automatically after every turn, hands-free. The
  skill installs it for you on first run (see Setup), so the user can just call the
  skill once and then forget about it.

## Setup: install the automatic hook (do this first, every invocation)

This is **idempotent and silent when already done** — if the hook is present, skip
it without comment and move on to the logging job below.

1. Check whether `.claude/hooks/uhmm-acktually.mjs` exists in the project root.
2. If it does **not** exist, install it:
   - Create the `.claude/hooks/` folder if missing, then download the hook's exact
     bytes (use `curl`, not a summarizing web fetch):

     ```
     curl -fsSL -o .claude/hooks/uhmm-acktually.mjs \
       https://raw.githubusercontent.com/vedantforsure/uhmm-acktually/main/.claude/hooks/uhmm-acktually.mjs
     ```

     On Windows without curl, use PowerShell:
     `Invoke-WebRequest -UseBasicParsing -Uri <same URL> -OutFile .claude/hooks/uhmm-acktually.mjs`
   - Register the Stop hook in `.claude/settings.json`. **Merge** into any existing
     file — never clobber other keys or hooks. Ensure this block is present:

     ```json
     {
       "hooks": {
         "Stop": [
           {
             "hooks": [
               {
                 "type": "command",
                 "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/uhmm-acktually.mjs\""
               }
             ]
           }
         ]
       }
     }
     ```
   - Tell the user in one line that the automatic logger is now installed and will
     run after every turn from here on.
3. If the download fails (no network, etc.), tell the user and point them to the
   manual steps at https://github.com/vedantforsure/uhmm-acktually — then still do
   the on-demand logging below so this invocation isn't wasted.

The optional dev-only web viewer (a floating button for Next.js App Router apps)
lives in the repo's `web/` folder. Only set it up if the user asks for it.

## Where things are written

```
uhmm-acktually-logs/
  SUMMARY.md                          # rolling recap — the "get up to speed" doc
  sessions/
    SESSION-YYYY-MM-DD-HHMM.md        # one file per work session, a running log
```

Everything is written as **plain, human-readable prose** — no Markdown headings,
no bullet points, no `#` or `-` or `*` symbols. It should read like a person
wrote a quick note to themselves. Files are committed to the repo. Never put
secrets, tokens, or credentials in them.

## What to do when this skill is invoked (the logging job)

1. **Find / create the current session file.**
   - If you have **already created a session file earlier in *this* conversation**,
     reuse that same file — keep appending to it.
   - Otherwise this is a new session: create
     `uhmm-acktually-logs/sessions/SESSION-<today's date>-<HHMM>.md` (24h clock,
     local time — today is in the environment context). Open it with a single plain
     line, e.g. `Session on 2026-06-21, started 14:00. Goal: <one short line>.`
   - Create the `uhmm-acktually-logs/` and `uhmm-acktually-logs/sessions/` folders if missing.
   - Note: the Stop hook may already be appending entries to this file automatically
     after each turn. That's fine — just keep adding to the same file.

2. **Append what happened since the last entry, as short prose paragraphs.** Write
   it the way a person would recount their afternoon — full sentences, newest at
   the bottom, each opening with the time. For example:

       At 14:32 I added the dev-only button to the site layout so the logs
       show up in dev mode.

       At 14:40 I wrote the API route that reads the log files, guarded so it never
       runs in production.

   Be concise — a glanceable account, not a transcript. Fold trivial steps into
   one sentence. Skip noise (file reads, exploratory searches) unless they
   mattered. No bullets, no headings.

3. **Refresh `uhmm-acktually-logs/SUMMARY.md`** so it stays a short, current briefing —
   a few plain paragraphs (aim for under ~150 words), no headings or bullets.
   Start with a line like `Last updated 2026-06-21 14:45.` then write where the
   project stands, what we've been focused on lately, and what's still open — all
   in normal sentences. This is the recap someone reads to get up to speed; the
   session files are the granular running logs. Together they answer "what's going
   on and what did we just do?"

4. Tell the user, in one line, what you logged and that the recap was refreshed.

## Notes

- Prefer updating the existing summary over piling on history — it should read
  like a fresh briefing, not a changelog.
- If the user invokes this at the *end* of a session, make sure the final
  entries and the summary reflect everything done.
- The website surfaces these files through a dev-only 44×44 button
  (`UhmmAcktually.tsx` → `/api/uhmm-acktually`). Keep the file layout above stable
  so that reader keeps working.
