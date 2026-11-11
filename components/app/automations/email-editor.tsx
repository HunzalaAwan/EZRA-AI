"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { Reorder, useDragControls } from "motion/react";
import {
  AddressBookIcon,
  ArrowClockwiseIcon,
  ArrowCounterClockwiseIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  ArrowsVerticalIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  CheckIcon,
  CopyIcon,
  CursorClickIcon,
  DesktopIcon,
  DeviceMobileIcon,
  DotsSixVerticalIcon,
  EyeSlashIcon,
  HighlighterIcon,
  ImageIcon,
  MinusIcon,
  PaperPlaneTiltIcon,
  ShareNetworkIcon,
  SignatureIcon,
  StarIcon,
  TextAlignLeftIcon,
  TextHIcon,
  TrashIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
  type Icon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlay";
import type { EmailBlock, EmailBlockKind, EmailPurpose, EmailStyle, EmailTemplate } from "@/lib/api/types";
import { BLOCK, BLOCK_GROUPS, IMAGE_MAX_MB, PURPOSE, blockSummary, newBlock, templateChecks, templateProblem } from "@/lib/email";
import { HEX, PALETTES, contrast, inkOn } from "@/lib/widget";
import { cn } from "@/lib/utils";
import { BlockFields, Segment } from "./email-blocks";
import { EmailRender, InboxHeader } from "./email-render";
import { SaveBar, VarChips, useInsert } from "./shared";

/**
 * The email template editor.
 *
 * An email is built from blocks, each with only the fields it needs. The
 * preview is the email itself, in the business's colours, and clicking any
 * part of it opens that block for editing, so nobody has to map a list of
 * fields onto a picture in their head. Every change can be undone.
 */

const BLOCK_ICON: Record<EmailBlockKind, Icon> = {
  heading: TextHIcon,
  text: TextAlignLeftIcon,
  callout: HighlighterIcon,
  image: ImageIcon,
  button: CursorClickIcon,
  booking: CalendarBlankIcon,
  stars: StarIcon,
  contact: AddressBookIcon,
  social: ShareNetworkIcon,
  divider: MinusIcon,
  spacer: ArrowsVerticalIcon,
  signoff: SignatureIcon,
};

type Tab = "content" | "design" | "settings";

/* -------------------------------------------------------------- history */

/**
 * Undo and redo. Typing in one field within a second counts as one change,
 * so undo steps back a word or a sentence, not a letter.
 */
function useHistory<T>(initial: T) {
  const [h, setH] = React.useState({ past: [] as T[], present: initial, future: [] as T[] });
  const last = React.useRef<{ key?: string; at: number }>({ at: 0 });

  const set = React.useCallback((update: (x: T) => T, key?: string) => {
    const now = Date.now();
    const coalesce = !!key && last.current.key === key && now - last.current.at < 1000;
    last.current = { key, at: now };
    setH((s) => {
      const next = update(s.present);
      if (Object.is(next, s.present)) return s;
      return { past: coalesce ? s.past : [...s.past.slice(-100), s.present], present: next, future: [] };
    });
  }, []);
  const undo = React.useCallback(() => {
    last.current = { at: 0 };
    setH((s) => (s.past.length ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1]!, future: [s.present, ...s.future] } : s));
  }, []);
  const redo = React.useCallback(() => {
    last.current = { at: 0 };
    setH((s) => (s.future.length ? { past: [...s.past, s.present], present: s.future[0]!, future: s.future.slice(1) } : s));
  }, []);
  return { value: h.present, set, undo, redo, canUndo: h.past.length > 0, canRedo: h.future.length > 0 };
}

function isTyping(el: Element | null) {
  return !!el && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || (el as HTMLElement).isContentEditable);
}

/* --------------------------------------------------------------- editor */

