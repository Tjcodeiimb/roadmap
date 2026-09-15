import { createClient } from "@/lib/supabase/server";
import { getLeaderboard } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const rows = await getLeaderboard(supabase);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Leaderboard</h1>
        <p className="mt-2 text-ink-2">Everyone on the team, ranked by XP. Names and XP only — nothing else is shared here.</p>
        <div className="rule-stripes mt-4 h-2 w-full border-2 border-ink" />
      </div>

      {rows.length === 0 ? (
        <Card className="text-center text-sm text-ink-2">No one has earned any XP yet.</Card>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row, i) => (
            <Reveal key={i} index={i}>
              <Card className={row.is_you ? "flex items-center gap-4 border-accent bg-accent-soft py-3.5" : "flex items-center gap-4 py-3.5"}>
                <div className="w-6 text-center font-display font-bold text-ink-3">{i + 1}</div>
                <div className="flex-1 font-bold text-ink">
                  {row.full_name ?? "Anonymous"}
                  {row.is_you && <span className="ml-2 text-xs font-bold text-accent">(you)</span>}
                </div>
                <div className="font-display font-bold text-ink">{row.total_xp} XP</div>
              </Card>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
