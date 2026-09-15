"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ChevronLeft, ChevronRight, Download } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { ResumePreview } from "@/components/resume/resume-preview";
import { SkillPicker } from "@/components/resume/skill-picker";
import { saveResumeDoc } from "@/app/actions/resume";
import { SECTION_DEFS, BULLET_SOFT_LIMIT, sectionDef } from "@/lib/resume/sections";
import { newId, type ResumeDoc, type ResumeEntry } from "@/lib/resume/types";
import type { UnlockedSkill } from "@/lib/queries";
import { uiTransition } from "@/lib/motion";

type SaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_MS = 800;

export function ResumeEditor({
  resumeId,
  initialDoc,
  unlockedSkills,
}: {
  resumeId: string;
  initialDoc: ResumeDoc;
  unlockedSkills: UnlockedSkill[];
}) {
  const [doc, setDoc] = useState<ResumeDoc>(initialDoc);
  const [step, setStep] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [pickerOpen, setPickerOpen] = useState(false);

  // The debounce timer and the latest doc are refs so the flush-on-unmount
  // effect can see the newest value without re-subscribing on every keystroke.
  // `latest` is kept current by update(), which is the only writer.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(doc);
  const dirty = useRef(false);

  const flush = useCallback(async () => {
    if (!dirty.current) return;
    dirty.current = false;
    setSaveState("saving");
    const result = await saveResumeDoc(resumeId, latest.current);
    setSaveState(result && "error" in result ? "error" : "saved");
  }, [resumeId]);

  const update = useCallback(
    (next: ResumeDoc) => {
      setDoc(next);
      latest.current = next;
      dirty.current = true;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, AUTOSAVE_MS);
    },
    [flush]
  );

  // A pending debounce would otherwise be lost on navigation, silently
  // dropping the last thing typed.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      if (timer.current) clearTimeout(timer.current);
      flush();
    };
  }, [flush]);

  const def = SECTION_DEFS[step];
  const section = useMemo(
    () => doc.sections.find((s) => s.type === def?.type),
    [doc.sections, def?.type]
  );

  function setHeader(key: keyof ResumeDoc["header"], value: string) {
    update({ ...doc, header: { ...doc.header, [key]: value } });
  }

  function mutateSection(mutate: (entries: ResumeEntry[]) => ResumeEntry[]) {
    if (!def) return;
    update({
      ...doc,
      sections: doc.sections.map((s) => (s.type === def.type ? { ...s, entries: mutate(s.entries) } : s)),
    });
  }

  function addEntry() {
    mutateSection((entries) => [...entries, { id: newId(), fields: {}, bullets: [] }]);
  }

  function removeEntry(entryId: string) {
    mutateSection((entries) => entries.filter((e) => e.id !== entryId));
  }

  function setField(entryId: string, key: string, value: string) {
    mutateSection((entries) =>
      entries.map((e) => (e.id === entryId ? { ...e, fields: { ...e.fields, [key]: value } } : e))
    );
  }

  function setBullet(entryId: string, index: number, value: string) {
    mutateSection((entries) =>
      entries.map((e) => {
        if (e.id !== entryId) return e;
        const bullets = [...e.bullets];
        bullets[index] = value;
        return { ...e, bullets };
      })
    );
  }

  function addBullet(entryId: string) {
    mutateSection((entries) =>
      entries.map((e) => (e.id === entryId ? { ...e, bullets: [...e.bullets, ""] } : e))
    );
  }

  function removeBullet(entryId: string, index: number) {
    mutateSection((entries) =>
      entries.map((e) => (e.id === entryId ? { ...e, bullets: e.bullets.filter((_, i) => i !== index) } : e))
    );
  }

  function addSkills(skills: { id: string; name: string }[]) {
    const skillsDef = SECTION_DEFS.find((d) => d.layout === "skills");
    if (!skillsDef) return;
    update({
      ...doc,
      sections: doc.sections.map((s) =>
        s.type === skillsDef.type
          ? {
              ...s,
              entries: [
                ...s.entries,
                // The name is copied in as plain text on purpose: a resume is
                // a point-in-time document, so renaming or deleting a skill in
                // the catalogue later must not silently rewrite it. skillId is
                // kept only so the picker can tell what's already added.
                ...skills.map((skill) => ({
                  id: newId(),
                  fields: { name: skill.name, skillId: skill.id },
                  bullets: [],
                })),
              ],
            }
          : s
      ),
    });
  }

  const alreadyAddedSkillIds = useMemo(() => {
    const skillsDef = SECTION_DEFS.find((d) => d.layout === "skills");
    const skillsSection = doc.sections.find((s) => s.type === skillsDef?.type);
    return new Set((skillsSection?.entries ?? []).map((e) => e.fields.skillId).filter(Boolean));
  }, [doc.sections]);

  const newSkillCount = unlockedSkills.filter((s) => !alreadyAddedSkillIds.has(s.id)).length;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Editor column */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <SectionTabs step={step} onStep={setStep} doc={doc} />

        <div className="rounded-md border-2 border-ink bg-paper-2 p-5 shadow-[4px_4px_0_0_var(--brutal-shadow)]">
          {step === 0 && <HeaderFields doc={doc} onChange={setHeader} />}

          <AnimatePresence mode="wait">
            <motion.div
              key={def?.type ?? "header"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={uiTransition}
            >
              {def && (
                <>
                  <div className="mb-4 mt-6 border-t-2 border-ink pt-4">
                    <h2 className="font-display text-lg font-bold text-ink">{def.title}</h2>
                    <p className="mt-1 text-sm text-ink-2">{def.prompt}</p>
                  </div>

                  {def.layout === "skills" && (
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <Button size="sm" onClick={() => setPickerOpen(true)} disabled={unlockedSkills.length === 0}>
                        <Plus size={14} /> Add from UpForge
                      </Button>
                      <span className="text-xs text-ink-3">
                        {unlockedSkills.length === 0
                          ? "Unlock skills by completing resources to pull them in here."
                          : `${newSkillCount} unlocked skill${newSkillCount === 1 ? "" : "s"} not yet added`}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col gap-4">
                    {(section?.entries ?? []).map((entry, i) => (
                      <EntryCard
                        key={entry.id}
                        index={i}
                        entry={entry}
                        def={def}
                        onField={(key, value) => setField(entry.id, key, value)}
                        onBullet={(idx, value) => setBullet(entry.id, idx, value)}
                        onAddBullet={() => addBullet(entry.id)}
                        onRemoveBullet={(idx) => removeBullet(entry.id, idx)}
                        onRemove={() => removeEntry(entry.id)}
                      />
                    ))}
                  </div>

                  <button
                    onClick={addEntry}
                    className="press-sm mt-4 flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-ink bg-paper py-3 text-sm font-bold text-ink-2 hover:text-ink"
                  >
                    <Plus size={15} /> Add {def.entryNoun}
                  </button>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-between gap-3 border-t-2 border-ink pt-4">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="press-sm flex items-center gap-1 rounded-md border-2 border-ink bg-paper px-3 py-2 text-sm font-bold text-ink disabled:opacity-40"
            >
              <ChevronLeft size={15} /> Back
            </button>
            <SaveIndicator state={saveState} />
            <button
              onClick={() => setStep((s) => Math.min(SECTION_DEFS.length - 1, s + 1))}
              disabled={step === SECTION_DEFS.length - 1}
              className="press-sm flex items-center gap-1 rounded-md border-2 border-ink bg-paper px-3 py-2 text-sm font-bold text-ink disabled:opacity-40"
            >
              {def?.optional ? "Skip" : "Next"} <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Preview column */}
      <div className="flex w-full flex-col gap-3 lg:sticky lg:top-6 lg:w-[46%]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wide text-ink-3">Live preview</span>
          <a
            href={`/api/resume/${resumeId}/export`}
            className="press-sm flex items-center gap-1.5 rounded-md border-2 border-ink bg-accent px-3 py-1.5 text-xs font-bold text-accent-ink shadow-[3px_3px_0_0_var(--brutal-shadow)]"
          >
            <Download size={13} /> Word
          </a>
        </div>
        <div className="max-h-[78vh] overflow-y-auto rounded-md border-2 border-ink bg-paper-3 p-3">
          <ResumePreview doc={doc} />
        </div>
      </div>

      <SkillPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        skills={unlockedSkills}
        alreadyAdded={alreadyAddedSkillIds}
        onAdd={(skills) => {
          addSkills(skills);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const label =
    state === "saving" ? "Saving…" : state === "saved" ? "Saved" : state === "error" ? "Save failed" : "";
  if (!label) return <span />;
  return (
    <span className={clsx("text-xs font-bold", state === "error" ? "text-danger" : "text-ink-3")}>{label}</span>
  );
}

function SectionTabs({ step, onStep, doc }: { step: number; onStep: (n: number) => void; doc: ResumeDoc }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SECTION_DEFS.map((def, i) => {
        const filled = (doc.sections.find((s) => s.type === def.type)?.entries.length ?? 0) > 0;
        return (
          <button
            key={def.type}
            onClick={() => onStep(i)}
            className={clsx(
              "press-sm rounded-sm border-2 border-ink px-2.5 py-1.5 text-[11px] font-bold",
              i === step ? "bg-ink text-paper" : filled ? "bg-accent-soft text-accent" : "bg-paper-2 text-ink-3"
            )}
          >
            {def.title.split(" ")[0]}
          </button>
        );
      })}
    </div>
  );
}

function HeaderFields({
  doc,
  onChange,
}: {
  doc: ResumeDoc;
  onChange: (key: keyof ResumeDoc["header"], value: string) => void;
}) {
  return (
    <div>
      <h2 className="font-display text-lg font-bold text-ink">Your details</h2>
      <p className="mt-1 text-sm text-ink-2">
        Only name and email are needed. Everything else is optional — leave out anything you&apos;d rather not share.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Full name" value={doc.header.fullName} onChange={(v) => onChange("fullName", v)} />
        <Field label="Email" value={doc.header.email} onChange={(v) => onChange("email", v)} />
        <Field label="Phone" value={doc.header.phone} onChange={(v) => onChange("phone", v)} optional />
        <Field label="LinkedIn" value={doc.header.linkedin} onChange={(v) => onChange("linkedin", v)} optional />
      </div>

      {/* Age and gender appear on some circulated templates but current
          guidance is to leave them off, so they're collapsed rather than sat
          in the form inviting completion. */}
      <details className="mt-4 rounded-md border-2 border-ink bg-paper p-3" open={Boolean(doc.header.age || doc.header.gender)}>
        <summary className="cursor-pointer text-xs font-bold text-ink-2">Add age or gender</summary>
        <p className="mt-2 text-xs text-ink-3">
          Older CV templates include these, but most current guidance says to leave them out. Only add them if your
          placement cell asks for them.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Gender" value={doc.header.gender} onChange={(v) => onChange("gender", v)} optional />
          <Field label="Age" value={doc.header.age} onChange={(v) => onChange("age", v)} optional />
        </div>
      </details>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  optional,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  optional?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-bold text-ink-2">
        {label}
        {optional && <span className="ml-1 font-medium text-ink-3">optional</span>}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-md border-2 border-ink bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </label>
  );
}

function EntryCard({
  index,
  entry,
  def,
  onField,
  onBullet,
  onAddBullet,
  onRemoveBullet,
  onRemove,
}: {
  index: number;
  entry: ResumeEntry;
  def: NonNullable<ReturnType<typeof sectionDef>>;
  onField: (key: string, value: string) => void;
  onBullet: (index: number, value: string) => void;
  onAddBullet: () => void;
  onRemoveBullet: (index: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-md border-2 border-ink bg-paper p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-ink-3">
          {def.entryNoun} {index + 1}
        </span>
        <button
          onClick={onRemove}
          aria-label={`Remove ${def.entryNoun} ${index + 1}`}
          className="press-sm rounded-sm border-2 border-ink bg-paper-2 p-1.5 text-ink-2 hover:text-danger"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {def.fields
          .filter((field) => field.key !== "skillId")
          .map((field) => (
            <div key={field.key} className={field.width === "half" ? "" : "sm:col-span-2"}>
              <Field
                label={field.label}
                value={entry.fields[field.key] ?? ""}
                placeholder={field.placeholder}
                onChange={(value) => onField(field.key, value)}
              />
            </div>
          ))}
      </div>

      {def.hasBullets && (
        <div className="mt-4 flex flex-col gap-2">
          {entry.bullets.map((bullet, i) => {
            const over = bullet.length > BULLET_SOFT_LIMIT;
            return (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1">
                  <textarea
                    value={bullet}
                    onChange={(e) => onBullet(i, e.target.value)}
                    rows={2}
                    className="w-full resize-y rounded-md border-2 border-ink bg-paper-2 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <div className={clsx("mt-0.5 text-[11px] font-bold", over ? "text-danger" : "text-ink-3")}>
                    {bullet.length}/{BULLET_SOFT_LIMIT}
                    {over && " — will wrap onto a second line"}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveBullet(i)}
                  aria-label={`Remove bullet ${i + 1}`}
                  className="press-sm mt-1 rounded-sm border-2 border-ink bg-paper-2 p-1.5 text-ink-2 hover:text-danger"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
          {entry.bullets.length < def.maxBullets && (
            <button
              onClick={onAddBullet}
              className="press-sm self-start rounded-sm border-2 border-dashed border-ink px-3 py-1.5 text-xs font-bold text-ink-2 hover:text-ink"
            >
              <Plus size={12} className="inline" /> Add bullet
            </button>
          )}
        </div>
      )}
    </div>
  );
}
