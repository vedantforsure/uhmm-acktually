#!/usr/bin/env node
// Stop hook: runs automatically each time Claude finishes a turn. It reads the
// turn's transcript, pulls out the user's request and Claude's closing prose,
// strips Markdown, and appends a plain, human-readable paragraph to the current
// session file under uhmm-acktually-logs/. The dev-only button reads these.
//
// Wired up in .claude/settings.json under hooks.Stop.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const ROOT = join(process.env.CLAUDE_PROJECT_DIR || process.cwd(), "uhmm-acktually-logs");
const SESSIONS = join(ROOT, "sessions");
const STATE = join(ROOT, ".state.json");

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

// Turn Markdown into something that reads like normal writing: drop headings,
// bullets, blockquotes, code fences, emphasis markers and link/url syntax.
function deMarkdown(s) {
  return s
    .replace(/```[\s\S]*?```/g, " ")            // fenced code blocks
    .replace(/`([^`]+)`/g, "$1")                 // inline code
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")          // headings
    .replace(/^\s*>+\s?/gm, "")                   // blockquotes
    .replace(/^\s*[-*+]\s+/gm, "")               // bullets
    .replace(/^\s*\d+\.\s+/gm, "")               // numbered lists
    .replace(/\*\*([^*]+)\*\*/g, "$1")           // bold
    .replace(/\*([^*]+)\*/g, "$1")               // italics
    .replace(/__([^_]+)__/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")    // images -> alt text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")     // links -> text
    .replace(/[*_#>`]/g, "")                       // stray markers
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function firstSentences(text, max = 360) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return (lastStop > 80 ? cut.slice(0, lastStop + 1) : cut).trim() + (lastStop > 80 ? "" : "…");
}

// Pull the latest real user prompt and the assistant text that followed it.
function extractTurn(transcriptPath) {
  if (!transcriptPath || !existsSync(transcriptPath)) return null;
  const lines = readFileSync(transcriptPath, "utf8").split("\n").filter(Boolean);
  const msgs = [];
  for (const line of lines) {
    try { msgs.push(JSON.parse(line)); } catch { /* skip */ }
  }

  const textOf = (content) => {
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content.filter((p) => p.type === "text").map((p) => p.text).join("\n");
    }
    return "";
  };
  const isToolResult = (content) =>
    Array.isArray(content) && content.some((p) => p.type === "tool_result");

  // Index of the last genuine user prompt (not a tool result, not meta).
  let userIdx = -1;
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    if (m.type === "user" && m.message && !isToolResult(m.message.content) && !m.isMeta) {
      const t = textOf(m.message.content);
      if (t && t.trim()) { userIdx = i; break; }
    }
  }
  if (userIdx === -1) return null;

  const userText = textOf(msgs[userIdx].message.content);
  let assistantText = "";
  for (let i = userIdx + 1; i < msgs.length; i++) {
    if (msgs[i].type === "assistant" && msgs[i].message) {
      const t = textOf(msgs[i].message.content);
      if (t) assistantText += (assistantText ? "\n" : "") + t;
    }
  }
  return { userText: deMarkdown(userText), assistantText: deMarkdown(assistantText) };
}

function loadState() {
  try { return JSON.parse(readFileSync(STATE, "utf8")); } catch { return {}; }
}
function saveState(s) {
  try { writeFileSync(STATE, JSON.stringify(s, null, 2)); } catch { /* ignore */ }
}

function pad(n) { return String(n).padStart(2, "0"); }
function stamp(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function main() {
  let input = {};
  try { input = JSON.parse(readStdin() || "{}"); } catch { /* ignore */ }

  const turn = extractTurn(input.transcript_path);
  if (!turn || (!turn.userText && !turn.assistantText)) process.exit(0);

  if (!existsSync(SESSIONS)) mkdirSync(SESSIONS, { recursive: true });

  const state = loadState();
  const sid = input.session_id || "default";
  const now = new Date();
  let entry = state[sid];

  if (!entry) {
    const filename = `SESSION-${stamp(now)}.md`;
    const opener = `Session on ${now.toLocaleDateString()}, started ${pad(now.getHours())}:${pad(now.getMinutes())}.\n\n`;
    writeFileSync(join(SESSIONS, filename), opener);
    entry = { filename, lastSig: "" };
  }

  // Skip if this is the same turn we already logged (Stop can fire repeatedly).
  const sig = (turn.userText + "|" + turn.assistantText).slice(0, 200);
  if (sig === entry.lastSig) process.exit(0);

  const ask = turn.userText ? firstSentences(turn.userText, 160) : "";
  const did = turn.assistantText ? firstSentences(turn.assistantText, 360) : "";

  let paragraph = "";
  if (ask && did) paragraph = `At ${pad(now.getHours())}:${pad(now.getMinutes())} you asked to ${lower(ask)} ${did}`;
  else paragraph = `At ${pad(now.getHours())}:${pad(now.getMinutes())} ${did || ask}`;

  const file = join(SESSIONS, entry.filename);
  const prev = existsSync(file) ? readFileSync(file, "utf8") : "";
  writeFileSync(file, prev + paragraph.trim() + "\n\n");

  entry.lastSig = sig;
  state[sid] = entry;
  saveState(state);
  process.exit(0);
}

function lower(s) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

main();
