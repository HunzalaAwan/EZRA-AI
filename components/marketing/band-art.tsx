"use client";

import * as React from "react";
import {
  ArrowsLeftRightIcon,
  BellIcon,
  BookOpenIcon,
  CalendarCheckIcon,
  ChartBarIcon,
  ChatTextIcon,
  CheckCircleIcon,
  ClockIcon,
  FileTextIcon,
  GlobeIcon,
  HeadsetIcon,
  MicrophoneIcon,
  PaperPlaneRightIcon,
  PhoneCallIcon,
  PhoneIncomingIcon,
  RobotIcon,
  SparkleIcon,
  SunIcon,
  TrendUpIcon,
  UserCircleIcon,
  type Icon,
} from "@phosphor-icons/react";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useSpring,
} from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Illustrations for the three homepage bands, in place of product
 * screenshots.
 *
 * Each draws the idea of its band, not the app: a call being picked up, a
 * week with a slot filling in, a ring order handing a caller to a person.
 * None imitates a dashboard screen; DESIGN.md bans fake product UI, and these
 * are pictures of what happens, not stand-ins for screens.
 *
 * Every loop plays only while its band is on screen and lands on a complete,
 * readable final state. Reduced motion is read inside an effect, never during
 * render, and a reader who asked for stillness sees that final state.
 *
 * The cards are white on the deep band grounds with near-black type, so their
 * contrast does not depend on the theme.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

/** Steps 0..last, advancing while in view; held at `last` under reduced motion. */
function useSteps(ref: React.RefObject<Element | null>, last: number, ms: number, hold = 3) {
  const inView = useInView(ref, { amount: 0.35 });
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(last);
      return;
    }
    if (!inView) return;
    const id = window.setInterval(() => setStep((s) => (s >= last + hold ? 0 : s + 1)), ms);
    return () => window.clearInterval(id);
  }, [inView, last, ms, hold]);
  return Math.min(step, last);
}

/**
 * The stage each illustration sits on. Three layers make a large panel feel
 * occupied without adding words:
 *
 *   An ambience behind everything, one per band: sound rings for a call, a
 *   perspective floor for a calendar, flowing links for a handoff.
 *   A few glassy icon bubbles drifting at the edges. Icons only, never text,
 *   so the panel fills up without getting wordy.
 *   The content itself on a 3D plane that floats and leans toward the
 *   cursor, so it reads as an object in space rather than a sticker.
 *
 * All of it is aria-hidden decoration. The pointer tilt is a spring on motion
 * values, so it never re-renders React; MotionConfig at the root strips the
 * transforms for reduced motion, and the CSS loops carry motion-reduce.
 */
type Ambience = "waves" | "floor" | "links";

const FLOAT_SPOTS = [
  "left-[7%] top-[12%]",
  "right-[8%] top-[16%]",
  "left-[10%] bottom-[14%]",
  "right-[7%] bottom-[12%]",
];

const END_SPOTS = [
  "left-[7%] top-[12%]",
  "left-[10%] bottom-[14%]",
  "right-[7%] bottom-[10%]",
  "left-[7%] top-[12%]",
];

