"use client";
import { kieUrl } from "@/lib/kieLinks";
import Link from "next/link";
import Badge from "@/components/Badge";
import AccountMenu from "@/components/AccountMenu";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { MODELS } from "@/lib/models";
import { useHistory, type Item } from "@/lib/history";

type Entry = [label: string, href: string, desc: string, badge?: string];
const models = (mode: string, path: string): Entry[] =>
  MODELS.filter((m) => m.mode === mode).map((m) => [m.name, `${path}?${mode === "create" || mode === "image" || mode === "audio" ? "" : `tab=${mode}&`}model=${m.id}`, m.desc, m.badge]);

// Mega menus, mirroring Higgsfield's Image / Video / Audio dropdowns.
const MENUS: Record<string, { features: Entry[]; models: Entry[] }> = {
  Image: {
    features: [
      ["Create Image", "/image", "Generate AI images", "TOP"],
      ["Ads Studio", "/apps/ads-studio", "Your website into a batch of finished image ads", "NEW"],
      ["Soul", "/apps/soul", "Fashion-grade photos with aesthetic presets", "NEW"],
      ["AI Influencer", "/apps/ai-influencer", "A consistent AI persona in any scene"],
      ["Clothes Changer", "/apps/clothes-changer", "Change any outfit on a photo"],
      ["Hairstyle Changer", "/apps/hairstyle-changer", "Try new cuts and colors"],
      ["Breakdown", "/apps/breakdown", "Identify items, brands and prices in a photo"],
      ["Cinematic Cameras", "/cinema", "Image generation with camera controls"],
      ["Edit Image", "/image?model=nano-banana-2", "Upload an image and describe the change"],
      ["Relight", "/apps/relight", "Adjust lighting and color temperature"],
      ["Image Upscale", "/apps/upscale-image", "Enhance image quality (Topaz)"],
      ["Expand Image", "/apps/expand-image", "Extend any image beyond its edges"],
      ["Face Swap", "/apps/face-swap", "Realistic face swaps"],
      ["Character Swap", "/apps/character-swap", "Swap the character in any image"],
      ["Headshot Generator", "/apps/headshot", "Studio-quality headshots"],
      ["Skin Enhancer", "/apps/skin-enhancer", "Natural skin retouching"],
      ["Outfit Swap", "/apps/outfit-swap", "Try on any outfit"],
      ["Angles", "/apps/angles", "Any camera angle of your image"],
      ["Background Remover", "/apps/remove-bg", "Clean cutouts"],
    ],
    models: models("image", "/image"),
  },
  Video: {
    features: [
      ["Create Video", "/video", "Generate AI videos", "TOP"],
      ["Cinema Studio", "/cinema", "Cinematic video with camera, lens and moves"],
      ["Genjutsu", "/video?tab=swap", "Transfer motion or swap objects from a reference video", "NEW"],
      ["Effects", "/effects", "Viral VFX presets"],
      ["Mixed Media", "/apps?cat=mixed", "Restyle any video: comic, noir, neon, sketch…", "NEW"],
      ["Script to Video", "/apps/script-to-video", "Script → scenes → one long video", "NEW"],
      ["URL to Video", "/apps/url-to-video", "Any web page into a narrated video"],
      ["Click to Ad", "/apps/click-to-ad", "Product link into a video ad"],
      ["Explainer", "/apps/explainer", "Narrated 2D explainer videos"],
      ["Join Clips", "/join", "Stitch clips into one video with a soundtrack"],
      ["Video Translator", "/apps/video-translator", "Translate and re-sync lips"],
      ["Voice Changer", "/apps/voice-changer", "New voice, same words, synced lips"],
      ["Background Changer", "/apps/video-bg-changer", "New video background, no green screen"],
      ["Remove Object", "/apps/remove-object-video", "Erase people, logos, wires"],
      ["Remove Text", "/apps/remove-text-video", "Erase subtitles and watermarks"],
      ["Virality Predictor", "/apps/virality-predictor", "Score your hook before you post"],
      ["Edit Video", "/video?tab=edit", "Change styles, objects and details"],
      ["Motion Control", "/video?tab=motion", "Transfer motion from a video to your image"],
      ["Recast", "/apps/recast", "Swap the character in any video"],
      ["Lipsync Studio", "/apps/lipsync", "Talking clips from a photo and audio"],
      ["Talking Avatar", "/apps/talking-avatar", "Script + voice + lip-sync"],
      ["UGC Factory", "/apps/ugc-ad", "UGC ads with a creator and your product"],
      ["Transitions", "/apps/transitions", "Seamless transitions between shots"],
      ["Video Upscale", "/apps/upscale-video", "Enhance video quality (Topaz)"],
    ],
    models: [...models("create", "/video"), ...models("swap", "/video"), ...models("motion", "/video"), ...models("edit", "/video")],
  },
  Audio: {
    features: [
      ["Text to Speech", "/audio?model=gemini-tts", "Natural voiceover from text", "CHEAP"],
      ["Music", "/audio?model=suno-music", "Songs and background music", "NEW"],
      ["Sound Effects", "/audio?model=suno-sfx", "Whooshes, ambience, SFX"],
      ["Talking Avatar", "/apps/talking-avatar", "Make a photo speak your script"],
      ["Lipsync Studio", "/apps/lipsync", "Sync a face to your own audio"],
    ],
    models: models("audio", "/audio"),
  },
};

