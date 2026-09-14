import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Runs once a day via Vercel Cron (see vercel.json). Sweeps a batch of
// resources ordered by `last_checked_at nulls first`, so the full
// catalogue gets checked every ~1-2 weeks at ~50/day. Never auto-hides
// content — a "broken" result is a hint surfaced in the admin panel's
// "Needs attention" queue for a human to confirm or dismiss, since many
// sites block HEAD/bot requests and a false positive is common.

const BATCH_SIZE = 50;
const CONCURRENCY = 10;
const TIMEOUT_MS = 8000;

async function checkOne(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; link-check/1.0)" },
    });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; link-check/1.0)" },
      });
    }
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function runPool<T>(items: T[], worker: (item: T) => Promise<void>, concurrency: number) {
  let i = 0;
  async function next(): Promise<void> {
    while (i < items.length) {
      const item = items[i++];
      await worker(item);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, next));
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: resources, error } = await supabase
    .from("resources")
    .select("id, url")
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let ok = 0;
  let broken = 0;

  await runPool(
    resources ?? [],
    async (r) => {
      const isOk = await checkOne(r.url);
      if (isOk) ok++;
      else broken++;
      await supabase
        .from("resources")
        .update({ link_status: isOk ? "ok" : "broken", last_checked_at: new Date().toISOString() })
        .eq("id", r.id);
    },
    CONCURRENCY
  );

  return NextResponse.json({ checked: (resources ?? []).length, ok, broken });
}
