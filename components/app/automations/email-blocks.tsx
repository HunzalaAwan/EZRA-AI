"use client";

import * as React from "react";
import {
  CheckIcon,
  LinkSimpleIcon,
  PlusIcon,
  TextBIcon,
  UploadSimpleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/field";
import type { EmailBlock, EmailButton, EmailLink, SocialNetwork } from "@/lib/api/types";
import { BUSINESS, EMAIL_IMAGES, IMAGE_MAX_MB, LINK, SOCIAL, linkTarget } from "@/lib/email";
import { cn } from "@/lib/utils";
import { VarChips, useInsert } from "./shared";
import { SOCIAL_ICON } from "./email-render";

/**
 * The fields for one block of an email. Each kind asks only for what it
 * needs, and anything EZRA can fill in itself (the booking, the address) is
 * shown, not asked for.
 */

const VAR_KEYS = ["first_name", "business", "service", "booking_time", "location", "business_phone"];

type Patch = (p: Partial<EmailBlock>, key?: string) => void;

export function BlockFields({ block: b, onChange }: { block: EmailBlock; onChange: Patch }) {
  const id = `blk-${b.id}`;
  switch (b.kind) {
    case "heading":
      return (
        <>
          <TextWithTools id={id} label="Heading" value={b.text} rows="min-h-14" onChange={(text) => onChange({ text }, `${id}-text`)} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Segment label="Size" value={b.size ?? "large"} onChange={(size) => onChange({ size })} options={[{ key: "large", label: "Large" }, { key: "medium", label: "Medium" }]} />
            <Segment label="Line up" value={b.align ?? "left"} onChange={(align) => onChange({ align })} options={[{ key: "left", label: "Left" }, { key: "center", label: "Centre" }]} />
          </div>
        </>
      );
    case "text":
      return (
        <>
          <TextWithTools id={id} label="Paragraph" value={b.text} rows="min-h-28" bold onChange={(text) => onChange({ text }, `${id}-text`)} />
          <Segment label="Line up" value={b.align ?? "left"} onChange={(align) => onChange({ align })} options={[{ key: "left", label: "Left" }, { key: "center", label: "Centre" }]} />
        </>
      );
    case "callout":
      return (
        <>
          <TextWithTools id={id} label="What it says" value={b.text} rows="min-h-20" bold onChange={(text) => onChange({ text }, `${id}-text`)} />
          <Segment label="Shade" value={b.tone ?? "tint"} onChange={(tone) => onChange({ tone })} options={[{ key: "tint", label: "Your colour" }, { key: "grey", label: "Grey" }]} />
        </>
      );
    case "image":
      return <ImageFields block={b} id={id} onChange={onChange} />;
    case "button":
      return <ButtonFields block={b} id={id} onChange={onChange} />;
    case "booking":
      return (
        <p className="text-sm leading-relaxed text-ink-muted">
          Filled in from their booking: the service, who with, the time, and the address. Nothing to write.
        </p>
      );
    case "stars":
      return (
        <>
          <Field label="Line above the stars" htmlFor={id}>
            <Input value={b.prompt} onChange={(e) => onChange({ prompt: e.target.value }, `${id}-prompt`)} />
          </Field>
          <p className="text-xs leading-relaxed text-ink-muted">
            Every star opens the same review page, whichever they tap. Nobody is filtered by what they pick.
          </p>
        </>
      );
    case "contact":
      return (
        <>
          <div className="rounded-xl bg-panel px-3.5 py-3 text-sm leading-relaxed text-ink">
            <p data-numeric className="font-mono">
              {BUSINESS.phone}
            </p>
            <p>{BUSINESS.address}</p>
            <p className="text-ink-muted">{BUSINESS.hours}</p>
          </div>
          <p className="text-xs text-ink-muted">From your business details. Change them once in Settings and every email follows.</p>
          <Toggle id={`${id}-hours`} label="Show opening hours" checked={b.showHours !== false} onChange={(showHours) => onChange({ showHours })} />
          <Toggle id={`${id}-map`} label="Show a directions link" checked={b.showMap !== false} onChange={(showMap) => onChange({ showMap })} />
        </>
      );
    case "social":
      return <SocialFields block={b} id={id} onChange={onChange} />;
    case "divider":
      return <p className="text-sm text-ink-muted">A thin line. Nothing to set.</p>;
    case "spacer":
      return (
        <Segment
          label="How much space"
          value={b.size ?? "m"}
          onChange={(size) => onChange({ size })}
          options={[
            { key: "s", label: "A little" },
            { key: "m", label: "Some" },
            { key: "l", label: "A lot" },
          ]}
        />
      );
    case "signoff":
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Closing line" htmlFor={id}>
            <Input value={b.text} onChange={(e) => onChange({ text: e.target.value }, `${id}-text`)} />
          </Field>
          <Field label="From" htmlFor={`${id}-name`}>
            <Input value={b.name} onChange={(e) => onChange({ name: e.target.value }, `${id}-name`)} />
          </Field>
        </div>
      );
  }
}