export function EmailEditor({
  initial,
  isNew,
  businessName,
  usedBy,
}: {
  initial: EmailTemplate;
  isNew: boolean;
  businessName: string;
  usedBy: string | null;
}) {
  const [saved, setSaved] = React.useState(isNew ? null : initial);
  const history = useHistory(initial);
  const t = history.value;
  const setT = history.set;
  const [tab, setTab] = React.useState<Tab>("content");
  const [selected, setSelected] = React.useState<string | null>(initial.blocks[0]?.id ?? null);
  const [width, setWidth] = React.useState<"desktop" | "mobile">("desktop");
  const [imagesOff, setImagesOff] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const listRef = React.useRef<HTMLOListElement>(null);
  const dirty = saved === null || JSON.stringify(t) !== JSON.stringify(saved);
  const checks = templateChecks(t);
  const toFix = checks.filter((c) => !c.ok).length;
  const { undo, redo } = history;

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || isTyping(document.activeElement)) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const setBlock = (id: string, patch: Partial<EmailBlock>, key?: string) =>
    setT((x) => ({ ...x, blocks: x.blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as EmailBlock) : b)) }), key);
  const setStyle = (patch: Partial<EmailStyle>, key?: string) => setT((x) => ({ ...x, style: { ...x.style, ...patch } }), key);

  function move(id: string, by: -1 | 1) {
    setT((x) => {
      const i = x.blocks.findIndex((b) => b.id === id);
      const j = i + by;
      if (i < 0 || j < 0 || j >= x.blocks.length) return x;
      const blocks = [...x.blocks];
      [blocks[i], blocks[j]] = [blocks[j]!, blocks[i]!];
      return { ...x, blocks };
    });
  }

  function add(kind: EmailBlockKind) {
    const b = newBlock(kind);
    setT((x) => {
      const i = selected ? x.blocks.findIndex((y) => y.id === selected) : -1;
      const blocks = [...x.blocks];
      blocks.splice(i < 0 ? blocks.length : i + 1, 0, b);
      return { ...x, blocks };
    });
    setSelected(b.id);
    scrollToRow(b.id);
  }

  function duplicate(id: string) {
    const src = t.blocks.find((b) => b.id === id);
    if (!src) return;
    const copy = { ...src, id: newBlock(src.kind).id } as EmailBlock;
    setT((x) => {
      const i = x.blocks.findIndex((b) => b.id === id);
      const blocks = [...x.blocks];
      blocks.splice(i + 1, 0, copy);
      return { ...x, blocks };
    });
    setSelected(copy.id);
  }

  function remove(id: string) {
    const b = t.blocks.find((x) => x.id === id);
    setT((x) => ({ ...x, blocks: x.blocks.filter((y) => y.id !== id) }));
    setSelected(null);
    if (b) toast(`${BLOCK[b.kind].label} removed.`, { action: { label: "Undo", onClick: undo } });
  }

  function scrollToRow(id: string) {
    requestAnimationFrame(() => listRef.current?.querySelector(`[data-row="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }

  function selectFromPreview(id: string) {
    setTab("content");
    setSelected(id);
    scrollToRow(id);
  }

  function save() {
    if (!t.name.trim()) {
      setTab("settings");
      return toast.error("Give the template a name, so you can find it later.");
    }
    const problem = templateProblem(t);
    if (problem) return toast.error(problem);
    setSaving(true);
    window.setTimeout(() => {
      setSaved(t);
      setSaving(false);
      toast.success(isNew && saved === null ? "Template created. Pick it in follow-ups, review requests, or General." : "Template saved.");
    }, 500);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link href={"/automations/emails" as Route} className="inline-flex items-center gap-1.5 rounded-md text-sm text-ink-muted transition-colors hover:text-ink">
          <ArrowLeftIcon aria-hidden className="size-4" />
          Email templates
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-ink [overflow-wrap:anywhere]">{t.name.trim() || "Untitled email"}</h2>
            <p className="mt-1.5 text-base text-ink-muted">
              {PURPOSE[t.purpose].label}
              {usedBy ? <> &middot; Sent as {usedBy}</> : isNew ? <> &middot; New template</> : <> &middot; Not used by an automation yet</>}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="History" className="flex rounded-full border border-rule-control/60 p-0.5">
              <Button variant="quiet" size="icon-sm" className="rounded-full" aria-label="Undo" title="Undo (Ctrl Z)" disabled={!history.canUndo} onClick={undo}>
                <ArrowCounterClockwiseIcon aria-hidden />
              </Button>
              <Button variant="quiet" size="icon-sm" className="rounded-full" aria-label="Redo" title="Redo (Ctrl Shift Z)" disabled={!history.canRedo} onClick={redo}>
                <ArrowClockwiseIcon aria-hidden />
              </Button>
            </div>
            <Button variant="secondary" onClick={() => toast.success("Sent a test to your own inbox, with sample details filled in.")}>
              <PaperPlaneTiltIcon aria-hidden />
              Send me a test
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        {/* ------------------------------------------------------- editor */}
        <div className="min-w-0">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList aria-label="Edit">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="settings">
                Settings
                {toFix ? (
                  <span data-numeric className="ml-1.5 rounded-full bg-warning-wash px-1.5 font-mono text-2xs text-ink">
                    {toFix}
                  </span>
                ) : null}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-5 space-y-6 focus-visible:outline-none">
              <InboxFields t={t} setT={setT} />

              <section aria-labelledby="et-blocks" className="space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 id="et-blocks" className="font-display text-base font-semibold text-ink">
                    The email, top to bottom
                  </h3>
                  <span className="hidden text-xs text-ink-muted sm:inline">Drag to reorder, or click the preview</span>
                </div>
                <Reorder.Group
                  as="ol"
                  axis="y"
                  ref={listRef}
                  values={t.blocks}
                  onReorder={(blocks: EmailBlock[]) => setT((x) => ({ ...x, blocks }), "reorder")}
                  className="space-y-2"
                >
                  {t.blocks.map((b, i) => (
                    <BlockRow
                      key={b.id}
                      block={b}
                      open={selected === b.id}
                      first={i === 0}
                      last={i === t.blocks.length - 1}
                      onToggle={() => setSelected(selected === b.id ? null : b.id)}
                      onChange={(p, key) => setBlock(b.id, p, key)}
                      onMove={(by) => move(b.id, by)}
                      onDuplicate={() => duplicate(b.id)}
                      onRemove={() => remove(b.id)}
                    />
                  ))}
                </Reorder.Group>
                {t.blocks.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-rule-control px-4 py-6 text-center text-sm text-ink-muted">
                    Empty for now. Add a heading and a paragraph to start.
                  </p>
                ) : null}

                <BlockPicker onAdd={add} where={selected ? "under the one you have open" : "at the end"} />
              </section>
            </TabsContent>

            <TabsContent value="design" className="mt-5 space-y-6 focus-visible:outline-none">
              <DesignPanel style={t.style} businessName={businessName} onChange={setStyle} />
            </TabsContent>

            <TabsContent value="settings" className="mt-5 space-y-6 focus-visible:outline-none">
              <SettingsPanel t={t} setT={setT} businessName={businessName} />
              <ChecksPanel checks={checks} />
            </TabsContent>
          </Tabs>
        </div>

        {/* ------------------------------------------------------ preview */}
        <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div role="group" aria-label="Preview size" className="flex rounded-full bg-panel p-0.5">
              {(
                [
                  ["desktop", "Computer", DesktopIcon],
                  ["mobile", "Phone", DeviceMobileIcon],
                ] as const
              ).map(([k, label, WIcon]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={width === k}
                  onClick={() => setWidth(k)}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    width === k ? "bg-surface text-ink shadow-[0_1px_3px_rgb(10_10_10/0.12)]" : "text-ink-muted hover:text-ink",
                  )}
                >
                  <WIcon aria-hidden className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-pressed={imagesOff}
                onClick={() => setImagesOff((v) => !v)}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  imagesOff ? "border-ink bg-ink text-canvas" : "border-rule-control/60 text-ink-muted hover:text-ink",
                )}
              >
                <EyeSlashIcon aria-hidden className="size-3.5" />
                Images off
              </button>
              <button
                type="button"
                onClick={() => setTab("settings")}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-rule-control/60 px-3 py-1 text-xs font-medium text-ink transition-colors hover:border-ink"
              >
                {toFix ? <WarningCircleIcon aria-hidden weight="fill" className="size-3.5 text-warning" /> : <CheckCircleIcon aria-hidden weight="fill" className="size-3.5 text-success" />}
                {toFix ? `${toFix} ${toFix === 1 ? "thing" : "things"} to check` : "Ready to send"}
              </button>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-rule shadow-raised">
            <InboxHeader businessName={businessName} subject={t.subject} preheader={t.preheader} fromName={t.fromName} />
            <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto">
              <EmailRender
                template={t}
                businessName={businessName}
                width={width}
                imagesOff={imagesOff}
                selectedId={tab === "content" ? selected : null}
                onSelect={selectFromPreview}
                tools={(id) => {
                  const i = t.blocks.findIndex((b) => b.id === id);
                  return (
                    <BlockTools
                      onUp={i > 0 ? () => move(id, -1) : undefined}
                      onDown={i < t.blocks.length - 1 ? () => move(id, 1) : undefined}
                      onDuplicate={() => duplicate(id)}
                      onRemove={() => remove(id)}
                    />
                  );
                }}
              />
            </div>
          </div>
          <p className="mt-2 text-center text-2xs text-ink-muted">Shown with sample details for Marisol. Each person sees their own.</p>
        </div>
      </div>

      <SaveBar
        dirty={dirty}
        saving={saving}
        note={usedBy ? "Saving updates it everywhere it is sent." : "Not saved yet."}
        onDiscard={() => setT(() => saved ?? initial)}
        onSave={save}
        saveLabel={isNew && saved === null ? "Create template" : "Save template"}
      />
    </div>
  );
}

/* --------------------------------------------------------------- inbox */

type SetT = (update: (x: EmailTemplate) => EmailTemplate, key?: string) => void;

function InboxFields({ t, setT }: { t: EmailTemplate; setT: SetT }) {
  const subject = useInsert<HTMLInputElement>(t.subject, (v) => setT((x) => ({ ...x, subject: v }), "subject"));
  return (
    <section className="space-y-4 rounded-2xl border border-rule bg-surface p-5">
      <div className="space-y-2">
        <Field label="Subject line" htmlFor="et-subject">
          <Input ref={subject.ref} value={t.subject} onChange={(e) => setT((x) => ({ ...x, subject: e.target.value }), "subject")} />
        </Field>
        <VarChips onInsert={subject.insert} keys={["first_name", "business", "service", "booking_time"]} />
      </div>
      <Field label="Preview text" htmlFor="et-pre" hint="The grey line most inboxes show after the subject.">
        <Input value={t.preheader} onChange={(e) => setT((x) => ({ ...x, preheader: e.target.value }), "preheader")} />
      </Field>
    </section>
  );
}

/* --------------------------------------------------------------- blocks */

function BlockRow({
  block: b,
  open,
  first,
  last,
  onToggle,
  onChange,
  onMove,
  onDuplicate,
  onRemove,
}: {
  block: EmailBlock;
  open: boolean;
  first: boolean;
  last: boolean;
  onToggle: () => void;
  onChange: (p: Partial<EmailBlock>, key?: string) => void;
  onMove: (by: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const BIcon = BLOCK_ICON[b.kind];
  const label = BLOCK[b.kind].label;
  const drag = useDragControls();
  return (
    <Reorder.Item
      as="li"
      value={b}
      dragListener={false}
      dragControls={drag}
      data-row={b.id}
      className={cn(
        "relative scroll-mt-24 rounded-xl border bg-surface transition-colors",
        open ? "border-primary/50" : "border-rule hover:border-rule-control",
      )}
      whileDrag={{ scale: 1.02, boxShadow: "0 12px 32px -12px rgb(10 10 10 / 0.35)", zIndex: 20 }}
    >
      <div className="flex items-center gap-0.5 pr-1.5">
        <span
          aria-hidden
          title="Drag to move"
          onPointerDown={(e) => drag.start(e)}
          className="flex h-12 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-l-xl text-ink-faint hover:text-ink active:cursor-grabbing"
        >
          <DotsSixVerticalIcon weight="bold" className="size-4" />
        </span>
        <button type="button" aria-expanded={open} onClick={onToggle} className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl py-3 pr-2 text-left">
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", open ? "bg-primary-wash text-primary" : "bg-panel text-ink-muted")}>
            <BIcon aria-hidden className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-ink">{label}</span>
            {!open ? <span className="block truncate text-xs text-ink-muted">{blockSummary(b)}</span> : null}
          </span>
        </button>
        <Button variant="quiet" size="icon-sm" aria-label={`Move ${label.toLowerCase()} up`} disabled={first} onClick={() => onMove(-1)}>
          <ArrowUpIcon aria-hidden />
        </Button>
        <Button variant="quiet" size="icon-sm" aria-label={`Move ${label.toLowerCase()} down`} disabled={last} onClick={() => onMove(1)}>
          <ArrowDownIcon aria-hidden />
        </Button>
      </div>
      {open ? (
        <div className="space-y-4 border-t border-rule px-4 pb-4 pt-4">
          <BlockFields block={b} onChange={onChange} />
          <div className="flex justify-end gap-1 border-t border-rule pt-3">
            <Button variant="quiet" size="sm" onClick={onDuplicate}>
              <CopyIcon aria-hidden />
              Duplicate
            </Button>
            <Button variant="quiet" size="sm" onClick={onRemove}>
              <TrashIcon aria-hidden />
              Remove
            </Button>
          </div>
        </div>
      ) : null}
    </Reorder.Item>
  );
}

function BlockPicker({ onAdd, where }: { onAdd: (k: EmailBlockKind) => void; where: string }) {
  return (
    <div className="rounded-2xl border border-rule bg-surface p-4">
      <p className="text-sm font-medium text-ink">Add a block</p>
      <p className="text-xs text-ink-muted">It goes {where}.</p>
      <div className="mt-4 space-y-4">
        {BLOCK_GROUPS.map((g) => (
          <div key={g.label}>
            <p className="mb-1.5 text-2xs font-medium text-ink-muted">{g.label}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {g.kinds.map((k) => {
                const KIcon = BLOCK_ICON[k];
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => onAdd(k)}
                    className="group flex cursor-pointer items-start gap-2.5 rounded-xl border border-rule bg-canvas px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary-wash active:scale-[0.98]"
                  >
                    <KIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-muted group-hover:text-primary" />
                    <span className="min-w-0">
                      <span className="block text-xs font-medium text-ink">{BLOCK[k].label}</span>
                      <span className="block text-2xs leading-snug text-ink-muted">{BLOCK[k].hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The small bar on the selected block in the preview. It sits on the email's white paper in either theme. */
function BlockTools({ onUp, onDown, onDuplicate, onRemove }: { onUp?: () => void; onDown?: () => void; onDuplicate: () => void; onRemove: () => void }) {
  const items: [string, Icon, (() => void) | undefined][] = [
    ["Move up", ArrowUpIcon, onUp],
    ["Move down", ArrowDownIcon, onDown],
    ["Duplicate", CopyIcon, onDuplicate],
    ["Remove", TrashIcon, onRemove],
  ];
  return (
    <div role="toolbar" aria-label="Block" className="flex items-center gap-0.5 rounded-full bg-[#18181b] p-0.5 shadow-[0_6px_16px_-6px_rgb(0_0_0/0.5)]">
      {items.map(([label, TIcon, fn]) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          title={label}
          disabled={!fn}
          onClick={fn}
          className="flex size-7 cursor-pointer items-center justify-center rounded-full text-[#f4f4f5] transition-colors hover:bg-white/15 disabled:cursor-default disabled:text-[#a1a1aa] disabled:hover:bg-transparent"
        >
          <TIcon aria-hidden className="size-3.5" />
        </button>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- design */

function DesignPanel({
  style: s,
  businessName,
  onChange,
}: {
  style: EmailStyle;
  businessName: string;
  onChange: (p: Partial<EmailStyle>, key?: string) => void;
}) {
  const [hex, setHex] = React.useState(s.accent);
  React.useEffect(() => setHex(s.accent), [s.accent]);
  const logoRef = React.useRef<HTMLInputElement>(null);
  const ink = inkOn(s.accent);

  function uploadLogo(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("That file is not a picture. Use a PNG, SVG, or JPG.");
    if (file.size / 1024 / 1024 > IMAGE_MAX_MB) return toast.error(`Use a logo under ${IMAGE_MAX_MB} MB.`);
    onChange({ logo: URL.createObjectURL(file), header: s.header === "plain" ? "logo" : s.header });
    toast.success("Logo added.");
  }

  return (
    <>
      <section className="space-y-4 rounded-2xl border border-rule bg-surface p-5">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">Colour</h3>
          <p className="text-sm text-ink-muted">For the top band, buttons, highlights, and stars. Text on it is picked for contrast.</p>
        </div>
        <div role="group" aria-label="Ready-made colours" className="grid grid-cols-8 gap-2">
          {PALETTES.map((p) => {
            const on = p.hex.toLowerCase() === s.accent.toLowerCase();
            return (
              <button
                key={p.hex}
                type="button"
                aria-pressed={on}
                aria-label={p.name}
                title={p.name}
                onClick={() => onChange({ accent: p.hex })}
                className={cn(
                  "flex aspect-square cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-105",
                  on ? "ring-2 ring-ink ring-offset-2 ring-offset-surface" : "ring-1 ring-black/10",
                )}
                style={{ background: p.hex, color: inkOn(p.hex) }}
              >
                {on ? <CheckIcon aria-hidden weight="bold" className="size-4" /> : null}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="relative flex size-10 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-1 ring-rule-control">
            <span className="sr-only">Pick any colour</span>
            <input type="color" value={s.accent} onChange={(e) => onChange({ accent: e.target.value }, "accent")} className="absolute -inset-2 size-14 cursor-pointer border-0 p-0" />
          </label>
          <Field label="Hex code" htmlFor="et-hex" className="w-36">
            <Input
              value={hex}
              maxLength={7}
              spellCheck={false}
              className="font-mono"
              onChange={(e) => {
                const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
                setHex(v);
                if (HEX.test(v)) onChange({ accent: v.toLowerCase() }, "accent");
              }}
            />
          </Field>
          <p className="pb-2.5 text-xs text-ink-muted">
            {ink === "#ffffff" ? "White" : "Dark"} button text,{" "}
            <span data-numeric className="font-mono text-ink">
              {contrast(s.accent, ink).toFixed(1)}:1
            </span>
          </p>
        </div>
      </section>

      <section className="space-y-5 rounded-2xl border border-rule bg-surface p-5">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">Logo and top</h3>
          <p className="text-sm text-ink-muted">Without a logo, your initials in your colour stand in.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-rule bg-[#ffffff]">
            {s.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.logo} alt="Your logo" className="max-h-10 max-w-20 object-contain" />
            ) : (
              <span aria-hidden className="flex size-9 items-center justify-center rounded-lg text-xs font-bold" style={{ background: s.accent, color: ink }}>
                {businessName
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")}
              </span>
            )}
          </span>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => logoRef.current?.click()}>
              <UploadSimpleIcon aria-hidden />
              {s.logo ? "Replace logo" : "Upload a logo"}
            </Button>
            {s.logo ? (
              <Button variant="quiet" size="sm" onClick={() => onChange({ logo: null })}>
                Remove
              </Button>
            ) : null}
          </div>
          <input
            ref={logoRef}
            type="file"
            accept="image/png,image/svg+xml,image/jpeg,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              uploadLogo(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        <Segment
          label="Top of the email"
          value={s.header}
          onChange={(header) => onChange({ header })}
          options={[
            { key: "band", label: "Colour band" },
            { key: "logo", label: "Centred logo" },
            { key: "plain", label: "Name only" },
          ]}
        />
      </section>

      <section className="space-y-5 rounded-2xl border border-rule bg-surface p-5">
        <h3 className="font-display text-base font-semibold text-ink">Shape and lettering</h3>
        <Segment
          label="Behind the email"
          value={s.backdrop ?? "grey"}
          onChange={(backdrop) => onChange({ backdrop })}
          options={[
            { key: "grey", label: "Soft grey" },
            { key: "tint", label: "Your colour" },
            { key: "white", label: "White" },
          ]}
        />
        <Segment
          label="Corners"
          value={s.corners}
          onChange={(corners) => onChange({ corners })}
          options={[
            { key: "sharp", label: "Sharp" },
            { key: "soft", label: "Soft" },
            { key: "round", label: "Round" },
          ]}
        />
        <Segment
          label="Lettering"
          value={s.font}
          onChange={(font) => onChange({ font })}
          options={[
            { key: "modern", label: "Modern" },
            { key: "friendly", label: "Friendly" },
            { key: "classic", label: "Classic" },
          ]}
        />
        <p className="text-xs leading-relaxed text-ink-muted">
          Inboxes that cannot load web fonts fall back to a close system font. Every email also reads properly with images turned off.
        </p>
      </section>
    </>
  );
}

/* ------------------------------------------------------------- settings */

function SettingsPanel({ t, setT, businessName }: { t: EmailTemplate; setT: SetT; businessName: string }) {
  return (
    <section className="space-y-4 rounded-2xl border border-rule bg-surface p-5">
      <Field label="Template name" htmlFor="et-name" hint="Only your team sees this." error={t.name.trim() ? undefined : "Give it a name."}>
        <Input value={t.name} onChange={(e) => setT((x) => ({ ...x, name: e.target.value }), "name")} />
      </Field>
      <Field label="Used for" htmlFor="et-purpose" hint={PURPOSE[t.purpose].hint}>
        <Select value={t.purpose} onChange={(e) => setT((x) => ({ ...x, purpose: e.target.value as EmailPurpose }))}>
          {(Object.keys(PURPOSE) as EmailPurpose[]).map((k) => (
            <option key={k} value={k}>
              {PURPOSE[k].label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="From name" htmlFor="et-from" hint="Who the inbox says it is from. A person's name gets opened more.">
        <Input value={t.fromName ?? ""} placeholder={businessName} onChange={(e) => setT((x) => ({ ...x, fromName: e.target.value }), "from")} />
      </Field>
      <Field label="Replies go to" htmlFor="et-reply" hint="A real inbox someone reads. Replies also show in Conversations.">
        <Input type="email" value={t.replyTo ?? ""} spellCheck={false} placeholder="frontdesk@aldercreekdental.com" onChange={(e) => setT((x) => ({ ...x, replyTo: e.target.value }), "reply")} />
      </Field>
    </section>
  );
}

function ChecksPanel({ checks }: { checks: ReturnType<typeof templateChecks> }) {
  return (
    <section aria-labelledby="et-checks" className="rounded-2xl border border-rule bg-surface p-5">
      <h3 id="et-checks" className="font-display text-base font-semibold text-ink">
        Before you send
      </h3>
      <p className="text-sm text-ink-muted">Suggestions, not rules. You can save either way.</p>
      <ul className="mt-4 space-y-3">
        {checks.map((c) => (
          <li key={c.fix} className="flex items-start gap-2.5">
            {c.ok ? (
              <CheckCircleIcon aria-hidden weight="fill" className="mt-0.5 size-4 shrink-0 text-success" />
            ) : (
              <WarningCircleIcon aria-hidden weight="fill" className="mt-0.5 size-4 shrink-0 text-warning" />
            )}
            <span className="min-w-0">
              <span className="block text-sm font-medium text-ink">
                {c.label}
                <span className="sr-only">{c.ok ? ", fine" : ", worth a look"}</span>
              </span>
              {!c.ok ? <span className="block text-xs leading-relaxed text-ink-muted">{c.fix}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