const LINKS: [string, string, string?][] = [
  ["Effects", "/effects"],
  ["Cinema Studio", "/cinema"],
  ["Genjutsu", "/video?tab=swap", "New"],
  ["Apps", "/apps"],
  ["History", "/history"],
];

// Header icons (original, simple line shapes): a gem for Spending, a four-point star for Upcoming.
const Diamond = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden className="size-4"><path d="M7 4h10l4 5-9 11L3 9l4-5ZM3 9h18M9 9l3 11 3-11M7 4l2 5m8-5-2 5" /></svg>
);
const Sparkle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden className="size-4"><path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2L12 3Z" /></svg>
);
const pill = "relative flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium whitespace-nowrap";

export default function Nav() {
  return <Suspense><NavInner /></Suspense>;
}

const monthStart = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
const spentSince = (items: Item[], from: number) => items.filter((i) => i.createdAt >= from).reduce((s, i) => s + (i.usd ?? 0), 0);

function NavInner() {
  const path = usePathname();
  const sp = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState<string>();
  const [credits, setCredits] = useState<number | null>(); // Kie balance in credits (null = no key)
  const [fresh, setFresh] = useState(0); // new Higgsfield features waiting in Upcoming
  // History (shared cache, polled while jobs run): this month's spend for the Spending bubble, and a signature that
  // changes when a job starts or finishes, so the Kie balance reloads right then instead of on the next page change.
  const hist = useHistory(true);
  const month = spentSince(hist, monthStart());
  const jobs = `${hist.length}:${hist.filter((i) => i.state === "pending").length}`;
  // Opening Higgsview triggers the daily Higgsfield check (server re-scans if the last one is >24h old).
  useEffect(() => {
    fetch("/api/upcoming").then((r) => r.json()).then((d) => setFresh(Object.values(d.items ?? {}).filter((t) => (t as { status: string }).status === "new").length), () => {});
  }, []);
  useEffect(() => {
    const load = () => fetch("/api/credits").then((r) => r.json()).then((d) => setCredits(typeof d.credits === "number" ? d.credits : null), () => {});
    load();
    const again = setTimeout(load, 5000); // Kie can post the charge a few seconds after the job's status changes
    addEventListener("hv_key", load); // a Kie key was connected, changed or removed
    return () => { clearTimeout(again); removeEventListener("hv_key", load); };
  }, [path, jobs]);
  // Close the menu after navigating (URL change) or on Escape.
  const url = path + "?" + sp.toString();
  const [lastUrl, setLastUrl] = useState(url);
  if (url !== lastUrl) { setLastUrl(url); setOpen(undefined); }
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(undefined);
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, []);
  if (path === "/login" || path === "/privacy") return null; // public pages: no signed-in chrome

  const current = (href: string) => {
    const [p, q] = href.split("?");
    return p === path && (!q || sp.toString().includes(q));
  };
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/90 backdrop-blur">
      <div className="flex h-14 items-center gap-1 px-4">
        <Link href="/" className="mr-1 shrink-0" aria-label="Higgsview home" title="Higgsview">
          <span className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-fg text-lg font-black text-black">H</span><span className="text-lg font-black tracking-tight">Higgsview</span></span>
        </Link>
        <nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link href="/" className={`shrink-0 rounded-lg px-2 py-1.5 font-medium hover:text-fg ${path === "/" ? "text-lime" : "text-muted"}`}>Explore</Link>
          {Object.keys(MENUS).map((name) => (
            <button key={name} aria-expanded={open === name} onClick={() => setOpen(open === name ? undefined : name)}
              className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 font-medium hover:text-fg ${open === name || path === `/${name.toLowerCase()}` ? "text-lime" : "text-muted"}`}>
              {name} <span aria-hidden className={`text-[10px] transition-transform ${open === name ? "rotate-180" : ""}`}>▾</span>
            </button>
          ))}
          {LINKS.map(([label, href, tag]) => (
            <Link key={label} href={href}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 font-medium transition-colors hover:text-fg ${current(href) ? "text-lime" : "text-muted"}`}>
              {label}
              {tag && <span className="rounded-md bg-lime/15 px-1.5 text-[10px] font-bold text-lime">{tag}</span>}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">
          <Link href="/spend" className={`${pill} bg-white/5 hover:bg-white/10 ${path === "/spend" ? "text-lime" : "text-fg"}`}>
            <Diamond /> Spending
            {month != null && (
              <span className="absolute top-7 left-1/2 -translate-x-1/2 rounded-md px-1.5 py-0.5 text-[10px] leading-3 font-bold text-white uppercase [background-image:radial-gradient(39.71%_136.54%_at_51.64%_117.31%,#F920D1_0%,#ED1572_100%)]">
                ${month.toFixed(2)} this mo
              </span>
            )}
          </Link>
          <Link href="/upcoming" className={`${pill} hidden md:flex ${path === "/upcoming" ? "text-lime" : "text-muted hover:text-fg"}`}>
            <Sparkle /> Upcoming
            {fresh > 0 && <span className="rounded-full bg-lime px-1.5 text-[10px] font-black text-black">{fresh}</span>}
          </Link>
          <span aria-hidden className="mx-1 h-3 w-px bg-white/15" />
          <a href={kieUrl("/billing")} target="_blank" rel="noreferrer" title={credits ? `Kie.ai balance: ${Math.floor(credits).toLocaleString()} credits — click to top up` : "Kie.ai balance"}
            className={`${pill} bg-lime/[.08] font-semibold text-lime hover:bg-lime/15`}>
            <span className="size-2 rounded-full bg-lime" /> {credits === undefined ? "…" : credits === null ? "No key" : `$${(credits * 0.005).toFixed(2)}`}
          </a>
          <AccountMenu credits={credits ?? undefined}
            onSignOut={() => fetch("/api/logout", { method: "POST" }).then(() => { router.replace("/login"); router.refresh(); })} />
        </div>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 top-14 z-30 bg-black/50" onClick={() => setOpen(undefined)} />
          <div className="absolute inset-x-0 top-14 z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-line bg-[#111] p-4 shadow-2xl">
            <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
              {(["features", "models"] as const).map((col) => (
                <section key={col}>
                  <h3 className="mb-2 px-2 text-xs font-semibold tracking-wide text-muted uppercase">{col === "features" ? "Features" : "Models"}</h3>
                  <ul className="grid gap-0.5 sm:grid-cols-2">
                    {MENUS[open][col].map(([label, href, desc, badge]) => (
                      <li key={href + label}>
                        <Link href={href} className="flex flex-col rounded-xl px-2 py-2 hover:bg-chip">
                          <span className="flex items-center gap-1.5 text-sm font-semibold">
                            {label}
                            <Badge label={badge} />
                          </span>
                          <span className="line-clamp-1 text-xs text-muted">{desc}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
