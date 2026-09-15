import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getResume } from "@/lib/queries";
import { buildResumeDocx, resumeFilename, type ResumeLayout } from "@/lib/resume/docx";

// Generated server-side rather than in the browser so the docx library never
// reaches the client bundle. A server action can't stream a binary download,
// which is why this is a route handler.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const layout: ResumeLayout = request.nextUrl.searchParams.get("layout") === "ats" ? "ats" : "format";
  const supabase = await createClient();

  const resume = await getResume(supabase, id);
  // RLS scopes the read to the owner, so someone else's resume reads as
  // absent. Answering 404 rather than 403 matters: a 403 would confirm that a
  // resume with this id exists.
  if (!resume) return new Response("Not found", { status: 404 });

  const buffer = await buildResumeDocx(resume.doc, layout);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${resumeFilename(resume.doc.header.fullName, layout)}"`,
      // Resume contents must never sit in a shared or browser cache.
      "Cache-Control": "no-store, private",
    },
  });
}