/* ------------------------------------------------------------------ text */

function TextWithTools({
  id,
  label,
  value,
  rows,
  bold,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  rows: string;
  bold?: boolean;
  onChange: (v: string) => void;
}) {
  const ins = useInsert<HTMLTextAreaElement>(value, onChange);

  /** Wraps the selection in ** so it shows bold, or adds a bold word to replace. */
  function makeBold() {
    const el = ins.ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const picked = value.slice(start, end) || "bold words";
    onChange(`${value.slice(0, start)}**${picked}**${value.slice(end)}`);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + 2, start + 2 + picked.length);
    });
  }

  return (
    <div className="space-y-2">
      <Field label={label} htmlFor={id}>
        <Textarea ref={ins.ref} value={value} onChange={(e) => onChange(e.target.value)} className={rows} />
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <VarChips onInsert={ins.insert} keys={VAR_KEYS} />
        {bold ? (
          <Button variant="secondary" size="sm" onClick={makeBold} title="Select words, then make them bold">
            <TextBIcon aria-hidden weight="bold" />
            Bold
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- buttons */

function LinkFields({
  id,
  value,
  onChange,
  label = "Opens",
  allowNone,
}: {
  id: string;
  value: { link: EmailLink | null; url?: string };
  onChange: (v: { link: EmailLink | null; url?: string }) => void;
  label?: string;
  allowNone?: boolean;
}) {
  return (
    <div className="space-y-3">
      <Field label={label} htmlFor={`${id}-link`}>
        <Select value={value.link ?? ""} onChange={(e) => onChange({ link: (e.target.value || null) as EmailLink | null, url: value.url })}>
          {allowNone ? <option value="">Nothing, it is just a picture</option> : null}
          {(Object.keys(LINK) as EmailLink[]).map((k) => (
            <option key={k} value={k}>
              {LINK[k].label}
            </option>
          ))}
        </Select>
      </Field>
      {value.link === "custom" ? (
        <Field label="Web address" htmlFor={`${id}-url`} hint="Where it should go, like a page about your new-patient offer.">
          <Input value={value.url ?? ""} inputMode="url" spellCheck={false} placeholder="aldercreekdental.com/new-patients" onChange={(e) => onChange({ link: "custom", url: e.target.value })} />
        </Field>
      ) : value.link ? (
        <p className="flex items-center gap-1.5 text-xs text-ink-muted">
          <LinkSimpleIcon aria-hidden className="size-3.5" />
          <span>
            Goes to <span data-numeric className="font-mono text-ink">{linkTarget(value.link, value.url)}</span>
            {value.link === "booking_link" ? ", a link made for each person" : ""}
          </span>
        </p>
      ) : null}
    </div>
  );
}

function ButtonFields({ block: b, id, onChange }: { block: Extract<EmailBlock, { kind: "button" }>; id: string; onChange: Patch }) {
  const second = b.second ?? null;
  const setSecond = (p: Partial<EmailButton>) => onChange({ second: { ...(second ?? { label: "Call the office", link: "business_phone" }), ...p } }, `${id}-second`);
  return (
    <>
      <Field label="Button text" htmlFor={id} hint="Say what happens: Book my visit, not Click here.">
        <Input value={b.label} maxLength={32} onChange={(e) => onChange({ label: e.target.value }, `${id}-label`)} />
      </Field>
      <LinkFields id={id} value={{ link: b.link, url: b.url }} onChange={(v) => onChange({ link: v.link ?? "booking_link", url: v.url }, `${id}-url`)} />
      <Segment
        label="Style"
        value={b.variant ?? "solid"}
        onChange={(variant) => onChange({ variant })}
        options={[
          { key: "solid", label: "Filled" },
          { key: "outline", label: "Outline" },
          { key: "link", label: "Text link" },
        ]}
      />
      <Segment
        label="Placement"
        value={b.align ?? "left"}
        onChange={(align) => onChange({ align })}
        options={[
          { key: "left", label: "Left" },
          { key: "center", label: "Centre" },
          { key: "full", label: "Full width" },
        ]}
      />
      <div className="space-y-3 rounded-xl border border-rule p-3.5">
        <Toggle
          id={`${id}-second-on`}
          label="Add a second button"
          hint="A quieter choice beside the first, like calling instead of booking."
          checked={!!second}
          onChange={(on) => onChange({ second: on ? { label: "Call the office", link: "business_phone" } : null })}
        />
        {second ? (
          <>
            <Field label="Second button text" htmlFor={`${id}-2`}>
              <Input value={second.label} maxLength={32} onChange={(e) => setSecond({ label: e.target.value })} />
            </Field>
            <LinkFields id={`${id}-2`} value={{ link: second.link, url: second.url }} onChange={(v) => setSecond({ link: v.link ?? "business_phone", url: v.url })} />
          </>
        ) : null}
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- images */

function ImageFields({ block: b, id, onChange }: { block: Extract<EmailBlock, { kind: "image" }>; id: string; onChange: Patch }) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = React.useState<{ src: string; label: string }[]>([]);
  const fromLibrary = EMAIL_IMAGES.some((i) => i.src === b.src) || uploads.some((u) => u.src === b.src);

  function upload(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("That file is not a picture. Use a JPG, PNG, GIF, or WebP.");
    const mb = file.size / 1024 / 1024;
    if (mb > IMAGE_MAX_MB) return toast.error(`That picture is ${mb.toFixed(1)} MB. Use one under ${IMAGE_MAX_MB} MB so it loads quickly on a phone.`);
    const src = URL.createObjectURL(file);
    setUploads((u) => [{ src, label: file.name.replace(/\.[^.]+$/, "") }, ...u]);
    onChange({ src, alt: "" });
    toast.success("Picture added. Describe it below, so it reads well with images turned off.");
  }

  const choices = [...uploads.map((u) => ({ ...u, alt: "" })), ...EMAIL_IMAGES];

  return (
    <>
      <div>
        <p className="mb-1.5 text-sm font-medium text-ink">Picture</p>
        <div role="group" aria-label="Choose a picture" className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-rule-control bg-canvas text-2xs font-medium text-ink-muted transition-colors hover:border-ink hover:text-ink"
          >
            <UploadSimpleIcon aria-hidden className="size-5" />
            Upload
          </button>
          {choices.map((img) => {
            const on = b.src === img.src;
            return (
              <button
                key={img.src}
                type="button"
                aria-pressed={on}
                title={img.label}
                onClick={() => onChange({ src: img.src, alt: b.alt && !on ? b.alt : img.alt || b.alt })}
                className={cn(
                  "relative aspect-square cursor-pointer overflow-hidden rounded-lg transition-[box-shadow,transform] hover:scale-[1.03]",
                  on ? "ring-2 ring-primary ring-offset-2 ring-offset-surface" : "ring-1 ring-rule",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt="" className="size-full object-cover" />
                <span className="sr-only">{img.label}</span>
                {on ? (
                  <span aria-hidden className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-primary text-on-primary">
                    <CheckIcon weight="bold" className="size-3" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <p className="mt-1.5 text-2xs text-ink-muted">JPG, PNG, GIF, or WebP, up to {IMAGE_MAX_MB} MB. Wide pictures work best.</p>
      </div>

      <Field label="Or use a web address" htmlFor={`${id}-src`}>
        <Input
          value={b.src && !fromLibrary && !b.src.startsWith("blob:") ? b.src : ""}
          inputMode="url"
          spellCheck={false}
          placeholder="https://aldercreekdental.com/photos/office.jpg"
          onChange={(e) => onChange({ src: e.target.value || null }, `${id}-src`)}
        />
      </Field>

      <Field
        label="Describe the picture"
        htmlFor={`${id}-alt`}
        hint="Shown when images are off and read aloud by screen readers. Say what is in it."
        error={b.src && !b.alt.trim() ? "Add a short description." : undefined}
      >
        <Input value={b.alt} maxLength={140} onChange={(e) => onChange({ alt: e.target.value }, `${id}-alt`)} />
      </Field>

      <Segment
        label="Size"
        value={b.size ?? "full"}
        onChange={(size) => onChange({ size })}
        options={[
          { key: "full", label: "Edge to edge" },
          { key: "wide", label: "In the margins" },
          { key: "small", label: "Small" },
        ]}
      />
      <Field label="Caption" htmlFor={`${id}-cap`} hint="Optional. A short line under the picture.">
        <Input value={b.caption ?? ""} maxLength={90} onChange={(e) => onChange({ caption: e.target.value }, `${id}-cap`)} />
      </Field>
      <LinkFields
        id={`${id}-img`}
        label="Tapping it opens"
        allowNone
        value={{ link: b.link ?? null, url: b.url }}
        onChange={(v) => onChange({ link: v.link, url: v.url }, `${id}-imglink`)}
      />
    </>
  );
}

/* ---------------------------------------------------------------- social */

function SocialFields({ block: b, id, onChange }: { block: Extract<EmailBlock, { kind: "social" }>; id: string; onChange: Patch }) {
  const unused = (Object.keys(SOCIAL) as SocialNetwork[]).filter((n) => !b.links.some((l) => l.network === n));
  const set = (i: number, p: Partial<{ network: SocialNetwork; url: string }>) =>
    onChange({ links: b.links.map((l, j) => (j === i ? { ...l, ...p } : l)) }, `${id}-social-${i}`);
  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {b.links.map((l, i) => {
          const SIcon = SOCIAL_ICON[l.network];
          return (
            <li key={`${l.network}-${i}`} className="flex items-end gap-2">
              <span aria-hidden className="mb-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-panel text-ink">
                <SIcon className="size-4" />
              </span>
              <Field label="Network" htmlFor={`${id}-net-${i}`} className="w-32 shrink-0">
                <Select value={l.network} onChange={(e) => set(i, { network: e.target.value as SocialNetwork })}>
                  {(Object.keys(SOCIAL) as SocialNetwork[])
                    .filter((n) => n === l.network || unused.includes(n))
                    .map((n) => (
                      <option key={n} value={n}>
                        {SOCIAL[n].label}
                      </option>
                    ))}
                </Select>
              </Field>
              <Field label="Address" htmlFor={`${id}-url-${i}`} className="min-w-0 flex-1">
                <Input value={l.url} spellCheck={false} placeholder={SOCIAL[l.network].placeholder} onChange={(e) => set(i, { url: e.target.value })} />
              </Field>
              <Button
                variant="quiet"
                size="icon-sm"
                className="mb-0.5"
                aria-label={`Remove ${SOCIAL[l.network].label}`}
                onClick={() => onChange({ links: b.links.filter((_, j) => j !== i) })}
              >
                <XIcon aria-hidden />
              </Button>
            </li>
          );
        })}
      </ul>
      {unused.length ? (
        <Button variant="secondary" size="sm" onClick={() => onChange({ links: [...b.links, { network: unused[0]!, url: "" }] })}>
          <PlusIcon aria-hidden />
          Add a link
        </Button>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- shared */

export function Toggle({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="mt-0.5" />
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">{hint}</span> : null}
      </label>
    </div>
  );
}

export function Segment<T extends string>({
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
    <div className="min-w-0">
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
              "cursor-pointer rounded-lg px-2 py-2 text-sm font-medium transition-colors",
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
