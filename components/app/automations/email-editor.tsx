"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  CalendarBlankIcon,
  CheckIcon,
  CopyIcon,
  CursorClickIcon,
  DesktopIcon,
  DeviceMobileIcon,
  MinusIcon,
  PaperPlaneTiltIcon,
  SignatureIcon,
  StarIcon,
  TextAlignLeftIcon,
  TextHIcon,
  TrashIcon,
  type Icon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlay";
import type { EmailBlock, EmailBlockKind, EmailLink, EmailPurpose, EmailStyle, EmailTemplate } from "@/lib/api/types";
import { BLOCK, LINK, PURPOSE, blockSummary, newBlock, templateProblem } from "@/lib/email";
import { HEX, PALETTES, contrast, inkOn } from "@/lib/widget";
import { cn } from "@/lib/utils";
import { EmailRender, InboxHeader } from "./email-render";
import { SaveBar, VarChips, useInsert } from "./shared";

/**
 * The email template editor.
 *
 * An email is built from blocks, each with only the fields it needs. The
 * preview is the email itself, in the business's colours, and clicking any
 * part of it opens that block for editing, so nobody has to map a list of
 * fields onto a picture in their head.
 */

const BLOCK_ICON: Record<EmailBlockKind, Icon> = {
  heading: TextHIcon,
  text: TextAlignLeftIcon,
  button: CursorClickIcon,
  booking: CalendarBlankIcon,
  stars: StarIcon,
  divider: MinusIcon,
  signoff: SignatureIcon,
};

