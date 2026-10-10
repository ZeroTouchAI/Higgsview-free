import { getUpcoming } from "@/lib/upcoming";

// GET: tracker (re-scans Higgsfield if the last check is over a day old; ?force=1 to scan now).
export async function GET(req: Request) {
  return Response.json(await getUpcoming(new URL(req.url).searchParams.has("force")));
}

