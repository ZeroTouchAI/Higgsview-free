import { sessionCookie, signSession, type User } from "@/lib/auth";

// Google Sign-In: the browser sends Google's ID token; Google's tokeninfo endpoint checks the signature and expiry.
export async function POST(req: Request) {
  const { credential } = await req.json();
  const t = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(String(credential ?? ""))}`).then((r) => r.json()).catch(() => ({}));
  if (!t.sub || t.aud !== process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || String(t.email_verified) !== "true")
    return Response.json({ error: "Google sign-in failed, try again" }, { status: 401 });
  const user: User = { sub: t.sub, email: t.email, name: t.name, picture: t.picture };
  const res = Response.json({ ok: true });
  res.headers.set("Set-Cookie", sessionCookie(signSession(user)));
  return res;
}