const ADD_ORDER: EmailBlockKind[] = ["heading", "text", "button", "booking", "stars", "divider", "signoff"];
const VAR_KEYS = ["first_name", "business", "service", "booking_time", "location", "business_phone"];

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
  const [t, setT] = React.useState(initial);
  const [tab, setTab] = React.useState<"content" | "look">("content");
  const [selected, setSelected] = React.useState<string | null>(initial.blocks[0]?.id ?? null);
  const [width, setWidth] = React.useState<"desktop" | "mobile">("desktop");
  const [saving, setSaving] = React.useState(false);
  const listRef = React.useRef<HTMLOListElement>(null);
  const dirty = saved === null || JSON.stringify(t) !== JSON.stringify(saved);

  const subject = useInsert<HTMLInputElement>(t.subject, (subject) => setT((x) => ({ ...x, subject })));

  const setBlock = (id: string, patch: Partial<EmailBlock>) =>
    setT((x) => ({ ...x, blocks: x.blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as EmailBlock) : b)) }));
  const setStyle = (patch: Partial<EmailStyle>) => setT((x) => ({ ...x, style: { ...x.style, ...patch } }));

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

  function selectFromPreview(id: string) {
    setTab("content");
    setSelected(id);
    requestAnimationFrame(() =>
      listRef.current?.querySelector(`[data-row="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
    );
  }

  function save() {
    if (!t.name.trim()) return toast.error("Give the template a name, so you can find it later.");
    const problem = templateProblem(t);
    if (problem) return toast.error(problem);
    setSaving(true);
    window.setTimeout(() => {
      setSaved(t);
      setSaving(false);
      toast.success(isNew && saved === null ? "Template created. Pick it in follow-ups or review requests." : "Template saved.");
    }, 500);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link
          href={"/automations/emails" as Route}
          className="inline-flex items-center gap-1.5 rounded-md text-sm text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeftIcon aria-hidden className="size-4" />
          Email templates
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-ink">{t.name.trim() || "Untitled email"}</h2>
            <p className="mt-1.5 text-base text-ink-muted">
              {PURPOSE[t.purpose].label}
              {usedBy ? <> &middot; Sent as {usedBy}</> : isNew ? <> &middot; New template</> : <> &middot; Not used by an automation yet</>}
            </p>
          </div>
          <Button variant="secondary" onClick={() => toast.success("Sent a test to your own inbox, with sample details filled in.")}>
            <PaperPlaneTiltIcon aria-hidden />
            Send me a test
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)]">
        {/* ------------------------------------------------------- editor */}
        <div className="min-w-0">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "content" | "look")}>
            <TabsList aria-label="Edit">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="look">Look</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-5 space-y-6 focus-visible:outline-none">
              <section className="space-y-4 rounded-2xl border border-rule bg-surface p-5">
                <Field label="Template name" htmlFor="et-name" hint="Only your team sees this.">
                  <Input value={t.name} onChange={(e) => setT((x) => ({ ...x, name: e.target.value }))} />
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
                <div className="space-y-2">
                  <Field label="Subject line" htmlFor="et-subject">
                    <Input ref={subject.ref} value={t.subject} onChange={(e) => setT((x) => ({ ...x, subject: e.target.value }))} />
                  </Field>
                  <VarChips onInsert={subject.insert} keys={["first_name", "business", "service", "booking_time"]} />
                </div>
                <Field label="Preview text" htmlFor="et-pre" hint="The grey line most inboxes show after the subject.">
                  <Input value={t.preheader} onChange={(e) => setT((x) => ({ ...x, preheader: e.target.value }))} />
                </Field>
              </section>

              <section aria-labelledby="et-blocks" className="space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 id="et-blocks" className="font-display text-base font-semibold text-ink">
                    The email, top to bottom
                  </h3>
                  <span className="text-xs text-ink-muted">Or click any part of the preview</span>
                </div>
                <ol ref={listRef} className="space-y-2">
                  {t.blocks.map((b, i) => (
                    <BlockRow
                      key={b.id}
                      block={b}
                      open={selected === b.id}
                      first={i === 0}
                      last={i === t.blocks.length - 1}
                      onToggle={() => setSelected(selected === b.id ? null : b.id)}
                      onChange={(p) => setBlock(b.id, p)}
                      onMove={(by) => move(b.id, by)}
                      onDuplicate={() => duplicate(b.id)}
                      onRemove={() => {
                        setT((x) => ({ ...x, blocks: x.blocks.filter((y) => y.id !== b.id) }));
                        setSelected(null);
                      }}
                    />
                  ))}
                </ol>
                {t.blocks.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-rule-control px-4 py-6 text-center text-sm text-ink-muted">
                    Empty for now. Add a heading and a paragraph to start.
                  </p>
                ) : null}

                <div className="rounded-2xl border border-rule bg-surface p-4">
                  <p className="text-sm font-medium text-ink">Add a block</p>
                  <p className="text-xs text-ink-muted">{selected ? "It goes under the one you have open." : "It goes at the end."}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                    {ADD_ORDER.map((k) => {
                      const KIcon = BLOCK_ICON[k];
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => add(k)}
                          title={BLOCK[k].hint}
                          className="flex cursor-pointer flex-col items-start gap-1.5 rounded-xl border border-rule bg-canvas px-3 py-2.5 text-left text-xs font-medium text-ink transition-colors hover:border-primary/40 hover:bg-primary-wash active:scale-[0.98]"
                        >
                          <KIcon aria-hidden className="size-4 text-ink-muted" />
                          {BLOCK[k].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="look" className="mt-5 space-y-6 focus-visible:outline-none">
              <LookPanel style={t.style} onChange={setStyle} />
            </TabsContent>
          </Tabs>
        </div>

        {/* ------------------------------------------------------ preview */}
        <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-ink">Preview, with Marisol&apos;s details</p>
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
          </div>
          <div className="overflow-hidden rounded-2xl border border-rule shadow-raised">
            <InboxHeader businessName={businessName} subject={t.subject} preheader={t.preheader} />
            <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto">
              <EmailRender template={t} businessName={businessName} width={width} selectedId={tab === "content" ? selected : null} onSelect={selectFromPreview} />
            </div>
          </div>
        </div>
      </div>

      <SaveBar
        dirty={dirty}
        saving={saving}
        note={usedBy ? `Saving updates it everywhere it is sent.` : "Not saved yet."}
        onDiscard={() => {
          if (saved) setT(saved);
          else setT(initial);
        }}
        onSave={save}
        saveLabel={isNew && saved === null ? "Create template" : "Save template"}
      />
    </div>
  );
}

/* --------------------------------------------------------------- a block */

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
  onChange: (p: Partial<EmailBlock>) => void;
  onMove: (by: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const BIcon = BLOCK_ICON[b.kind];
  const label = BLOCK[b.kind].label;
  return (
    <li
      data-row={b.id}
      className={cn("scroll-mt-24 rounded-xl border bg-surface transition-colors", open ? "border-primary/50" : "border-rule hover:border-rule-control")}
    >
      <div className="flex items-center gap-1 pr-1.5">
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl px-3.5 py-3 text-left"
        >
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
        <div className="space-y-3 border-t border-rule px-3.5 pb-3.5 pt-3.5">
          <BlockFields block={b} onChange={onChange} />
          <div className="flex justify-end gap-1 pt-1">
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
    </li>
  );
}

function BlockFields({ block: b, onChange }: { block: EmailBlock; onChange: (p: Partial<EmailBlock>) => void }) {
  const text = "text" in b ? b.text : "";
  const ins = useInsert<HTMLTextAreaElement>(text, (v) => onChange({ text: v } as Partial<EmailBlock>));
  const id = `blk-${b.id}`;
  switch (b.kind) {
    case "heading":
    case "text":
      return (
        <>
          <Field label={b.kind === "heading" ? "Heading" : "Paragraph"} htmlFor={id}>
            <Textarea ref={ins.ref} value={b.text} onChange={(e) => onChange({ text: e.target.value })} className={b.kind === "heading" ? "min-h-14" : "min-h-28"} />
          </Field>
          <VarChips onInsert={ins.insert} keys={VAR_KEYS} />
        </>
      );
    case "button":
      return (
        <>
          <Field label="Button text" htmlFor={id} hint="Say what happens: Book my visit, not Click here.">
            <Input value={b.label} maxLength={32} onChange={(e) => onChange({ label: e.target.value })} />
          </Field>
          <Field label="Opens" htmlFor={`${id}-link`}>
            <Select value={b.link} onChange={(e) => onChange({ link: e.target.value as EmailLink })}>
              {(Object.keys(LINK) as EmailLink[]).map((k) => (
                <option key={k} value={k}>
                  {LINK[k].label}
                </option>
              ))}
            </Select>
          </Field>
        </>
      );
    case "booking":
      return <p className="text-sm leading-relaxed text-ink-muted">Filled in from their booking: the service, who with, the time, and the address. Nothing to write.</p>;
    case "stars":
      return (
        <>
          <Field label="Line above the stars" htmlFor={id}>
            <Input value={b.prompt} onChange={(e) => onChange({ prompt: e.target.value })} />
          </Field>
          <p className="text-xs leading-relaxed text-ink-muted">Every star opens the same review page, whichever they tap. Nobody is filtered by what they pick.</p>
        </>
      );
    case "divider":
      return <p className="text-sm text-ink-muted">A thin line. Nothing to set.</p>;
    case "signoff":
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Closing line" htmlFor={id}>
            <Input value={b.text} onChange={(e) => onChange({ text: e.target.value })} />
          </Field>
          <Field label="From" htmlFor={`${id}-name`}>
            <Input value={b.name} onChange={(e) => onChange({ name: e.target.value })} />
          </Field>
        </div>
      );
  }
}

/* ------------------------------------------------------------------ look */

function LookPanel({ style: s, onChange }: { style: EmailStyle; onChange: (p: Partial<EmailStyle>) => void }) {
  const [hex, setHex] = React.useState(s.accent);
  React.useEffect(() => setHex(s.accent), [s.accent]);
  const ink = inkOn(s.accent);
  return (
    <>
      <section className="space-y-4 rounded-2xl border border-rule bg-surface p-5">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">Colour</h3>
          <p className="text-sm text-ink-muted">For the top band, buttons, and stars. Button text is picked for contrast.</p>
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
            <input type="color" value={s.accent} onChange={(e) => onChange({ accent: e.target.value })} className="absolute -inset-2 size-14 cursor-pointer border-0 p-0" />
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
                if (HEX.test(v)) onChange({ accent: v.toLowerCase() });
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
        <Segment
          label="Top of the email"
          value={s.header}
          onChange={(header) => onChange({ header })}
          options={[
            { key: "band", label: "Colour band" },
            { key: "plain", label: "Name on white" },
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
          Inboxes that cannot load web fonts fall back to a close system font. Every email also works with images turned off.
        </p>
      </section>
    </>
  );
}

function Segment<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { key: T; label: string }[];
}) {
  const id = React.useId();
  return (
    <div>
      <p id={id} className="mb-1.5 text-sm font-medium text-ink">
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={id} className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-panel p-1">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={value === o.key}
            onClick={() => onChange(o.key)}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              value === o.key ? "bg-surface text-ink shadow-[0_1px_3px_rgb(10_10_10/0.12)]" : "text-ink-muted hover:text-ink",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
