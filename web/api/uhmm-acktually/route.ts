import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

// Reads the plain-text session logs maintained by the `/uhmm-acktually` skill
// and hands them to the dev-only button (UhmmAcktually.tsx). Dev only — this
// route 404s in production so logs never ship on the live site.

const ROOT = join(process.cwd(), "uhmm-acktually-logs");

function read(path: string): string {
  try {
    return existsSync(path) ? readFileSync(path, "utf8") : "";
  } catch {
    return "";
  }
}

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not found", { status: 404 });
  }

  const summary = read(join(ROOT, "SUMMARY.md"));

  const sessionsDir = join(ROOT, "sessions");
  let files: string[] = [];
  try {
    files = existsSync(sessionsDir)
      ? readdirSync(sessionsDir)
          .filter((f) => f.endsWith(".md"))
          .sort()
          .reverse() // newest first (filenames are timestamped)
      : [];
  } catch {
    files = [];
  }

  const toEntry = (name: string | undefined) =>
    name ? { name, content: read(join(sessionsDir, name)) } : null;

  return NextResponse.json({
    summary,
    current: toEntry(files[0]),
    previous: toEntry(files[1]),
  });
}
