import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getResourceDetail } from "@/lib/queries";
import { ResourcePlayer } from "@/components/resource/resource-player";
import { AutoCompleteOnOpen } from "@/components/resource/auto-complete-on-open";
import { ICONS, FALLBACK_ICON } from "@/components/icons";
import { trackColor, trackInk } from "@/lib/track-colors";

// Formerly /library/resource/[id] — the library's own browsable index is
// gone (every resource is reachable from its topic instead), but this page,
// the actual place a resource gets watched/read and tracked, still needs
// somewhere to live. It moved here, under the course it belongs to, rather
// than being deleted with the rest of the library.
//
// The `track` route segment is cosmetic — same as the topic page's own
// `track` param, it exists for the "back to topic" link, not for the query.
// getResourceDetail resolves topic and track from the resource id alone, so
// a stale or hand-edited track segment in the URL can never point this page
// at the wrong resource; it only ever affects where "back" goes.
export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ track: string; id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const detail = await getResourceDetail(supabase, id);
  if (!detail) notFound();

  const { resource, topic, track, status, secondsWatched, lastPositionSeconds } = detail;
  const Icon = ICONS[resource.icon_key ?? "web"] ?? FALLBACK_ICON;
  const metaParts = [resource.source, resource.format, resource.length].filter(Boolean);
  const backHref = track ? `/track/${track.id}/topic/${topic.id}` : "/dashboard";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <AutoCompleteOnOpen resourceId={resource.id} alreadyDone={status === "done"} />
      <Link href={backHref} className="flex w-fit items-center gap-1 text-sm text-ink-2 hover:text-ink">
        <ChevronLeft size={16} /> Back to topic
      </Link>

      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-2 border-ink"
          style={{ backgroundColor: trackColor(track?.id), color: trackInk(track?.id) }}
        >
          <Icon size={22} />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-ink-3">
            {track?.label ? `${track.label} · ` : ""}
            {topic.title}
          </div>
          <h1 className="mt-0.5 font-display text-2xl font-bold text-ink">{resource.title}</h1>
          {metaParts.length > 0 && <div className="mt-1 text-sm text-ink-2">{metaParts.join(" · ")}</div>}
        </div>
      </div>

      {resource.note && <p className="text-sm leading-relaxed text-ink-2">{resource.note}</p>}

      <ResourcePlayer
        resourceId={resource.id}
        url={resource.url}
        embeddable={resource.embeddable}
        provider={resource.provider}
        externalId={resource.external_id}
        initialPositionSeconds={lastPositionSeconds}
        initialSecondsWatched={secondsWatched}
        done={status === "done"}
      />
    </div>
  );
}
