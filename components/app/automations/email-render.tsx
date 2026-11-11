import * as React from "react";
import {
  CalendarBlankIcon,
  ClockIcon,
  MapPinIcon,
  StarIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { EmailBlock, EmailTemplate } from "@/lib/api/types";
import { EMAIL_FOOTER, fillSample } from "@/lib/email";
import { FONT, contrast, inkOn } from "@/lib/widget";
import { cn } from "@/lib/utils";

/**
 * An email as the customer sees it in their inbox.
 *
 * It wears the business's colour, not EZRA's, so its colours are data: the
 * accent comes from the template and every colour placed on it is chosen for
 * contrast. The page around it is always white, because that is what nearly
 * every inbox shows, in either theme of this app.
 */

const PAPER = { canvas: "#f1f1f4", card: "#ffffff", ink: "#0a0a0a", body: "#3a3a42", muted: "#62626b", line: "#e4e4e9", soft: "#f4f4f6" };
const RADIUS = { sharp: 4, soft: 10, round: 999 } as const;
const CARD_RADIUS = { sharp: 4, soft: 14, round: 20 } as const;

export function EmailRender({
  template: t,
  businessName,
  width = "desktop",
  selectedId,
  onSelect,
  className,
}: {
  template: Pick<EmailTemplate, "blocks" | "style">;
  businessName: string;
  width?: "desktop" | "mobile";
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  const s = t.style;
  const onAccent = inkOn(s.accent);
  // The accent as text on white only when it is readable there.
  const accentText = contrast(s.accent, PAPER.card) >= 4.5 ? s.accent : PAPER.ink;

  return (
    <div
      className={cn("w-full px-3 py-5 sm:px-5", className)}
      style={{ background: PAPER.canvas, fontFamily: FONT[s.font] }}
    >
      <div
        className="mx-auto overflow-hidden"
        style={{
          maxWidth: width === "mobile" ? 360 : 560,
          background: PAPER.card,
          borderRadius: CARD_RADIUS[s.corners],
          boxShadow: "0 1px 2px rgb(10 10 10 / 0.06), 0 8px 24px -12px rgb(10 10 10 / 0.18)",
        }}
      >
        {s.header === "band" ? (
          <div className="px-7 py-5" style={{ background: s.accent, color: onAccent }}>
            <p className="text-[15px] font-semibold tracking-[-0.01em]">{businessName}</p>
          </div>
        ) : (
          <div className="px-7 pt-6" style={{ color: accentText }}>
            <p className="text-[15px] font-semibold tracking-[-0.01em]">{businessName}</p>
            <div className="mt-5 h-px" style={{ background: PAPER.line }} />
          </div>
        )}

        <div className="space-y-4 px-7 py-7">
          {t.blocks.map((b) => (
            <div
              key={b.id}
              data-block={b.id}
              onClick={onSelect ? () => onSelect(b.id) : undefined}
              className={cn(
                onSelect && "-mx-2.5 cursor-pointer rounded-lg px-2.5 py-1 outline-offset-2 transition-[outline-color] hover:outline hover:outline-1 hover:outline-[#9a9aa3]",
                selectedId === b.id && "outline outline-2 outline-[#6d28d9] hover:outline-2 hover:outline-[#6d28d9]",
              )}
            >
              <Block block={b} accent={s.accent} onAccent={onAccent} accentText={accentText} corners={s.corners} />
            </div>
          ))}
          {t.blocks.length === 0 ? (
            <p className="py-10 text-center text-sm" style={{ color: PAPER.muted }}>
              Add a block to start writing.
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5 px-7 pb-7 text-[11.5px] leading-relaxed" style={{ color: PAPER.muted }}>
          <div className="mb-4 h-px" style={{ background: PAPER.line }} />
          <p>{EMAIL_FOOTER.reason}</p>
          <p>{EMAIL_FOOTER.address}</p>
          <p>
            <span className="underline underline-offset-2">Unsubscribe</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function Block({
  block: b,
  accent,
  onAccent,
  accentText,
  corners,
}: {
  block: EmailBlock;
  accent: string;
  onAccent: string;
  accentText: string;
  corners: keyof typeof RADIUS;
}) {
  switch (b.kind) {
    case "heading":
      return (
        <p className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-balance" style={{ color: PAPER.ink }}>
          {fillSample(b.text)}
        </p>
      );
    case "text":
      return (
        <p className="whitespace-pre-line text-[15px] leading-[1.65]" style={{ color: PAPER.body }}>
          {fillSample(b.text)}
        </p>
      );
    case "button":
      return (
        <div className="py-1">
          <span
            className="inline-block px-6 py-3 text-[15px] font-semibold"
            style={{ background: accent, color: onAccent, borderRadius: RADIUS[corners] }}
          >
            {fillSample(b.label)}
          </span>
        </div>
      );
    case "booking":
      return (
        <div className="space-y-2.5 p-4 text-[14.5px]" style={{ background: PAPER.soft, borderRadius: corners === "sharp" ? 4 : 12, color: PAPER.ink }}>
          <p className="flex items-center gap-2.5 font-semibold">
            <CalendarBlankIcon aria-hidden className="size-[18px]" style={{ color: accentText }} />
            Cleaning with Dr. Castellanos
          </p>
          <p className="flex items-center gap-2.5">
            <ClockIcon aria-hidden className="size-[18px]" style={{ color: accentText }} />
            Thursday, September 24 at 9:40am
          </p>
          <p className="flex items-center gap-2.5">
            <MapPinIcon aria-hidden className="size-[18px]" style={{ color: accentText }} />
            1450 NE Purcell Blvd, Bend
          </p>
        </div>
      );
    case "stars":
      return (
        <div className="py-1 text-center">
          <p className="text-[15px] font-medium" style={{ color: PAPER.ink }}>
            {fillSample(b.prompt)}
          </p>
          <p role="img" className="mt-3 flex justify-center gap-1.5" aria-label="Five stars, each opens your review page">
            {Array.from({ length: 5 }, (_, i) => (
              <StarIcon key={i} aria-hidden weight="fill" className="size-9" style={{ color: accent }} />
            ))}
          </p>
        </div>
      );
    case "divider":
      return <div className="my-1 h-px" style={{ background: PAPER.line }} />;
    case "signoff":
      return (
        <p className="text-[15px] leading-[1.6]" style={{ color: PAPER.body }}>
          {fillSample(b.text)}
          <br />
          <span className="font-semibold" style={{ color: PAPER.ink }}>
            {fillSample(b.name)}
          </span>
        </p>
      );
  }
}

/** The inbox row above an email: who it is from, the subject, the grey preview line. */
export function InboxHeader({ businessName, subject, preheader }: { businessName: string; subject: string; preheader: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-rule bg-surface px-4 py-3">
      <span aria-hidden className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-panel text-xs font-semibold text-ink">
        {businessName
          .split(/\s+/)
          .slice(0, 2)
          .map((w) => w[0])
          .join("")}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-semibold text-ink">{businessName}</span>
          <span data-numeric className="shrink-0 font-mono text-2xs text-ink-muted">
            9:14am
          </span>
        </p>
        <p className="truncate text-sm text-ink">{fillSample(subject) || "No subject yet"}</p>
        <p className="truncate text-xs text-ink-muted">{fillSample(preheader)}</p>
      </div>
    </div>
  );
}
