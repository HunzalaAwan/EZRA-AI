import {
  ChatTextIcon,
  FacebookLogoIcon,
  GoogleLogoIcon,
  InstagramLogoIcon,
  MessengerLogoIcon,
  MicrosoftOutlookLogoIcon,
  MicrosoftTeamsLogoIcon,
  PaypalLogoIcon,
  PlugsConnectedIcon,
  SlackLogoIcon,
  SquareLogoIcon,
  StripeLogoIcon,
  WhatsappLogoIcon,
  type Icon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/**
 * An app's mark, as a solid tile in its brand colour.
 *
 * Where Phosphor ships the brand's own mark, the tile carries it. Everywhere
 * else it carries a short monogram, never a redrawn logo: icons here come from
 * one library and are never hand-drawn. The colour is the brand's, used as
 * identity, so it sits outside the semantic palette on purpose.
 *
 * Always decorative. The app's name is written next to it wherever it appears.
 */
interface Mark {
  color: string;
  glyph?: Icon;
  mono?: string;
}

const MARKS: Record<string, Mark> = {
  fareharbor: { color: "#1468b3", mono: "FH" },
  "ezra-pro": { color: "#6d28d9", mono: "EP" },
  "google-calendar": { color: "#1970e1", glyph: GoogleLogoIcon },
  outlook: { color: "#0f6cbd", glyph: MicrosoftOutlookLogoIcon },
  calendly: { color: "#006bff", mono: "C" },
  acuity: { color: "#1f2937", mono: "A" },
  curve: { color: "#00808b", mono: "CD" },
  dentrix: { color: "#1d4f91", mono: "Dx" },
  "open-dental": { color: "#2d6a3e", mono: "OD" },
  jane: { color: "#0e6f6b", mono: "J" },
  mindbody: { color: "#b8156b", mono: "MB" },
  vagaro: { color: "#3b2a8f", mono: "V" },
  servicetitan: { color: "#0c3f78", mono: "ST" },
  "housecall-pro": { color: "#1a56d6", mono: "HP" },
  jobber: { color: "#25603b", mono: "Jb" },
  clio: { color: "#0063c7", mono: "Cl" },
  hubspot: { color: "#c74928", mono: "HS" },
  salesforce: { color: "#0a7ab8", mono: "SF" },
  sms: { color: "#5b21b6", glyph: ChatTextIcon },
  slack: { color: "#4a154b", glyph: SlackLogoIcon },
  teams: { color: "#4b53bc", glyph: MicrosoftTeamsLogoIcon },
  whatsapp: { color: "#118447", glyph: WhatsappLogoIcon },
  messenger: { color: "#0866ff", glyph: MessengerLogoIcon },
  facebook: { color: "#0866ff", glyph: FacebookLogoIcon },
  instagram: { color: "#c1306b", glyph: InstagramLogoIcon },
  stripe: { color: "#635bff", glyph: StripeLogoIcon },
  square: { color: "#1c1c1c", glyph: SquareLogoIcon },
  paypal: { color: "#003087", glyph: PaypalLogoIcon },
  quickbooks: { color: "#29861b", mono: "QB" },
  zapier: { color: "#cb4611", mono: "Z" },
  make: { color: "#6a1fc2", mono: "M" },
  "google-sheets": { color: "#188038", mono: "GS" },
};

const SIZE = {
  sm: { box: "size-8 rounded-lg", glyph: "size-4.5", mono: "text-xs" },
  md: { box: "size-11 rounded-xl", glyph: "size-6", mono: "text-sm" },
  lg: { box: "size-14 rounded-2xl", glyph: "size-8", mono: "text-lg" },
} as const;

export function AppLogo({
  appKey,
  size = "md",
  className,
}: {
  appKey: string;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const mark = MARKS[appKey] ?? { color: "#3f3f46", glyph: PlugsConnectedIcon };
  const s = SIZE[size];
  const Glyph = mark.glyph;
  return (
    <span
      aria-hidden
      style={{ backgroundColor: mark.color }}
      className={cn(
        "flex shrink-0 items-center justify-center text-white shadow-[0_6px_14px_-8px_rgb(10_10_10/0.5)] ring-1 ring-inset ring-white/15",
        s.box,
        className,
      )}
    >
      {Glyph ? (
        <Glyph className={s.glyph} weight="regular" />
      ) : (
        <span className={cn("font-display font-semibold tracking-[-0.02em]", s.mono)}>{mark.mono}</span>
      )}
    </span>
  );
}