function Stage({
  children,
  className,
  ambience,
  icons,
  tint,
  align = "center",
}: {
  children: React.ReactNode;
  className?: string;
  ambience: Ambience;
  icons: Icon[];
  /** The band's pale ink, used for icons and light. */
  tint: string;
  /** "end" leaves open space on the left, for the handoff's flowing links. */
  align?: "center" | "end";
}) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 120, damping: 18 });
  const rotateY = useSpring(ry, { stiffness: 120, damping: 18 });

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 14);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 10);
  }

  return (
    <div
      aria-hidden
      onPointerMove={onMove}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      style={{ "--tint": tint, perspective: 1200 } as React.CSSProperties}
      className={cn(
        "relative flex h-full min-h-[26rem] w-full items-center justify-center overflow-hidden rounded-[1.75rem] bg-white/[0.06] p-6 ring-1 ring-white/10 sm:p-10",
        className,
      )}
    >
      <AmbienceLayer kind={ambience} />

      {icons.map((I, i) => (
        <motion.span
          key={i}
          className={cn(
            "absolute hidden size-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-[var(--tint)] shadow-[0_14px_30px_-14px_rgb(0_0_0/0.6)] backdrop-blur-md sm:flex",
            // With the content pushed right, the top-right corner is taken,
            // so the icons keep to the open side and the bottom corner.
            (align === "end" ? END_SPOTS : FLOAT_SPOTS)[i % FLOAT_SPOTS.length],
          )}
          animate={{ y: [0, -10, 0], rotate: [0, i % 2 ? 6 : -6, 0] }}
          transition={{ duration: 5 + i * 0.9, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
        >
          <I className="size-6" weight="regular" />
        </motion.span>
      ))}

      <motion.div
        className={cn(
          "relative z-10 flex w-full [transform-style:preserve-3d]",
          align === "end" ? "justify-center sm:justify-end sm:pl-24" : "justify-center",
        )}
        style={{ rotateX, rotateY }}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function AmbienceLayer({ kind }: { kind: Ambience }) {
  if (kind === "waves") {
    // Rings radiating from the centre, like a phone ringing out.
    return (
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 size-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--tint)] opacity-[0.10] blur-[90px]" />
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--tint)] motion-reduce:hidden"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 2.6], opacity: [0.45, 0] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: "easeOut", delay: i * 1.2 }}
          />
        ))}
      </div>
    );
  }
  if (kind === "floor") {
    // A perspective grid floor drifting toward the viewer, under a horizon glow.
    return (
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-[38%] h-40 bg-[var(--tint)] opacity-[0.12] blur-[70px]" />
        <div className="absolute inset-x-[-30%] bottom-[-25%] h-[70%] [perspective:500px]">
          <motion.div
            className="size-full origin-top [transform:rotateX(62deg)] bg-[linear-gradient(to_right,rgb(255_255_255/0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.10)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:linear-gradient(to_bottom,transparent,black_40%)]"
            animate={{ backgroundPositionY: ["0px", "56px"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>
    );
  }
  // Links: a caller node on the left, light flowing along curves into the list.
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute left-[2%] top-1/2 size-[22rem] -translate-y-1/2 rounded-full bg-[var(--tint)] opacity-[0.10] blur-[90px]" />
      <svg className="absolute inset-0 size-full" viewBox="0 0 600 400" preserveAspectRatio="none">
        {[
          "M50 200 C 150 200, 170 110, 250 110",
          "M50 200 C 150 200, 170 200, 250 200",
          "M50 200 C 150 200, 170 290, 250 290",
        ].map((d, i) => (
          <g key={i}>
            <path d={d} fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            <motion.path
              d={d}
              fill="none"
              stroke="var(--tint)"
              strokeWidth="2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              strokeDasharray="0.12 0.88"
              pathLength={1}
              animate={{ strokeDashoffset: [1, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
              className="motion-reduce:hidden"
            />
          </g>
        ))}
      </svg>
      <span className="absolute left-[3%] top-1/2 hidden size-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[var(--tint)] backdrop-blur-md sm:flex">
        <span className="animate-halo absolute inset-0 rounded-full border-2 border-[var(--tint)] motion-reduce:hidden" />
        <PhoneIncomingIcon className="size-6" />
      </span>
    </div>
  );
}

/* ----------------------------------------------------------------- answers */


/** 48 bars around the agent. Fixed heights, so server and client agree. */
const VOICE_RING = Array.from({ length: 48 }, (_, i) => 0.35 + 0.65 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)));

const CAPTIONS: { who: "Caller" | "EZRA"; text: string }[] = [
  { who: "Caller", text: "Do you have anything this week?" },
  { who: "EZRA", text: "Thursday at 9:40, or Friday at 2:20." },
  { who: "Caller", text: "Thursday, please." },
];

const RESULTS = [
  { label: "Answered in 1 ring", icon: PhoneCallIcon },
  { label: "Booked Thu 9:40", icon: CalendarCheckIcon },
  { label: "Confirmation texted", icon: ChatTextIcon },
];

/**
 * A call, drawn as a voice.
 *
 * The agent sits at the centre inside a ring of 48 bars. While the phone
 * rings they breathe slowly; once the call connects they move like speech,
 * violet into pink. One caption line under the disc carries what is being
 * said, one line at a time, so nothing stacks or overlaps. When the call
 * ends, that line gives way to the three things the call achieved.
 *
 * The earlier version stacked a call card and three bubbles; under the stage
 * tilt the bubbles slid beneath the card. One centred object cannot collide
 * with itself.
 */
export function AnswersArt() {
  const ref = React.useRef<HTMLDivElement>(null);
  // 0 ringing, 1..3 captions, 4..6 results.
  const step = useSteps(ref, 6, 1300);
  const live = step >= 1;
  const caption = CAPTIONS[Math.min(Math.max(step - 1, 0), CAPTIONS.length - 1)]!;
  const seconds = Math.max(0, step - 1) * 4 + (live ? 3 : 0);

  return (
    <div ref={ref} className="h-full w-full">
      <Stage ambience="waves" tint="#c4b5fd" icons={[]}>
        <div className="relative flex w-full max-w-[30rem] flex-col items-center">
          {/* Who is calling, and how long for. */}
          <div className="flex items-center gap-2.5 whitespace-nowrap rounded-full bg-white py-1.5 pl-1.5 pr-4 shadow-[0_14px_34px_-16px_rgb(0_0_0/0.6)]">
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-white transition-colors duration-500",
                live ? "bg-[#047857]" : "bg-[#6d28d9]",
              )}
            >
              {live ? <PhoneCallIcon className="size-4" /> : <PhoneIncomingIcon className="size-4" />}
            </span>
            <span className="font-mono text-[13px] font-semibold text-[#0a0a0a] sm:text-sm">(541) 410-2287</span>
            <span className="text-xs font-medium text-[#555553]">
              {live ? `Connected 0:${String(seconds).padStart(2, "0")}` : "Incoming call"}
            </span>
          </div>

          {/* The agent inside its voice ring. */}
          <div className="relative my-6 size-60 sm:size-64">
            {VOICE_RING.map((h, i) => (
              <span
                key={i}
                className="absolute left-1/2 top-1/2 h-1/2 w-[3px] -translate-x-1/2 origin-bottom"
                style={{ transform: `translate(-50%, -100%) rotate(${(i / VOICE_RING.length) * 360}deg)` }}
              >
                <motion.span
                  className="absolute left-0 top-0 block h-[34%] w-full origin-bottom rounded-full"
                  style={{
                    background: `linear-gradient(to top, #8b5cf6, ${i % 2 ? "#f5a6d8" : "#c4b5fd"})`,
                  }}
                  animate={
                    live
                      ? { scaleY: [0.25, h, 0.4, h * 0.75, 0.25], opacity: 1 }
                      : { scaleY: [0.18, 0.3, 0.18], opacity: 0.55 }
                  }
                  transition={{
                    duration: live ? 0.9 + (i % 6) * 0.12 : 2.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: live ? (i % 8) * 0.06 : (i / VOICE_RING.length) * 1.2,
                  }}
                />
              </span>
            ))}
            {/* Core. */}
            <span className="absolute inset-[24%] flex items-center justify-center rounded-full bg-[#140b2e] ring-1 ring-white/15 shadow-[0_0_60px_-6px_#8b5cf6]">
              {!live ? (
                <span className="animate-halo absolute inset-0 rounded-full border-2 border-[#c4b5fd] motion-reduce:hidden" />
              ) : null}
              <span className="flex flex-col items-center gap-1">
                <RobotIcon className="size-9 text-[#e2d6ff]" />
                <span className="text-2xs font-semibold uppercase tracking-[0.16em] text-[#e2d6ff]">EZRA</span>
              </span>
            </span>
          </div>

          {/* One caption line while the call runs; what it achieved once it ends. */}
          <div className="flex h-24 w-full max-w-[30rem] items-start justify-center text-center sm:h-16">
            <AnimatePresence mode="wait" initial={false}>
              {step >= 4 ? (
                <motion.ul
                  key="results"
                  exit={{ opacity: 0 }}
                  className="flex flex-wrap items-center justify-center gap-2"
                >
                  {RESULTS.map((r, i) => {
                    const RIcon = r.icon;
                    return (
                      <motion.li
                        key={r.label}
                        initial={{ opacity: 0, scale: 0.7, y: 8 }}
                        animate={step >= 4 + i ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.7, y: 8 }}
                        transition={{ type: "spring", stiffness: 380, damping: 22 }}
                        className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white py-1 pl-1 pr-3 text-xs font-semibold text-[#0a0a0a] shadow-[0_12px_28px_-14px_rgb(0_0_0/0.7)]"
                      >
                        <span className="flex size-6 items-center justify-center rounded-full bg-[#047857] text-white">
                          <RIcon className="size-3.5" />
                        </span>
                        {r.label}
                      </motion.li>
                    );
                  })}
                </motion.ul>
              ) : live ? (
                <motion.p
                  key={caption.text}
                  initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
                  animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.7, ease: EASE }}
                  className="max-w-[22rem] text-base font-medium leading-snug text-white"
                >
                  <span className={caption.who === "EZRA" ? "text-[#e2d6ff]" : "text-[#ffd2c2]"}>
                    {caption.who}:{" "}
                  </span>
                  {caption.text}
                </motion.p>
              ) : (
                <motion.p key="ringing" className="text-sm text-white/80" exit={{ opacity: 0 }}>
                  Ringing
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Stage>
    </div>
  );
}

