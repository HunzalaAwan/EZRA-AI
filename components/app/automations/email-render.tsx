import * as React from "react";
import {
  CalendarBlankIcon,
  ClockIcon,
  FacebookLogoIcon,
  GoogleLogoIcon,
  ImageIcon,
  InstagramLogoIcon,
  MapPinIcon,
  PhoneIcon,
  StarIcon,
  TiktokLogoIcon,
  XLogoIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { EmailBlock, EmailButton, EmailStyle, EmailTemplate, SocialNetwork } from "@/lib/api/types";
import { BUSINESS, EMAIL_FOOTER, SOCIAL, fillSample } from "@/lib/email";
import { FONT, contrast, inkOn } from "@/lib/widget";
import { cn } from "@/lib/utils";

/**
 * An email as the customer sees it in their inbox.
 *
 * It wears the business's colour, not EZRA's, so its colours are data: the
 * accent comes from the template and every colour placed on it is chosen for
 * contrast. The page around it is always light, because that is what nearly
 * every inbox shows, in either theme of this app.
 */

const PAPER = { canvas: "#f1f1f4", card: "#ffffff", ink: "#0a0a0a", body: "#3a3a42", muted: "#62626b", line: "#e4e4e9", soft: "#f4f4f6" };
const RADIUS = { sharp: 4, soft: 10, round: 999 } as const;
const CARD_RADIUS = { sharp: 4, soft: 14, round: 20 } as const;
const BOX_RADIUS = { sharp: 4, soft: 12, round: 16 } as const;
const SPACE = { s: 8, m: 20, l: 40 } as const;

export const SOCIAL_ICON: Record<SocialNetwork, Icon> = {
  facebook: FacebookLogoIcon,
  instagram: InstagramLogoIcon,
  google: GoogleLogoIcon,
  youtube: YoutubeLogoIcon,
  tiktok: TiktokLogoIcon,
  x: XLogoIcon,
};

/** Blend a colour toward white. Used for tints that must stay readable. */
function tint(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) * amount + 255 * (1 - amount));
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, "0")).join("")}`;
}

/** **Bold** is the one piece of formatting a paragraph accepts. */
function Rich({ text, strong }: { text: string; strong: string }) {
  const parts = fillSample(text).split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold" style={{ color: strong }}>
            {p}
          </strong>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </>
  );
}

type Ctx = {
  s: EmailStyle;
  onAccent: string;
  /** The accent as text on white only when it is readable there. */
  accentText: string;
  imagesOff: boolean;
};

export function EmailRender({
  template: t,
  businessName,
  width = "desktop",
  selectedId,
  onSelect,
  tools,
  imagesOff = false,
  className,
}: {
  template: Pick<EmailTemplate, "blocks" | "style">;
  businessName: string;
  width?: "desktop" | "mobile";
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Controls drawn on the selected block, in the editor. */
  tools?: (id: string) => React.ReactNode;
  imagesOff?: boolean;
  className?: string;
}) {
  const s = t.style;
  const ctx: Ctx = {
    s,
    onAccent: inkOn(s.accent),
    accentText: contrast(s.accent, PAPER.card) >= 4.5 ? s.accent : PAPER.ink,
    imagesOff,
  };
  const backdrop = s.backdrop === "white" ? PAPER.card : s.backdrop === "tint" ? tint(s.accent, 0.1) : PAPER.canvas;
  const monogram = businessName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <div className={cn("w-full px-3 py-5 sm:px-5", className)} style={{ background: backdrop, fontFamily: FONT[s.font] }}>
      <div
        className="mx-auto overflow-hidden"
        style={{
          maxWidth: width === "mobile" ? 360 : 560,
          background: PAPER.card,
          borderRadius: CARD_RADIUS[s.corners],
          boxShadow:
            s.backdrop === "white"
              ? `0 0 0 1px ${PAPER.line}`
              : "0 1px 2px rgb(10 10 10 / 0.06), 0 8px 24px -12px rgb(10 10 10 / 0.18)",
        }}
      >
        {s.header === "band" ? (
          <div className="flex items-center gap-3 px-7 py-5" style={{ background: s.accent, color: ctx.onAccent }}>
            {s.logo && !imagesOff ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.logo} alt="" className="h-8 w-auto max-w-32 rounded object-contain" />
            ) : null}
            <p className="text-[15px] font-semibold tracking-[-0.01em]">{businessName}</p>
          </div>
        ) : s.header === "logo" ? (
          <div className="flex flex-col items-center px-7 pt-8 text-center">
            {s.logo && !imagesOff ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.logo} alt={businessName} className="h-12 w-auto max-w-44 object-contain" />
            ) : (
              <span
                aria-hidden
                className="flex size-12 items-center justify-center text-base font-bold tracking-[-0.02em]"
                style={{ background: s.accent, color: ctx.onAccent, borderRadius: s.corners === "round" ? 999 : s.corners === "soft" ? 12 : 4 }}
              >
                {monogram}
              </span>
            )}
            <p className="mt-2.5 text-[14px] font-semibold tracking-[-0.01em]" style={{ color: PAPER.ink }}>
              {businessName}
            </p>
            <div className="mt-6 h-px w-full" style={{ background: PAPER.line }} />
          </div>
        ) : (
          <div className="px-7 pt-6" style={{ color: ctx.accentText }}>
            <p className="text-[15px] font-semibold tracking-[-0.01em]">{businessName}</p>
            <div className="mt-5 h-px" style={{ background: PAPER.line }} />
          </div>
        )}

        <div className="space-y-4 px-7 py-7">
          {t.blocks.map((b) => {
            const selected = selectedId === b.id;
            return (
              <div
                key={b.id}
                data-block={b.id}
                onClick={onSelect ? () => onSelect(b.id) : undefined}
                className={cn(
                  "relative min-w-0 [overflow-wrap:anywhere]",
                  onSelect &&
                    "-mx-2.5 cursor-pointer rounded-lg px-2.5 py-1 outline-offset-2 transition-[outline-color] hover:outline hover:outline-1 hover:outline-[#9a9aa3]",
                  selected && "outline outline-2 outline-[#6d28d9] hover:outline-2 hover:outline-[#6d28d9]",
                )}
              >
                <Block block={b} ctx={ctx} />
                {selected && tools ? (
                  <div className="absolute -top-4 right-1 z-10" onClick={(e) => e.stopPropagation()}>
                    {tools(b.id)}
                  </div>
                ) : null}
              </div>
            );
          })}
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

function ButtonFace({ b, variant, ctx, full }: { b: EmailButton; variant: "solid" | "outline" | "link"; ctx: Ctx; full?: boolean }) {
  const { s } = ctx;
  if (variant === "link")
    return (
      <span className="inline-block py-3 text-[15px] font-semibold underline decoration-2 underline-offset-4" style={{ color: ctx.accentText }}>
        {fillSample(b.label)}
      </span>
    );
  return (
    <span
      className={cn("inline-block px-6 py-3 text-center text-[15px] font-semibold", full && "block w-full")}
      style={
        variant === "solid"
          ? { background: s.accent, color: ctx.onAccent, borderRadius: RADIUS[s.corners] }
          : { boxShadow: `inset 0 0 0 1.5px ${ctx.accentText}`, color: ctx.accentText, borderRadius: RADIUS[s.corners] }
      }
    >
      {fillSample(b.label)}
    </span>
  );
}

function Block({ block: b, ctx }: { block: EmailBlock; ctx: Ctx }) {
  const { s } = ctx;
  switch (b.kind) {
    case "heading":
      return (
        <p
          className={cn(
            "font-semibold leading-tight tracking-[-0.02em] text-balance",
            b.size === "medium" ? "text-[18px]" : "text-[24px]",
            b.align === "center" && "text-center",
          )}
          style={{ color: PAPER.ink }}
        >
          <Rich text={b.text} strong={PAPER.ink} />
        </p>
      );
    case "text":
      return (
        <p className={cn("whitespace-pre-line text-[15px] leading-[1.65]", b.align === "center" && "text-center")} style={{ color: PAPER.body }}>
          <Rich text={b.text} strong={PAPER.ink} />
        </p>
      );
    case "callout":
      return (
        <p
          className="whitespace-pre-line px-5 py-4 text-[14.5px] leading-[1.6]"
          style={{
            background: b.tone === "grey" ? PAPER.soft : tint(s.accent, 0.1),
            color: PAPER.ink,
            borderRadius: BOX_RADIUS[s.corners],
          }}
        >
          <Rich text={b.text} strong={PAPER.ink} />
        </p>
      );
    case "image": {
      const size = b.size ?? "full";
      const radius = size === "full" ? 0 : BOX_RADIUS[s.corners];
      const frame = cn(size === "full" && "-mx-7", size === "small" && "mx-auto w-1/2");
      if (!b.src || ctx.imagesOff)
        return (
          <figure className={frame}>
            <div
              className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 px-6 text-center text-[13px]"
              style={{ background: PAPER.soft, color: PAPER.muted, borderRadius: radius, boxShadow: `inset 0 0 0 1px ${PAPER.line}` }}
            >
              <ImageIcon aria-hidden className="size-6" />
              {b.src ? b.alt || "A picture with no description" : "Choose a picture"}
            </div>
          </figure>
        );
      return (
        <figure className={frame}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.src} alt={b.alt} className="block aspect-[16/9] w-full object-cover" style={{ borderRadius: radius }} />
          {b.caption ? (
            <figcaption className={cn("mt-2 text-[12.5px]", size === "full" && "px-7")} style={{ color: PAPER.muted }}>
              {fillSample(b.caption)}
            </figcaption>
          ) : null}
        </figure>
      );
    }
    case "button": {
      const variant = b.variant ?? "solid";
      const align = b.align ?? "left";
      const full = align === "full";
      return (
        <div className={cn("flex flex-wrap items-center gap-3 py-1", align === "center" && "justify-center", full && "flex-col items-stretch")}>
          <ButtonFace b={b} variant={variant} ctx={ctx} full={full} />
          {b.second ? <ButtonFace b={b.second} variant={variant === "link" ? "link" : variant === "outline" ? "link" : "outline"} ctx={ctx} full={full} /> : null}
        </div>
      );
    }
    case "booking":
      return (
        <div className="space-y-2.5 p-4 text-[14.5px]" style={{ background: PAPER.soft, borderRadius: BOX_RADIUS[s.corners], color: PAPER.ink }}>
          <p className="flex items-center gap-2.5 font-semibold">
            <CalendarBlankIcon aria-hidden className="size-[18px] shrink-0" style={{ color: ctx.accentText }} />
            Cleaning with Dr. Castellanos
          </p>
          <p className="flex items-center gap-2.5">
            <ClockIcon aria-hidden className="size-[18px] shrink-0" style={{ color: ctx.accentText }} />
            Thursday, September 24 at 9:40am
          </p>
          <p className="flex items-center gap-2.5">
            <MapPinIcon aria-hidden className="size-[18px] shrink-0" style={{ color: ctx.accentText }} />
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
              <StarIcon key={i} aria-hidden weight="fill" className="size-9" style={{ color: s.accent }} />
            ))}
          </p>
        </div>
      );
    case "contact":
      return (
        <div className="space-y-2 text-[14px] leading-snug" style={{ color: PAPER.body }}>
          <p className="flex items-start gap-2.5">
            <PhoneIcon aria-hidden className="mt-px size-[17px] shrink-0" style={{ color: ctx.accentText }} />
            <span className="font-semibold" style={{ color: PAPER.ink }}>
              {BUSINESS.phone}
            </span>
          </p>
          <p className="flex items-start gap-2.5">
            <MapPinIcon aria-hidden className="mt-px size-[17px] shrink-0" style={{ color: ctx.accentText }} />
            <span>
              {BUSINESS.address}
              {b.showMap !== false ? (
                <>
                  {" "}
                  <span className="font-semibold underline underline-offset-2" style={{ color: ctx.accentText }}>
                    Directions
                  </span>
                </>
              ) : null}
            </span>
          </p>
          {b.showHours !== false ? (
            <p className="flex items-start gap-2.5">
              <ClockIcon aria-hidden className="mt-px size-[17px] shrink-0" style={{ color: ctx.accentText }} />
              {BUSINESS.hours}
            </p>
          ) : null}
        </div>
      );
    case "social":
      return (
        <p className="flex justify-center gap-2.5 py-1">
          {b.links.map((l, i) => {
            const SIcon = SOCIAL_ICON[l.network];
            return (
              <span
                key={`${l.network}-${i}`}
                role="img"
                aria-label={SOCIAL[l.network].label}
                className="flex size-9 items-center justify-center rounded-full"
                style={{ background: PAPER.soft, color: PAPER.ink }}
              >
                <SIcon aria-hidden className="size-[18px]" />
              </span>
            );
          })}
        </p>
      );
    case "divider":
      return <div className="my-1 h-px" style={{ background: PAPER.line }} />;
    case "spacer":
      return <div aria-hidden style={{ height: SPACE[b.size ?? "m"] }} />;
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
export function InboxHeader({
  businessName,
  subject,
  preheader,
  fromName,
  replyTo,
}: {
  businessName: string;
  subject: string;
  preheader: string;
  fromName?: string;
  replyTo?: string;
}) {
  const from = fromName?.trim() || businessName;
  return (
    <div className="flex items-start gap-3 border-b border-rule bg-surface px-4 py-3">
      <span aria-hidden className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-panel text-xs font-semibold text-ink">
        {from
          .split(/\s+/)
          .slice(0, 2)
          .map((w) => w[0])
          .join("")}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-semibold text-ink">
            {from}
            {replyTo ? <span className="ml-1.5 font-normal text-ink-muted">{replyTo}</span> : null}
          </span>
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
