import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Server actions can't be invoked from navigator.sendBeacon, so the
// unload/tab-hidden flush path goes through this route instead. Same RPC,
// same auth (the beacon carries the session cookie same-origin).
export async function POST(request: NextRequest) {
  let body: { resourceId?: unknown; position?: unknown; watched?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const { resourceId, position, watched } = body;
  if (typeof resourceId !== "string" || typeof position !== "number" || typeof watched !== "number") {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_resource_progress", {
    p_resource_id: resourceId,
    p_position: Math.max(0, Math.round(position)),
    p_watched: Math.max(0, Math.round(watched)),
    p_complete: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