/* ------------------------------------------------------------------- books */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
/** Which slots are already taken, by day then row. Fixed, so it never jumps. */
const TAKEN = [
  [1, 0, 1, 1],
  [0, 1, 1, 0],
  [1, 1, 0, 1],
  [1, 0, 1, 1],
  [0, 1, 1, 1],
];
const TIMES = ["8:30", "9:40", "11:00", "2:20"];

export function BooksArt() {
  const ref = React.useRef<HTMLDivElement>(null);
  const step = useSteps(ref, 3, 1200);
  // Thursday at 9:40 is the open slot that gets booked.
  const booked = step >= 1;
  const texted = step >= 2;

  return (
    <div ref={ref} className="h-full w-full">
      <Stage ambience="floor" tint="#b9c6ff" icons={[CalendarCheckIcon, BellIcon, CheckCircleIcon, ClockIcon]}>
        <div className="w-full max-w-[31rem]">
          <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_24px_60px_-24px_rgb(0_0_0/0.6)]">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#0a0a0a]">
              <CalendarCheckIcon className="size-4 text-[#1d4ed8]" />
              This week
            </p>
            <div className="mt-4 grid grid-cols-[2.75rem_repeat(5,minmax(0,1fr))] gap-1.5">
              <span />
              {DAYS.map((d) => (
                <span key={d} className="text-center text-2xs font-semibold uppercase tracking-[0.1em] text-[#555553]">
                  {d}
                </span>
              ))}
              {TIMES.map((t, row) => (
                <React.Fragment key={t}>
                  <span className="self-center font-mono text-2xs text-[#555553]">{t}</span>
                  {DAYS.map((d, col) => {
                    const target = col === 3 && row === 1;
                    const taken = TAKEN[col]?.[row] === 1;
                    return (
                      <motion.span
                        key={d + t}
                        initial={false}
                        animate={target && booked ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                        transition={{ duration: 0.5, ease: EASE }}
                        className={cn(
                          "h-9 rounded-lg transition-colors duration-500",
                          target
                            ? booked
                              ? "bg-[#1d4ed8] shadow-[0_8px_20px_-8px_#1d4ed8]"
                              : "border-2 border-dashed border-[#1d4ed8]/50 bg-[#eef2ff]"
                            : taken
                              ? "bg-[#e7e7e5]"
                              : "bg-[#f6f6f5]",
                        )}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm text-[#0a0a0a]">
              <CheckCircleIcon className={cn("size-4 transition-colors", booked ? "text-[#047857]" : "text-[#8a8a86]")} />
              {booked ? "Booked Thursday at 9:40, written to the calendar" : "Finding an open time"}
            </p>
          </div>

          {/* The confirmation lands on their phone. */}
          <motion.div
            initial={false}
            animate={texted ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="ml-auto mt-4 w-fit max-w-[85%] rounded-2xl rounded-br-md bg-band-indigo-ink px-4 py-3 text-sm leading-relaxed text-[#0e1440] shadow-[0_12px_30px_-18px_rgb(0_0_0/0.6)]"
          >
            <span className="mb-0.5 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-[0.12em] opacity-70">
              <ChatTextIcon className="size-3.5" />
              Text sent
            </span>
            You are booked for Thursday at 9:40. Reply C to confirm.
          </motion.div>
        </div>
      </Stage>
    </div>
  );
}

/* --------------------------------------------------------------- hands off */

const RING = [
  { name: "Front desk", note: "Busy with a patient" },
  { name: "Priya", note: "Office manager" },
  { name: "On call", note: "After hours" },
];

export function HandsOffArt() {
  const ref = React.useRef<HTMLDivElement>(null);
  // 0: desk rings, 1: desk busy, 2: Priya rings, 3: Priya answers + whisper.
  const step = useSteps(ref, 3, 1300);
  const ringing = step === 0 ? 0 : step === 2 ? 1 : -1;
  const answeredBy = step >= 3 ? 1 : -1;

  return (
    <div ref={ref} className="h-full w-full">
      <Stage ambience="links" align="end" tint="#f8b4cf" icons={[HeadsetIcon, UserCircleIcon, ArrowsLeftRightIcon]}>
        <div className="w-full max-w-[25rem]">
          <ol className="space-y-2.5">
            {RING.map((r, i) => {
              const isRinging = ringing === i;
              const isAnswered = answeredBy === i;
              const skipped = i === 0 && step >= 1;
              return (
                <li
                  key={r.name}
                  className={cn(
                    "flex items-center gap-4 rounded-[1.25rem] bg-white px-4 py-3.5 shadow-[0_18px_40px_-22px_rgb(0_0_0/0.6)] transition-transform duration-500",
                    isAnswered && "scale-[1.03]",
                  )}
                >
                  <span className="relative flex size-10 shrink-0 items-center justify-center">
                    {isRinging ? (
                      <span className="animate-halo absolute inset-0 rounded-full border-2 border-[#be185d] motion-reduce:hidden" />
                    ) : null}
                    <span
                      className={cn(
                        "flex size-10 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-500",
                        isAnswered
                          ? "bg-[#047857] text-white"
                          : isRinging
                            ? "bg-[#be185d] text-white"
                            : "bg-[#f2f2f1] text-[#555553]",
                      )}
                    >
                      {isAnswered ? <HeadsetIcon className="size-5" /> : i + 1}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold text-[#0a0a0a]">{r.name}</span>
                    <span className="block text-sm text-[#555553]">
                      {isAnswered ? "Picked up" : isRinging ? "Ringing" : skipped ? "No answer, trying the next" : r.note}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>

          {/* The warm transfer: what the person hears before the caller. */}
          <motion.div
            initial={false}
            animate={answeredBy === 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mt-4 rounded-2xl bg-band-claret-ink px-4 py-3 text-sm leading-relaxed text-[#3d0f24] shadow-[0_12px_30px_-18px_rgb(0_0_0/0.6)]"
          >
            <span className="mb-0.5 block text-2xs font-semibold uppercase tracking-[0.12em] opacity-70">
              EZRA to Priya, before connecting
            </span>
            I have Gerald Whitmore about a billing question. Putting him through now.
          </motion.div>
        </div>
      </Stage>
    </div>
  );
}

/* -------------------------------------------------------------------- chat */

/**
 * A website chat widget: the visitor asks, EZRA answers, then offers a time
 * the visitor taps. Drawn as the widget a visitor sees, not as the app.
 */
const ASK = "Do you do Invisalign? Roughly what does it cost?";

const SLOTS = ["Wed 4:00", "Thu 9:20", "Fri 2:20"];

/** Words fade in one after another, the way a reply streams. Layout is fixed from the start, so the bubble never resizes. */
function Stream({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.35, delay: i * 0.045 }}
        >
          {w}{" "}
        </motion.span>
      ))}
    </>
  );
}

/** The visitor's question, typed into the box character by character. */
function useTyped(text: string, active: boolean) {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    if (!active) {
      setN(0);
      return;
    }
    const id = window.setInterval(() => setN((c) => (c >= text.length ? c : c + 1)), 22);
    return () => window.clearInterval(id);
  }, [active, text]);
  return text.slice(0, n);
}

const BUBBLE_EZRA =
  "w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-sm leading-relaxed text-[#0a0a0a] ring-1 ring-[#ece6e9]";

/**
 * A website chat, start to booking.
 *
 * The visitor types, EZRA reads the business's own services page (shown, so
 * the answer visibly comes from somewhere), streams a reply, offers three
 * times, and one gets picked and confirmed. The thread is a fixed window that
 * scrolls upward as messages arrive, with a fade at the top, so the card never
 * grows and nothing lands on top of anything else.
 */
export function ChatArt() {
  const ref = React.useRef<HTMLDivElement>(null);
  // 0 typing, 1 sent, 2 reading the site, 3 answer, 4 offer, 5 picked, 6 booked.
  const step = useSteps(ref, 6, 1300);
  const typed = useTyped(ASK, step === 0);

  const item = {
    layout: "position" as const,
    initial: { opacity: 0, y: 14, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, transition: { duration: 0.15 } },
    transition: { duration: 0.45, ease: EASE },
  };

  return (
    <div ref={ref} className="h-full w-full">
      <Stage ambience="waves" tint="#f8b4cf" icons={[GlobeIcon, BookOpenIcon, CalendarCheckIcon, SparkleIcon]}>
        <div className="relative w-full max-w-[24rem]">
          {/* Glow under the widget. */}
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[#e0559a] opacity-30 blur-3xl" />

          <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-[0_24px_60px_-24px_rgb(0_0_0/0.6)]">
            <div className="flex items-center gap-3 bg-[#5a1736] px-4 py-3">
              <span className="relative flex size-9 items-center justify-center rounded-full bg-[#f8d3e1] text-xs font-semibold text-[#3d0f24]">
                AC
                <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-[#7cf0b8] ring-2 ring-[#5a1736]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">Alder Creek Dental</span>
                <span className="block text-xs text-[#f8d3e1]">Answered by EZRA, any hour</span>
              </span>
              <SparkleIcon className="size-5 text-[#f8d3e1]" />
            </div>

            <ul className="flex h-[19rem] flex-col justify-end gap-2.5 overflow-hidden bg-[#faf7f8] px-4 py-4 [mask-image:linear-gradient(to_bottom,transparent,black_2.5rem)]">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.li key="hello" layout="position" className={BUBBLE_EZRA}>
                  Hi! Ask me anything about the practice, or grab a time.
                </motion.li>

                {step >= 1 ? (
                  <motion.li
                    key="ask"
                    {...item}
                    className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-[#5a1736] px-3.5 py-2.5 text-sm leading-relaxed text-white"
                  >
                    {ASK}
                  </motion.li>
                ) : null}

                {step === 2 ? (
                  <motion.li key="reading" {...item} className="flex items-center gap-2 text-xs font-medium text-[#7a2a4f]">
                    <span className="flex items-center gap-1 rounded-full bg-white px-3 py-2 ring-1 ring-[#ece6e9]">
                      {[0, 1, 2].map((d) => (
                        <motion.span
                          key={d}
                          className="size-1.5 rounded-full bg-[#b03d7c]"
                          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }}
                        />
                      ))}
                    </span>
                    <span className="relative overflow-hidden whitespace-nowrap rounded-full bg-[#f8e7ef] px-2.5 py-1">
                      <FileTextIcon className="mr-1 inline size-3.5 align-[-2px]" />
                      Reading your services page
                      <motion.span
                        className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-transparent via-white/80 to-transparent"
                        animate={{ x: ["-3rem", "13rem"] }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                      />
                    </span>
                  </motion.li>
                ) : null}

                {step >= 3 ? (
                  <motion.li key="answer" {...item} className={BUBBLE_EZRA}>
                    <Stream text="We do. Pricing depends on the case, so the first consult is free and tells you exactly." />
                    <span className="mt-1.5 flex items-center gap-1 text-2xs font-medium text-[#7a2a4f]">
                      <FileTextIcon className="size-3" />
                      From your services page
                    </span>
                  </motion.li>
                ) : null}

                {step >= 4 ? (
                  <motion.li key="offer" {...item} className={BUBBLE_EZRA}>
                    <Stream text="Want to come in? These are open:" />
                  </motion.li>
                ) : null}

                {step >= 4 ? (
                  <motion.li key="slots" {...item} className="flex flex-wrap gap-1.5">
                    {SLOTS.map((t, i) => {
                      const picked = step >= 5 && i === 0;
                      return (
                        <motion.span
                          key={t}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0, scale: picked ? [1, 0.92, 1.04, 1] : 1 }}
                          transition={{ duration: 0.4, delay: step === 4 ? 0.3 + i * 0.1 : 0 }}
                          className={cn(
                            "relative rounded-full px-3 py-1.5 font-mono text-xs font-semibold ring-1 transition-colors duration-300",
                            picked ? "bg-[#5a1736] text-white ring-[#5a1736]" : "bg-white text-[#3d0f24] ring-[#e3cfd8]",
                          )}
                        >
                          {picked ? (
                            <span className="animate-halo absolute inset-0 rounded-full border-2 border-[#e0559a] motion-reduce:hidden" />
                          ) : null}
                          {t}
                        </motion.span>
                      );
                    })}
                  </motion.li>
                ) : null}

                {step >= 6 ? (
                  <motion.li
                    key="booked"
                    {...item}
                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                    className="flex items-center gap-3 rounded-2xl bg-[#ecfdf5] px-3.5 py-3 ring-1 ring-[#a7f3d0]"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#047857] text-white">
                      <CheckCircleIcon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[#064e3b]">Booked: Wednesday at 4:00</span>
                      <span className="block text-xs text-[#065f46]">Free consult. Confirmation texted.</span>
                    </span>
                  </motion.li>
                ) : null}
              </AnimatePresence>
            </ul>

            <div className="flex items-center gap-2 border-t border-[#ece6e9] px-4 py-2.5">
              <span className={cn("min-w-0 flex-1 truncate text-sm", step === 0 && typed ? "text-[#0a0a0a]" : "text-[#555553]")}>
                {step === 0 && typed ? typed : "Type a message"}
                {step === 0 ? (
                  <span className="ml-px inline-block h-4 w-px translate-y-0.5 animate-pulse bg-[#5a1736] motion-reduce:hidden" />
                ) : null}
              </span>
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                  step === 0 && typed.length === ASK.length ? "bg-[#5a1736] text-white" : "bg-[#f3eef0] text-[#7a2a4f]",
                )}
              >
                <PaperPlaneRightIcon className="size-4" />
              </span>
            </div>
          </div>
        </div>
      </Stage>
    </div>
  );
}

/* --------------------------------------------------------------- reporting */

const WEEK = [
  { d: "Mon", total: 0.62, booked: 0.28 },
  { d: "Tue", total: 0.84, booked: 0.36 },
  { d: "Wed", total: 0.71, booked: 0.33 },
  { d: "Thu", total: 0.9, booked: 0.41 },
  { d: "Fri", total: 0.78, booked: 0.3 },
  { d: "Sat", total: 0.4, booked: 0.17 },
  { d: "Sun", total: 0.33, booked: 0.12 },
];

/**
 * The week drawn as bars that grow in, booked inside handled, then the
 * morning summary that lands in the inbox. Two series, so it carries a key.
 */
export function ReportArt() {
  const ref = React.useRef<HTMLDivElement>(null);
  const step = useSteps(ref, 2, 1500);
  const grown = step >= 1;
  return (
    <div ref={ref} className="h-full w-full">
      <Stage ambience="floor" tint="#c4b5fd" icons={[ChartBarIcon, TrendUpIcon, SunIcon, CheckCircleIcon]}>
        <div className="w-full max-w-[28rem]">
          <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_24px_60px_-24px_rgb(0_0_0/0.6)]">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold text-[#0a0a0a]">This week</p>
              <p className="text-sm text-[#555553]">
                <span className="font-display text-xl font-semibold text-[#0a0a0a]">408</span> handled
              </p>
            </div>
            <div className="mt-4 flex h-36 items-end gap-2.5">
              {WEEK.map((w, i) => (
                // The column needs its own height, or the bar's percentage height
                // resolves against nothing and the chart draws empty.
                <div key={w.d} className="flex h-full flex-1 flex-col items-center gap-1.5">
                  <div className="relative flex w-full flex-1 items-end">
                    <motion.div
                      className="relative w-full overflow-hidden rounded-t-lg bg-[#c7d2fe]"
                      initial={false}
                      animate={{ height: grown ? `${w.total * 100}%` : "6%" }}
                      transition={{ duration: 0.7, delay: i * 0.06, ease: EASE }}
                    >
                      <motion.div
                        className="absolute inset-x-0 bottom-0 bg-[#6d28d9]"
                        initial={false}
                        animate={{ height: grown ? `${(w.booked / w.total) * 100}%` : "0%" }}
                        transition={{ duration: 0.6, delay: 0.3 + i * 0.06, ease: EASE }}
                      />
                    </motion.div>
                  </div>
                  <span className="text-2xs font-medium text-[#555553]">{w.d}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-4 text-xs text-[#555553]">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-[#6d28d9]" />Booked</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-[#c7d2fe]" />Handled</span>
            </div>
          </div>
          <motion.div
            initial={false}
            animate={step >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="ml-auto mt-4 w-fit max-w-[90%] rounded-2xl bg-band-violet-ink px-4 py-3 text-sm leading-relaxed text-[#1a0d3d] shadow-[0_12px_30px_-18px_rgb(0_0_0/0.6)]"
          >
            <span className="mb-0.5 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-[0.12em] opacity-70">
              <SunIcon className="size-3.5" />
              Morning summary
            </span>
            148 booked, 157 after hours, 1 needs you.
          </motion.div>
        </div>
      </Stage>
    </div>
  );
}

