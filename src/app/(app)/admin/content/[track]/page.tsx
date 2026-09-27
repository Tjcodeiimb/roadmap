import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdminPage } from "@/lib/admin-guard";
import { getTrackContentTree } from "@/lib/queries";
import { ContentEditor } from "@/components/admin/content-editor";
import { TrackNameEditor } from "@/components/admin/track-name-editor";

export default async function AdminContentPage({
  params,
}: {
  params: Promise<{ track: string }>;
}) {
  const { track: trackId } = await params;
  const supabase = await requireAdminPage();
  const { track, phases } = await getTrackContentTree(supabase, trackId);
  if (!track) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/admin" className="flex w-fit items-center gap-1 text-sm text-ink-2 hover:text-ink">
        <ChevronLeft size={16} /> Back to admin
      </Link>
      <div>
        <TrackNameEditor trackId={track.id} initialLabel={track.label} />
        <p className="mt-2 text-ink-2">Edit the course name, phases, topics and resources. Changes are live immediately — no redeploy.</p>
      </div>
      <ContentEditor trackId={track.id} initialPhases={phases} />
    </div>
  );
}
