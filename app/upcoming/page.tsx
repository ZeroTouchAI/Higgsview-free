"use client";
import { useEffect, useState } from "react";
import type { Status, Tracked, Upcoming } from "@/lib/upcoming";

// Read-only: the tracker decides each item's list (lib/upcoming.ts); nobody edits it from the page.
const SECTIONS: [Status[], string, string, string][] = [
  [["new", "todo"], "Coming soon", "New on Higgsfield, on its way to Higgsview.", "Coming soon"],
  [["built"], "In Higgsview", "Already available here.", "✓ Available"],
  [["ignored"], "Not planned", "Marketing pages, guides, and things that can't run on Kie.ai.", ""],
];

export default function UpcomingPage() {
  const [data, setData] = useState<Upcoming>();
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const fetchIt = (force = false) => fetch(`/api/upcoming${force ? "?force=1" : ""}`).then((r) => r.json()).then(setData);
  const load = (force = false) => { setBusy(true); fetchIt(force).finally(() => setBusy(false)); };
  useEffect(() => { fetchIt(); }, []);

  const entries = Object.entries(data?.items ?? {}).filter(([, t]) => t.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black uppercase">Upcoming</h1>
          <p className="text-sm text-muted">
            Higgsview checks Higgsfield&apos;s site once a day when you open it.
            {data?.checkedAt ? ` Last check: ${new Date(data.checkedAt).toLocaleString()}.` : ""}
          </p>
          {data?.error && <p className="text-sm text-red-300">{data.error}</p>}
        </div>
        <div className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" aria-label="Search" className="rounded-lg bg-chip px-3 py-1.5 text-sm outline-none" />
          <button onClick={() => load(true)} disabled={busy} className="rounded-lg bg-lime px-3 py-1.5 text-sm font-bold text-black disabled:opacity-50">{busy ? "Checking…" : "Check now"}</button>
        </div>
      </header>
      {SECTIONS.map(([statuses, title, blurb, tag]) => {
        const soon = statuses.includes("new");
        const rows = entries.filter(([, t]) => statuses.includes(t.status)).sort((a, b) => b[1].firstSeen - a[1].firstSeen || a[1].kind.localeCompare(b[1].kind));
        return (
          <details key={title} open={soon} className="rounded-2xl bg-panel p-4">
            <summary className="cursor-pointer list-none">
              <span className="text-lg font-black uppercase">{title}</span>
              <span className={`ml-2 rounded-md px-1.5 text-xs font-bold ${soon && rows.length ? "bg-lime text-black" : "bg-chip text-muted"}`}>{rows.length}</span>
              <span className="ml-3 text-xs text-muted">{blurb}</span>
            </summary>
            <ul className="mt-3 grid gap-1">
              {rows.map(([path, t]: [string, Tracked]) => (
                <li key={path} className="flex flex-wrap items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-chip">
                  <span className="w-16 shrink-0 text-[11px] font-semibold text-muted uppercase">{t.kind}</span>
                  <a href={t.url} target="_blank" rel="noreferrer" className="font-semibold hover:text-lime">{t.name} ↗</a>
                  {soon && <span className="text-xs text-muted">seen {new Date(t.firstSeen).toLocaleDateString()}</span>}
                  {t.note && <span className="text-xs text-muted">— {t.note}</span>}
                  {tag && <span className={`ml-auto rounded-md px-2 py-0.5 text-[11px] font-bold ${soon ? "bg-lime/15 text-lime" : "bg-chip text-muted"}`}>{tag}</span>}
                </li>
              ))}
              {!rows.length && <li className="text-sm text-muted">Nothing here.</li>}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
