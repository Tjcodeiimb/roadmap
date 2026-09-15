"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackColor, trackInk } from "@/lib/track-colors";
import { overlayVariants, uiTransition } from "@/lib/motion";
import type { UnlockedSkill } from "@/lib/queries";

export function SkillPicker({
  open,
  onClose,
  skills,
  alreadyAdded,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  skills: UnlockedSkill[];
  alreadyAdded: Set<string>;
  onAdd: (skills: { id: string; name: string }[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const byDomain = useMemo(() => {
    const map = new Map<string, UnlockedSkill[]>();
    for (const skill of skills) {
      if (!map.has(skill.domain)) map.set(skill.domain, []);
      map.get(skill.domain)!.push(skill);
    }
    return [...map.entries()];
  }, [skills]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function confirm() {
    const picked = skills.filter((s) => selected.has(s.id)).map((s) => ({ id: s.id, name: s.name }));
    setSelected(new Set());
    onAdd(picked);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
          />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={uiTransition}
            role="dialog"
            aria-label="Add skills from UpForge"
            className="fixed left-1/2 top-1/2 z-50 flex max-h-[80vh] w-[min(560px,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-md border-2 border-ink bg-paper-2 shadow-[8px_8px_0_0_var(--brutal-shadow)]"
          >
            <div className="flex items-center justify-between border-b-2 border-ink px-5 py-3">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Add skills you&apos;ve unlocked</h2>
                <p className="text-xs text-ink-3">These are added as plain text — editing them later won&apos;t change your courses.</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="press-sm rounded-full border-2 border-ink bg-paper p-1.5 text-ink"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {byDomain.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-2">
                  No unlocked skills yet. Complete resources in a course to earn some.
                </p>
              ) : (
                byDomain.map(([domain, domainSkills]) => (
                  <section key={domain} className="mb-5 last:mb-0">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-sm border-2 border-ink"
                        style={{ backgroundColor: trackColor(domain) }}
                      />
                      <h3 className="font-display text-sm font-bold capitalize text-ink">{domain}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {domainSkills.map((skill) => {
                        const added = alreadyAdded.has(skill.id);
                        const isSelected = selected.has(skill.id);
                        return (
                          <button
                            key={skill.id}
                            disabled={added}
                            onClick={() => toggle(skill.id)}
                            className="press-sm rounded-sm border-2 border-ink px-2.5 py-1.5 text-xs font-bold disabled:opacity-40"
                            style={
                              isSelected
                                ? { backgroundColor: trackColor(domain), color: trackInk(domain) }
                                : undefined
                            }
                          >
                            {skill.name}
                            {added && " ✓"}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))
              )}
            </div>

            <div className="flex items-center justify-between border-t-2 border-ink px-5 py-3">
              <span className="text-xs font-bold text-ink-3">{selected.size} selected</span>
              <Button size="md" onClick={confirm} disabled={selected.size === 0}>
                Add {selected.size > 0 ? selected.size : ""} to resume
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
