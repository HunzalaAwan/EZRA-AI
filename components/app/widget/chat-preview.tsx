"use client";

import * as React from "react";
import {
  ChatCircleDotsIcon,
  ChatsCircleIcon,
  HandWavingIcon,
  HeadsetIcon,
  PaperPlaneRightIcon,
  PhoneIcon,
  RobotIcon,
  SmileyIcon,
  SparkleIcon,
  XIcon,
  type Icon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import type { LauncherIcon, WidgetSettings } from "@/lib/api/types";
import { FONT, LAUNCHER_PX, RADIUS, WIDGET_THEME, initials, inkOn } from "@/lib/widget";
import { cn } from "@/lib/utils";

/**
 * The widget exactly as a visitor meets it: the launcher in the corner, the
 * greeting that nudges after a few seconds, and the chat panel it opens. It is
 * a working preview, not a picture: the launcher opens and closes, quick
 * replies send, and typed messages get an answer, so the owner can feel it.
 *
 * Every colour comes from the settings. The text on the brand colour is
 * picked for contrast, so no choice of accent produces an unreadable button.
 */

export const LAUNCHER_ICONS: Record<Exclude<LauncherIcon, "initials" | "logo">, { label: string; icon: Icon }> = {
  chat: { label: "Chat bubble", icon: ChatCircleDotsIcon },
  chats: { label: "Two bubbles", icon: ChatsCircleIcon },
  headset: { label: "Headset", icon: HeadsetIcon },
  sparkle: { label: "Sparkle", icon: SparkleIcon },
  robot: { label: "Robot", icon: RobotIcon },
  smiley: { label: "Smiley", icon: SmileyIcon },
  wave: { label: "Waving hand", icon: HandWavingIcon },
};

/** What sits inside the launcher and the panel's avatar. */
export function LauncherGlyph({
  settings,
  logoUrl,
  size,
}: {
  settings: WidgetSettings;
  logoUrl: string | null;
  size: number;
}) {
  const kind = settings.launcher.icon;
  if (kind === "logo" && logoUrl) {
    // An object URL of the owner's own upload, so next/image has nothing to optimise.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt="" className="size-full rounded-[inherit] object-cover" />;
  }
  if (kind === "initials" || kind === "logo") {
    return (
      <span style={{ fontSize: size * 0.36 }} className="font-semibold tracking-[-0.02em]">
        {initials(settings.assistantName)}
      </span>
    );
  }
  const G = LAUNCHER_ICONS[kind].icon;
  return <G style={{ width: size * 0.46, height: size * 0.46 }} />;
}

interface Msg {
  id: number;
  from: "bot" | "visitor";
  text: string;
  slots?: string[];
}

const SLOTS = ["Thu 9:40", "Thu 2:20", "Fri 11:00"];

function replyTo(text: string): Omit<Msg, "id"> {
  const t = text.toLowerCase();
  if (t.includes("insurance"))
    return { from: "bot", text: "We work with most PPO plans, including Delta Dental and MetLife. Which one are you on?" };
  if (t.includes("hour") || t.includes("open"))
    return { from: "bot", text: "We are open 7:30 to 5 on weekdays, and 8 to 1 on Saturdays at the Bend office." };
  if (t.includes("tooth") || t.includes("pain") || t.includes("ache"))
    return { from: "bot", text: "I'm sorry, that sounds sore. I can get you in today. Here is what is open:", slots: ["Today 3:40", "Today 4:20"] };
  return { from: "bot", text: "Happy to help. Here are the next openings. Tap one and I'll hold it for you:", slots: SLOTS };
}

export function ChatPreview({
  settings: s,
  logoUrl,
  device,
  dark,
  replayKey,
  onCall,
}: {
  settings: WidgetSettings;
  logoUrl: string | null;
  device: "desktop" | "phone";
  /** Resolved theme for "auto". */
  dark: boolean;
  /** Changing it replays the greeting from closed. */
  replayKey: number;
  onCall: () => void;
}) {
  const t = WIDGET_THEME[s.mode === "dark" || (s.mode === "auto" && dark) ? "dark" : "light"];
  const ink = inkOn(s.accent);
  const r = RADIUS[s.corners];
  const px = device === "phone" ? Math.min(LAUNCHER_PX[s.launcher.size], 56) : LAUNCHER_PX[s.launcher.size];
  const left = s.launcher.position === "left";

  const [open, setOpen] = React.useState(false);
  const [nudge, setNudge] = React.useState(false);
  const [msgs, setMsgs] = React.useState<Msg[]>([]);
  const [draft, setDraft] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const [booked, setBooked] = React.useState<string | null>(null);
  const seq = React.useRef(0);
  const body = React.useRef<HTMLDivElement>(null);
  const timers = React.useRef<number[]>([]);

  // Replay from closed whenever asked, and show the greeting after its delay.
  React.useEffect(() => {
    setOpen(false);
    setNudge(false);
    setMsgs([]);
    setBooked(null);
    if (!s.greeting.enabled || (device === "phone" && !s.greeting.onPhones)) return;
    const id = window.setTimeout(() => setNudge(true), Math.min(s.greeting.delaySeconds, 3) * 1000 + 400);
    return () => window.clearTimeout(id);
  }, [replayKey, device, s.greeting.enabled, s.greeting.onPhones, s.greeting.delaySeconds]);

  React.useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  React.useEffect(() => {
    body.current?.scrollTo({ top: body.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing, booked]);

  function send(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setMsgs((m) => [...m, { id: ++seq.current, from: "visitor", text: clean }]);
    setDraft("");
    setTyping(true);
    timers.current.push(
      window.setTimeout(() => {
        setTyping(false);
        setMsgs((m) => [...m, { id: ++seq.current, ...replyTo(clean) }]);
      }, 900),
    );
  }

  const motionClass =
    s.launcher.motion === "bounce"
      ? "animate-nudge-bounce"
      : s.launcher.motion === "wiggle"
        ? "animate-nudge-wiggle"
        : "";

  const launcher = (
    <div className={cn("absolute bottom-4 z-20 flex flex-col gap-2", left ? "left-4 items-start" : "right-4 items-end")}>
      <AnimatePresence>
        {nudge && !open ? (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ background: t.bg, color: t.ink, borderRadius: r, borderColor: t.line }}
            className="relative max-w-[15rem] border p-3 pr-8 text-[13px] leading-snug shadow-[0_14px_34px_-14px_rgb(0_0_0/0.35)]"
          >
            <button
              type="button"
              aria-label="Dismiss greeting"
              onClick={() => setNudge(false)}
              style={{ color: t.muted }}
              className="absolute right-1.5 top-1.5 flex size-6 cursor-pointer items-center justify-center rounded-full"
            >
              <XIcon aria-hidden className="size-3.5" />
            </button>
            {s.greeting.text}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setNudge(false);
        }}
        aria-label={open ? "Close chat" : "Open chat"}
        aria-expanded={open}
        style={{
          background: s.accent,
          color: ink,
          height: px,
          minWidth: px,
          borderRadius: s.launcher.label && !open ? 999 : s.corners === "sharp" ? 14 : 999,
        }}
        className={cn(
          "relative flex cursor-pointer items-center justify-center gap-2 shadow-[0_12px_28px_-10px_rgb(0_0_0/0.5)] transition-transform hover:scale-105 active:scale-95 motion-reduce:animate-none",
          s.launcher.label && !open ? "px-4" : "",
          !open && motionClass,
        )}
      >
        {s.launcher.motion === "pulse" && !open ? (
          <span
            aria-hidden
            style={{ borderColor: s.accent, borderRadius: "inherit" }}
            className="animate-halo absolute inset-0 border-2 motion-reduce:hidden"
          />
        ) : null}
        <span
          className="flex items-center justify-center overflow-hidden"
          style={{ width: px * 0.72, height: px * 0.72, borderRadius: "inherit" }}
        >
          {open ? <XIcon style={{ width: px * 0.4, height: px * 0.4 }} /> : <LauncherGlyph settings={s} logoUrl={logoUrl} size={px} />}
        </span>
        {s.launcher.label && !open ? (
          <span className="whitespace-nowrap pr-1 text-sm font-semibold" style={{ fontFamily: FONT[s.font] }}>
            {s.launcher.label}
          </span>
        ) : null}
      </button>
    </div>
  );

  const panel = (
    <AnimatePresence>
      {open ? (
        <motion.section
          aria-label={`Chat with ${s.assistantName}`}
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          style={{
            background: t.bg,
            color: t.ink,
            fontFamily: FONT[s.font],
            borderRadius: device === "phone" ? 0 : r,
            borderColor: t.line,
            transformOrigin: left ? "bottom left" : "bottom right",
            bottom: device === "phone" ? 0 : px + 28,
          }}
          className={cn(
            "absolute z-30 flex flex-col overflow-hidden",
            device === "phone"
              ? "inset-x-0 top-0"
              : cn("h-[27rem] w-[21rem] max-w-[calc(100%-2rem)] border shadow-[0_24px_60px_-20px_rgb(0_0_0/0.45)]", left ? "left-4" : "right-4"),
          )}
        >
          {/* Header in the brand colour. */}
          <header style={{ background: s.accent, color: ink }} className="flex shrink-0 items-center gap-3 px-4 py-3.5">
            <span
              style={{ background: ink === "#ffffff" ? "rgb(255 255 255 / 0.18)" : "rgb(0 0 0 / 0.1)", borderRadius: r > 10 ? 999 : 10 }}
              className="flex size-10 shrink-0 items-center justify-center overflow-hidden"
            >
              <LauncherGlyph settings={s} logoUrl={logoUrl} size={40} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold leading-tight">{s.assistantName || "Assistant"}</span>
              <span className="flex items-center gap-1.5 truncate text-xs opacity-90">
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-[#4ade80]" />
                {s.subtitle || "Online"}
              </span>
            </span>
            {s.showCallButton ? (
              <button
                type="button"
                onClick={onCall}
                aria-label="Call instead"
                style={{ background: ink === "#ffffff" ? "rgb(255 255 255 / 0.18)" : "rgb(0 0 0 / 0.1)" }}
                className="flex size-9 cursor-pointer items-center justify-center rounded-full transition-opacity hover:opacity-80"
              >
                <PhoneIcon aria-hidden className="size-4.5" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="flex size-9 cursor-pointer items-center justify-center rounded-full transition-opacity hover:opacity-80"
            >
              <XIcon aria-hidden className="size-4.5" />
            </button>
          </header>

          {/* Thread. */}
          <div ref={body} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3.5 py-4" style={{ background: t.surface }}>
            <Bubble from="bot" r={r} t={t} accent={s.accent} ink={ink}>
              {s.welcome}
            </Bubble>
            {msgs.length === 0 && s.quickReplies.filter(Boolean).length ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {s.quickReplies.filter(Boolean).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    style={{ borderColor: s.accent, color: t.ink, borderRadius: Math.min(r, 999), background: t.bg }}
                    className="cursor-pointer border px-3 py-1.5 text-[13px] font-medium transition-transform hover:-translate-y-px"
                  >
                    {q}
                  </button>
                ))}
              </div>
            ) : null}
            {msgs.map((m) => (
              <React.Fragment key={m.id}>
                <Bubble from={m.from} r={r} t={t} accent={s.accent} ink={ink}>
                  {m.text}
                </Bubble>
                {m.slots && !booked ? (
                  <div className="flex flex-wrap gap-1.5">
                    {m.slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setBooked(slot)}
                        style={{ background: s.accent, color: ink, borderRadius: Math.min(r, 999) }}
                        className="cursor-pointer px-3 py-1.5 font-mono text-xs font-semibold transition-transform hover:-translate-y-px"
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : null}
              </React.Fragment>
            ))}
            {typing ? (
              <div style={{ background: t.bg, borderRadius: r, borderColor: t.line }} className="flex w-fit gap-1 border px-3 py-2.5">
                {[0, 1, 2].map((d) => (
                  <motion.span
                    key={d}
                    style={{ background: t.muted }}
                    className="size-1.5 rounded-full"
                    animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }}
                  />
                ))}
              </div>
            ) : null}
            {booked ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: t.bg, borderRadius: r, borderColor: s.accent }}
                className="border-2 p-3 text-[13px]"
              >
                <span className="block font-semibold">Booked for {booked}</span>
                <span style={{ color: t.muted }}>A confirmation is on its way by text.</span>
              </motion.div>
            ) : null}
          </div>

          {/* Composer. */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
            style={{ borderColor: t.line, background: t.bg }}
            className="flex shrink-0 items-center gap-2 border-t p-2.5"
          >
            <label className="sr-only" htmlFor={`widget-input-${device}`}>
              Message
            </label>
            <input
              id={`widget-input-${device}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={s.placeholder}
              // The placeholder and focus ring follow the widget's theme, not the app's.
              style={
                {
                  background: t.surface,
                  color: t.ink,
                  borderRadius: Math.min(r, 999),
                  "--ph": t.muted,
                  "--tw-ring-color": s.accent,
                } as React.CSSProperties
              }
              className="min-w-0 flex-1 px-3.5 py-2.5 text-[13px] outline-none placeholder:text-[var(--ph)] focus-visible:ring-2"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!draft.trim()}
              style={{ background: s.accent, color: ink }}
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              <PaperPlaneRightIcon aria-hidden weight="fill" className="size-4" />
            </button>
          </form>
          {s.showBranding ? (
            <p style={{ color: t.muted, background: t.bg }} className="shrink-0 pb-2 text-center text-[11px]">
              Answered by EZRA
            </p>
          ) : null}
        </motion.section>
      ) : null}
    </AnimatePresence>
  );

  return (
    <>
      {panel}
      {device === "phone" && open ? null : launcher}
    </>
  );
}

function Bubble({
  from,
  children,
  r,
  t,
  accent,
  ink,
}: {
  from: "bot" | "visitor";
  children: React.ReactNode;
  r: number;
  t: (typeof WIDGET_THEME)[keyof typeof WIDGET_THEME];
  accent: string;
  ink: string;
}) {
  const visitor = from === "visitor";
  return (
    <motion.p
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={
        visitor
          ? { background: accent, color: ink, borderRadius: r, borderBottomRightRadius: Math.min(r, 6) }
          : { background: t.bg, color: t.ink, borderRadius: r, borderBottomLeftRadius: Math.min(r, 6), borderColor: t.line }
      }
      className={cn("w-fit max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed", visitor ? "ml-auto" : "border")}
    >
      {children}
    </motion.p>
  );
}
