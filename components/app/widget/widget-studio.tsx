"use client";

import * as React from "react";
import {
  ArrowCounterClockwiseIcon,
  ChatCircleDotsIcon,
  CheckCircleIcon,
  CheckIcon,
  CopyIcon,
  DesktopIcon,
  DeviceMobileIcon,
  EnvelopeSimpleIcon,
  ImageIcon,
  PhoneCallIcon,
  PlusIcon,
  TrashIcon,
  UploadSimpleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlay";
import { Badge } from "@/components/ui/status";
import type { LauncherIcon, WidgetSettings } from "@/lib/api/types";
import { FONT, HEX, PALETTES, RADIUS, contrast, inkOn, installSnippet } from "@/lib/widget";
import { cn } from "@/lib/utils";
import { ChatPreview, LAUNCHER_ICONS, LauncherGlyph } from "./chat-preview";
import { VoicePreview } from "./voice-preview";

/**
 * The widget and voice studio: everything about how EZRA looks on the
 * business's website and sounds on its phone line, with a preview that is the
 * real thing at real size.
 *
 * Settings on the left, grouped the way an owner thinks: how it looks, the
 * button in the corner, what it says, how it sounds, and how to put it on the
 * site. The preview on the right follows whichever tab is open, so choosing a
 * voice shows the call and choosing a colour shows the chat.
 *
 * Nothing goes live until Publish. The bar that offers it only appears once
 * something has changed, and Reset puts back what visitors see today.
 */

type Tab = "look" | "launcher" | "messages" | "voice" | "install";

/** The visitor's website behind the preview. A light page, as most are. */
const SITE = { bg: "#ffffff", block: "#eceef2", strong: "#d9dce3" };

const PLATFORMS = {
  any: {
    label: "Any website",
    steps: ["Copy the snippet.", "Paste it just before the closing </body> tag on every page.", "Publish your site. The bubble appears within a minute."],
  },
  wordpress: {
    label: "WordPress",
    steps: ["Install a header and footer plugin, such as WPCode.", "Paste the snippet into the footer box.", "Save. The bubble appears on every page."],
  },
  squarespace: {
    label: "Squarespace",
    steps: ["Open Settings, then Advanced, then Code Injection.", "Paste the snippet into the Footer box.", "Save. The bubble appears on every page."],
  },
  wix: {
    label: "Wix",
    steps: ["Open Settings, then Custom Code.", "Add the snippet, set it to load on all pages, in the Body end.", "Apply and publish your site."],
  },
  shopify: {
    label: "Shopify",
    steps: ["Open Online Store, then Themes, then Edit code.", "Open theme.liquid and paste the snippet before </body>.", "Save. The bubble appears on every page."],
  },
} as const;

export function WidgetStudio({
  initial,
  workspaceId,
  businessName,
  siteDomain,
  voices,
}: {
  initial: WidgetSettings;
  workspaceId: string;
  businessName: string;
  siteDomain: string;
  voices: { id: string; name: string; tone: string }[];
}) {
  const [saved, setSaved] = React.useState(initial);
  const [s, setS] = React.useState(initial);
  const [tab, setTab] = React.useState<Tab>("look");
  const [preview, setPreview] = React.useState<"chat" | "voice">("chat");
  const [device, setDevice] = React.useState<"desktop" | "phone">("desktop");
  const [replay, setReplay] = React.useState(0);
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [systemDark, setSystemDark] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const on = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  React.useEffect(() => () => {
    if (logoUrl) URL.revokeObjectURL(logoUrl);
  }, [logoUrl]);

  const dirty = JSON.stringify(s) !== JSON.stringify(saved);
  const set = (patch: Partial<WidgetSettings>) => setS((x) => ({ ...x, ...patch }));
  const setL = (patch: Partial<WidgetSettings["launcher"]>) => setS((x) => ({ ...x, launcher: { ...x.launcher, ...patch } }));
  const setG = (patch: Partial<WidgetSettings["greeting"]>) => setS((x) => ({ ...x, greeting: { ...x.greeting, ...patch } }));
  const setV = (patch: Partial<WidgetSettings["voice"]>) => setS((x) => ({ ...x, voice: { ...x.voice, ...patch } }));
  const voice = voices.find((v) => v.id === s.voice.voiceId) ?? voices[0]!;

  function changeTab(t: string) {
    const next = t as Tab;
    setTab(next);
    setPreview(next === "voice" ? "voice" : "chat");
  }

  function publish() {
    setPublishing(true);
    window.setTimeout(() => {
      setSaved(s);
      setPublishing(false);
      toast.success("Published. Visitors see it on their next page load, and the next call uses the new voice.");
    }, 900);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]">
        {/* ------------------------------------------------------- settings */}
        <Tabs value={tab} onValueChange={changeTab} className="order-2 min-w-0 xl:order-1">
          <TabsList aria-label="What to customize">
            <TabsTrigger value="look">Look</TabsTrigger>
            <TabsTrigger value="launcher">Chat button</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="install">Install</TabsTrigger>
          </TabsList>

          <TabsContent value="look" className="mt-5 space-y-4 focus-visible:outline-none">
            <Panel title="Brand colour" hint="Used for the button, the header, and your visitor's messages.">
              <ColourPicker value={s.accent} onChange={(accent) => set({ accent })} />
            </Panel>
            <Panel title="Theme" hint="Match visitor follows their phone or computer's light or dark setting.">
              <Choice
                name="mode"
                label="Theme"
                value={s.mode}
                onChange={(mode) => set({ mode })}
                options={[
                  { value: "light", label: "Light", art: <ThemeArt dark={false} accent={s.accent} /> },
                  { value: "dark", label: "Dark", art: <ThemeArt dark accent={s.accent} /> },
                  { value: "auto", label: "Match visitor", art: <ThemeArt split accent={s.accent} /> },
                ]}
              />
            </Panel>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel title="Corners">
                <Choice
                  name="corners"
                label="Corners"
                  value={s.corners}
                  onChange={(corners) => set({ corners })}
                  options={(["sharp", "soft", "round"] as const).map((c) => ({
                    value: c,
                    label: c === "sharp" ? "Crisp" : c === "soft" ? "Soft" : "Round",
                    art: (
                      <span
                        aria-hidden
                        className="block h-7 w-12 border-2 border-ink/70"
                        style={{ borderRadius: Math.min(RADIUS[c], 14) }}
                      />
                    ),
                  }))}
                />
              </Panel>
              <Panel title="Lettering">
                <Choice
                  name="font"
                label="Lettering"
                  value={s.font}
                  onChange={(font) => set({ font })}
                  options={(["modern", "friendly", "classic"] as const).map((f) => ({
                    value: f,
                    label: f === "modern" ? "Modern" : f === "friendly" ? "Friendly" : "Classic",
                    art: (
                      <span aria-hidden style={{ fontFamily: FONT[f] }} className="text-2xl font-semibold leading-none text-ink">
                        Aa
                      </span>
                    ),
                  }))}
                />
              </Panel>
            </div>
          </TabsContent>

          <TabsContent value="launcher" className="mt-5 space-y-4 focus-visible:outline-none">
            <Panel title="Icon" hint="What sits in the round button in the corner of your site.">
              <IconPicker
                settings={s}
                logoUrl={logoUrl}
                onPick={(icon) => setL({ icon })}
                onLogo={(url) => {
                  setLogoUrl(url);
                  setL({ icon: "logo" });
                }}
                onClearLogo={() => {
                  setLogoUrl(null);
                  if (s.launcher.icon === "logo") setL({ icon: "chat" });
                }}
              />
            </Panel>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel title="Size">
                <Choice
                  name="size"
                label="Size"
                  value={s.launcher.size}
                  onChange={(size) => setL({ size })}
                  options={(["sm", "md", "lg"] as const).map((z) => ({
                    value: z,
                    label: z === "sm" ? "Small" : z === "md" ? "Medium" : "Large",
                    art: (
                      <span
                        aria-hidden
                        className="block rounded-full"
                        style={{ background: s.accent, width: z === "sm" ? 18 : z === "md" ? 24 : 30, height: z === "sm" ? 18 : z === "md" ? 24 : 30 }}
                      />
                    ),
                  }))}
                />
              </Panel>
              <Panel title="Corner of the page">
                <Choice
                  name="position"
                label="Corner of the page"
                  value={s.launcher.position}
                  onChange={(position) => setL({ position })}
                  options={(["left", "right"] as const).map((p) => ({
                    value: p,
                    label: p === "left" ? "Bottom left" : "Bottom right",
                    art: (
                      <span aria-hidden className="relative block h-7 w-12 rounded-md border-2 border-ink/40">
                        <span
                          className={cn("absolute bottom-0.5 size-2.5 rounded-full", p === "left" ? "left-0.5" : "right-0.5")}
                          style={{ background: s.accent }}
                        />
                      </span>
                    ),
                  }))}
                />
              </Panel>
            </div>
            <Panel title="Button text" hint="Leave it empty for a round button. A few words turn it into a pill.">
              <Input
                aria-label="Button text"
                value={s.launcher.label}
                maxLength={24}
                onChange={(e) => setL({ label: e.target.value })}
                placeholder="No text, round button"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["Chat with us", "Book online", "Questions?"].map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setL({ label: l })}
                    className="cursor-pointer rounded-full border border-rule bg-canvas px-3 py-1 text-xs font-medium text-ink-muted transition-colors hover:border-rule-control hover:text-ink"
                  >
                    {l}
                  </button>
                ))}
              </div>
            </Panel>
            <Panel title="Get attention" hint="A small movement every few seconds. It stops for visitors who prefer less motion.">
              <Choice
                name="motion"
                label="Get attention"
                value={s.launcher.motion}
                onChange={(m) => setL({ motion: m })}
                cols="grid-cols-2 sm:grid-cols-4"
                options={(["none", "pulse", "bounce", "wiggle"] as const).map((m) => ({
                  value: m,
                  label: m === "none" ? "Still" : m[0]!.toUpperCase() + m.slice(1),
                  art: <MotionArt kind={m} accent={s.accent} />,
                }))}
              />
            </Panel>
            <Panel title="Greeting bubble" hint="A short note beside the button, so visitors know someone is there.">
              <ToggleRow
                id="greet-on"
                label="Show a greeting"
                checked={s.greeting.enabled}
                onChange={(enabled) => setG({ enabled })}
              />
              {s.greeting.enabled ? (
                <div className="mt-4 space-y-4">
                  <Field label="What it says" htmlFor="greet-text">
                    <Textarea
                      className="min-h-16"
                      maxLength={140}
                      value={s.greeting.text}
                      onChange={(e) => setG({ text: e.target.value })}
                    />
                  </Field>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Show it after" htmlFor="greet-delay">
                      <Select value={String(s.greeting.delaySeconds)} onChange={(e) => setG({ delaySeconds: Number(e.target.value) })}>
                        <option value="0">Straight away</option>
                        <option value="5">5 seconds</option>
                        <option value="10">10 seconds</option>
                        <option value="30">30 seconds</option>
                      </Select>
                    </Field>
                    <div className="sm:pt-6">
                      <ToggleRow
                        id="greet-phones"
                        label="Also on phones"
                        checked={s.greeting.onPhones}
                        onChange={(onPhones) => setG({ onPhones })}
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </Panel>
          </TabsContent>

          <TabsContent value="messages" className="mt-5 space-y-4 focus-visible:outline-none">
            <Panel title="Who visitors are talking to">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Name" htmlFor="w-name">
                  <Input value={s.assistantName} maxLength={24} onChange={(e) => set({ assistantName: e.target.value })} />
                </Field>
                <Field label="Under the name" htmlFor="w-sub">
                  <Input value={s.subtitle} maxLength={40} onChange={(e) => set({ subtitle: e.target.value })} />
                </Field>
              </div>
            </Panel>
            <Panel title="First message" hint="What visitors read the moment the chat opens.">
              <Textarea
                aria-label="First message"
                className="min-h-20"
                maxLength={220}
                value={s.welcome}
                onChange={(e) => set({ welcome: e.target.value })}
              />
            </Panel>
            <Panel title="Quick replies" hint="One tap answers for what people ask most. Up to four.">
              <ul className="space-y-2">
                {s.quickReplies.map((q, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Input
                      aria-label={`Quick reply ${i + 1}`}
                      value={q}
                      maxLength={32}
                      onChange={(e) => set({ quickReplies: s.quickReplies.map((x, j) => (j === i ? e.target.value : x)) })}
                    />
                    <Button
                      variant="quiet"
                      size="icon-sm"
                      aria-label={`Remove quick reply ${i + 1}`}
                      onClick={() => set({ quickReplies: s.quickReplies.filter((_, j) => j !== i) })}
                    >
                      <TrashIcon aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
              {s.quickReplies.length < 4 ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2 border-dashed"
                  onClick={() => set({ quickReplies: [...s.quickReplies, ""] })}
                >
                  <PlusIcon aria-hidden weight="bold" />
                  Add a quick reply
                </Button>
              ) : null}
            </Panel>
            <Panel title="Typing box">
              <Field label="Hint inside the box" htmlFor="w-ph">
                <Input value={s.placeholder} maxLength={48} onChange={(e) => set({ placeholder: e.target.value })} />
              </Field>
            </Panel>
            <Panel title="Extras">
              <div className="space-y-3">
                <ToggleRow
                  id="w-call"
                  label="Offer a call"
                  hint="A phone button in the header connects visitors to your voice agent."
                  checked={s.showCallButton}
                  onChange={(showCallButton) => set({ showCallButton })}
                />
                <ToggleRow
                  id="w-brand"
                  label="Show Answered by EZRA"
                  hint="A small line under the typing box."
                  checked={s.showBranding}
                  onChange={(showBranding) => set({ showBranding })}
                />
              </div>
            </Panel>
          </TabsContent>

          <TabsContent value="voice" className="mt-5 space-y-4 focus-visible:outline-none">
            <Panel title="Voice" hint="Who callers hear when your phone agent picks up.">
              <Choice
                name="voice"
                label="Voice"
                value={s.voice.voiceId}
                onChange={(voiceId) => setV({ voiceId })}
                cols="grid-cols-1 sm:grid-cols-2"
                options={voices.map((v) => ({ value: v.id, label: v.name, body: v.tone }))}
              />
            </Panel>
            <Panel title="How it speaks">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Slider
                  id="v-pace"
                  label="Pace"
                  min={0.8}
                  max={1.2}
                  step={0.05}
                  value={s.voice.pace}
                  onChange={(pace) => setV({ pace })}
                  ends={["Slower", "Faster"]}
                  readout={`${s.voice.pace.toFixed(2)}x`}
                />
                <Slider
                  id="v-warmth"
                  label="Warmth"
                  min={0}
                  max={1}
                  step={0.05}
                  value={s.voice.warmth}
                  onChange={(warmth) => setV({ warmth })}
                  ends={["Brighter", "Warmer"]}
                  readout={`${Math.round(s.voice.warmth * 100)}`}
                />
              </div>
            </Panel>
            <Panel title="Greeting" hint="The first thing every caller hears.">
              <Textarea
                aria-label="Phone greeting"
                className="min-h-20"
                maxLength={220}
                value={s.voice.greeting}
                onChange={(e) => setV({ greeting: e.target.value })}
              />
            </Panel>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel title="Picks up after">
                <Choice
                  name="rings"
                label="Picks up after"
                  value={String(s.voice.answerAfterRings)}
                  onChange={(r) => setV({ answerAfterRings: r === "2" ? 2 : 1 })}
                  cols="grid-cols-2"
                  options={[
                    { value: "1", label: "1 ring", body: "Feels instant" },
                    { value: "2", label: "2 rings", body: "Gives staff a chance" },
                  ]}
                />
              </Panel>
              <Panel title="While transferring">
                <Choice
                  name="hold"
                label="While transferring"
                  value={s.voice.hold}
                  onChange={(hold) => setV({ hold })}
                  cols="grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 2xl:grid-cols-3"
                  options={[
                    { value: "silence", label: "Silence" },
                    { value: "piano", label: "Soft piano" },
                    { value: "acoustic", label: "Acoustic" },
                  ]}
                />
              </Panel>
            </div>
            <Panel title="Manner">
              <div className="space-y-3">
                <ToggleRow
                  id="v-pauses"
                  label="Natural pauses"
                  hint="Small breaths and a beat before answers, so it sounds less rushed."
                  checked={s.voice.naturalPauses}
                  onChange={(naturalPauses) => setV({ naturalPauses })}
                />
                <ToggleRow
                  id="v-interrupt"
                  label="Let callers interrupt"
                  hint="It stops talking as soon as the caller starts."
                  checked={s.voice.interrupt}
                  onChange={(interrupt) => setV({ interrupt })}
                />
                <ToggleRow
                  id="v-spanish"
                  label="Speak Spanish when the caller does"
                  checked={s.voice.spanish}
                  onChange={(spanish) => setV({ spanish })}
                />
                <ToggleRow
                  id="v-office"
                  label="Quiet office sound in the background"
                  hint="Very low. Some callers find silence on a line unsettling."
                  checked={s.voice.ambience === "office"}
                  onChange={(on) => setV({ ambience: on ? "office" : "none" })}
                />
              </div>
            </Panel>
          </TabsContent>

          <TabsContent value="install" className="mt-5 space-y-4 focus-visible:outline-none">
            <Install workspaceId={workspaceId} settings={saved} siteDomain={siteDomain} />
          </TabsContent>
        </Tabs>

        {/* -------------------------------------------------------- preview */}
        <div className="order-1 min-w-0 xl:order-2 xl:sticky xl:top-20 xl:self-start">
          <div className="rounded-2xl border border-rule bg-surface p-4 shadow-[0_1px_2px_rgb(10_10_10/0.04),0_14px_34px_-20px_rgb(10_10_10/0.16)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Segment
                label="Preview"
                value={preview}
                onChange={setPreview}
                options={[
                  { value: "chat", label: "Website chat", icon: ChatCircleDotsIcon },
                  { value: "voice", label: "Phone call", icon: PhoneCallIcon },
                ]}
              />
              {preview === "chat" ? (
                <span className="flex items-center gap-1">
                  <Segment
                    label="Screen"
                    value={device}
                    onChange={setDevice}
                    iconOnly
                    options={[
                      { value: "desktop", label: "Computer", icon: DesktopIcon },
                      { value: "phone", label: "Phone", icon: DeviceMobileIcon },
                    ]}
                  />
                  <Button variant="quiet" size="icon-sm" aria-label="Replay from the start" onClick={() => setReplay((r) => r + 1)}>
                    <ArrowCounterClockwiseIcon aria-hidden />
                  </Button>
                </span>
              ) : null}
            </div>

            <div className="mt-4">
              {preview === "chat" ? (
                device === "desktop" ? (
                  <div className="overflow-hidden rounded-xl border border-rule">
                    <div className="flex items-center gap-2 border-b border-rule bg-panel px-3 py-2">
                      <span aria-hidden className="flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="size-2.5 rounded-full bg-rule-control" />
                        ))}
                      </span>
                      <span className="mx-auto truncate rounded-md bg-surface px-3 py-0.5 text-xs text-ink-muted">{siteDomain}</span>
                    </div>
                    <div className="relative h-[34rem] overflow-hidden" style={{ background: SITE.bg }}>
                      <SiteSketch />
                      <ChatPreview
                        settings={s}
                        logoUrl={logoUrl}
                        device="desktop"
                        dark={systemDark}
                        replayKey={replay}
                        onCall={() => setPreview("voice")}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center py-2">
                    <div className="relative h-[36rem] w-[18rem] overflow-hidden rounded-[2.5rem] ring-8 ring-[#1f1f26]" style={{ background: SITE.bg }}>
                      <span aria-hidden className="absolute left-1/2 top-2 z-40 h-5 w-20 -translate-x-1/2 rounded-full bg-[#1f1f26]" />
                      <div className="pt-8">
                        <SiteSketch compact />
                      </div>
                      <ChatPreview
                        settings={s}
                        logoUrl={logoUrl}
                        device="phone"
                        dark={systemDark}
                        replayKey={replay}
                        onCall={() => setPreview("voice")}
                      />
                    </div>
                  </div>
                )
              ) : (
                <VoicePreview settings={s} businessName={businessName} voiceName={voice.name} voiceTone={voice.tone} />
              )}
            </div>
            {preview === "chat" ? (
              <p className="mt-3 text-center text-xs text-ink-muted">
                Real size. Click the button to open it, try a quick reply, or type a question.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------- publish */}
      <AnimatePresence>
        {dirty ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="sticky bottom-4 z-30 mx-auto flex w-fit max-w-full flex-wrap items-center gap-3 rounded-full border border-rule bg-surface py-2 pl-5 pr-2 shadow-overlay"
            role="region"
            aria-label="Unpublished changes"
          >
            <span className="text-sm text-ink">Visitors still see the published version.</span>
            <Button variant="secondary" size="sm" onClick={() => setS(saved)} disabled={publishing}>
              Reset
            </Button>
            <Button variant="primary" size="sm" loading={publishing} onClick={publish}>
              Publish changes
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------- pieces */

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-rule bg-surface p-5">
      <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
      {hint ? <p className="mt-0.5 text-sm text-ink-muted">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ToggleRow({
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

/** Radio cards over native radios, so arrow keys and screen readers behave. */
function Choice<T extends string>({
  name,
  label,
  value,
  options,
  onChange,
  cols = "grid-cols-3",
}: {
  name: string;
  /** The group's name for screen readers: the panel's visible title. */
  label: string;
  value: T;
  options: { value: T; label: string; body?: string; art?: React.ReactNode }[];
  onChange: (v: T) => void;
  cols?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("grid gap-2", cols)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <label
            key={o.value}
            className={cn(
              "flex cursor-pointer flex-col gap-2 rounded-xl border p-3 transition-colors",
              "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-canvas",
              o.art ? "items-center text-center" : "",
              on ? "border-primary bg-primary-wash" : "border-rule bg-canvas hover:border-rule-control",
            )}
          >
            <input type="radio" name={name} value={o.value} checked={on} onChange={() => onChange(o.value)} className="sr-only" />
            {o.art ? <span className="flex h-9 items-center justify-center">{o.art}</span> : null}
            <span className="text-sm font-medium text-ink">{o.label}</span>
            {o.body ? <span className="-mt-1 text-xs leading-relaxed text-ink-muted">{o.body}</span> : null}
          </label>
        );
      })}
    </div>
  );
}

function Segment<T extends string>({
  label,
  value,
  options,
  onChange,
  iconOnly,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; icon: React.ComponentType<{ className?: string }> }[];
  onChange: (v: T) => void;
  iconOnly?: boolean;
}) {
  return (
    <div role="group" aria-label={label} className="flex rounded-full bg-panel p-1">
      {options.map((o) => {
        const I = o.icon;
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            aria-label={iconOnly ? o.label : undefined}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-full text-xs font-medium transition-colors",
              iconOnly ? "size-8 justify-center" : "px-3 py-1.5",
              on ? "bg-surface text-ink shadow-[0_1px_3px_rgb(10_10_10/0.12)]" : "text-ink-muted hover:text-ink",
            )}
          >
            <I className="size-4" />
            {iconOnly ? null : o.label}
          </button>
        );
      })}
    </div>
  );
}

function Slider({
  id,
  label,
  min,
  max,
  step,
  value,
  onChange,
  ends,
  readout,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  ends: [string, string];
  readout: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        <span data-numeric className="font-mono text-xs text-ink-muted">
          {readout}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full cursor-pointer accent-[var(--color-primary)]"
      />
      <div className="mt-1 flex justify-between text-xs text-ink-muted">
        <span>{ends[0]}</span>
        <span>{ends[1]}</span>
      </div>
    </div>
  );
}

function ColourPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [text, setText] = React.useState(value);
  const [bad, setBad] = React.useState(false);
  React.useEffect(() => {
    setText(value);
    setBad(false);
  }, [value]);

  const ink = inkOn(value);
  const ratio = contrast(value, ink);

  return (
    <div className="space-y-4">
      <div role="group" aria-label="Ready-made colours" className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {PALETTES.map((p) => {
          const on = p.hex.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={p.hex}
              type="button"
              aria-pressed={on}
              aria-label={p.name}
              onClick={() => onChange(p.hex)}
              className="group flex cursor-pointer flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-full transition-transform group-hover:scale-105",
                  on ? "ring-2 ring-ink ring-offset-2 ring-offset-surface" : "ring-1 ring-black/10",
                )}
                style={{ background: p.hex, color: inkOn(p.hex) }}
              >
                {on ? <CheckIcon aria-hidden weight="bold" className="size-5" /> : null}
              </span>
              <span className="text-xs text-ink-muted">{p.name}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="relative flex size-11 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-1 ring-rule-control">
          <span className="sr-only">Pick any colour</span>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -inset-2 size-16 cursor-pointer border-0 p-0"
          />
        </label>
        <Field label="Hex code" htmlFor="w-hex" className="w-40" error={bad ? "Six characters after #, like #0f766e." : undefined}>
          <Input
            value={text}
            maxLength={7}
            spellCheck={false}
            className="font-mono"
            onChange={(e) => {
              const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
              setText(v);
              if (HEX.test(v)) {
                setBad(false);
                onChange(v.toLowerCase());
              }
            }}
            onBlur={() => setBad(!HEX.test(text))}
          />
        </Field>
        <div className="flex basis-full flex-wrap items-center gap-x-2.5 gap-y-1.5 pb-1 sm:basis-auto sm:pb-2">
          <span
            className="whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold"
            style={{ background: value, color: ink }}
          >
            Book a visit
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap text-xs text-ink-muted">
            <CheckCircleIcon aria-hidden weight="fill" className="size-4 text-success" />
            {ink === "#ffffff" ? "White" : "Dark"} text,{" "}
            <span data-numeric className="font-mono text-ink">
              {ratio.toFixed(1)}:1
            </span>
            easy to read
          </span>
        </div>
      </div>
    </div>
  );
}

function IconPicker({
  settings: s,
  logoUrl,
  onPick,
  onLogo,
  onClearLogo,
}: {
  settings: WidgetSettings;
  logoUrl: string | null;
  onPick: (icon: LauncherIcon) => void;
  onLogo: (url: string) => void;
  onClearLogo: () => void;
}) {
  const file = React.useRef<HTMLInputElement>(null);
  const ink = inkOn(s.accent);
  const kinds = [...(Object.keys(LAUNCHER_ICONS) as LauncherIcon[]), "initials" as const];

  function upload(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("That is not an image. Use a PNG, JPG, SVG or WebP.");
    if (f.size > 2 * 1024 * 1024) return toast.error("That image is over 2 MB. A square logo under 2 MB works best.");
    onLogo(URL.createObjectURL(f));
  }

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="Button icon" className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {kinds.map((k) => {
          const on = s.launcher.icon === k;
          return (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={k === "initials" ? "Initials" : LAUNCHER_ICONS[k as keyof typeof LAUNCHER_ICONS].label}
              onClick={() => onPick(k)}
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-xl border p-2.5 transition-colors",
                on ? "border-primary bg-primary-wash" : "border-rule bg-canvas hover:border-rule-control",
              )}
            >
              <span
                className="flex size-10 items-center justify-center rounded-full"
                style={{ background: s.accent, color: ink }}
              >
                <LauncherGlyph settings={{ ...s, launcher: { ...s.launcher, icon: k } }} logoUrl={null} size={40} />
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-rule-control bg-canvas p-3">
        <span
          className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-panel text-ink-faint"
          style={logoUrl ? { background: s.accent } : undefined}
        >
          {logoUrl ? (
            // An object URL of the owner's own file.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Your uploaded logo" className="size-full object-cover" />
          ) : (
            <ImageIcon aria-hidden className="size-5" />
          )}
        </span>
        <span className="min-w-0 flex-1 text-sm">
          <span className="block font-medium text-ink">{logoUrl ? "Your logo" : "Use your own logo or photo"}</span>
          <span className="block text-xs text-ink-muted">Square works best. PNG, JPG, SVG or WebP, under 2 MB.</span>
        </span>
        <input
          ref={file}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {logoUrl ? (
          <span className="flex gap-1">
            {s.launcher.icon !== "logo" ? (
              <Button variant="secondary" size="sm" onClick={() => onPick("logo")}>
                Use it
              </Button>
            ) : null}
            <Button variant="quiet" size="icon-sm" aria-label="Remove your logo" onClick={onClearLogo}>
              <XIcon aria-hidden />
            </Button>
          </span>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => file.current?.click()}>
            <UploadSimpleIcon aria-hidden />
            Upload
          </Button>
        )}
      </div>
    </div>
  );
}

function ThemeArt({ dark, split, accent }: { dark?: boolean; split?: boolean; accent: string }) {
  return (
    <span aria-hidden className="relative flex h-8 w-12 overflow-hidden rounded-md ring-1 ring-black/10">
      <span className={cn("h-full", split ? "w-1/2" : "w-full")} style={{ background: dark ? "#17171b" : "#ffffff" }} />
      {split ? <span className="h-full w-1/2" style={{ background: "#17171b" }} /> : null}
      <span className="absolute bottom-1 right-1 size-2.5 rounded-full" style={{ background: accent }} />
    </span>
  );
}

function MotionArt({ kind, accent }: { kind: WidgetSettings["launcher"]["motion"]; accent: string }) {
  return (
    <span aria-hidden className="relative flex size-8 items-center justify-center">
      <span
        className={cn(
          "relative block size-6 rounded-full motion-reduce:animate-none",
          kind === "bounce" && "animate-nudge-bounce",
          kind === "wiggle" && "animate-nudge-wiggle",
        )}
        style={{ background: accent }}
      >
        {kind === "pulse" ? (
          <span className="animate-halo absolute inset-0 rounded-full border-2 motion-reduce:hidden" style={{ borderColor: accent }} />
        ) : null}
      </span>
    </span>
  );
}

/** A plain stand-in for the visitor's website, so the button has a page to sit on. */
function SiteSketch({ compact }: { compact?: boolean }) {
  return (
    <div aria-hidden className={cn("space-y-4", compact ? "p-4" : "p-6")}>
      <div className="flex items-center justify-between">
        <span className="h-3 w-20 rounded-full" style={{ background: SITE.strong }} />
        {compact ? null : (
          <span className="flex gap-3">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-2 w-10 rounded-full" style={{ background: SITE.block }} />
            ))}
          </span>
        )}
      </div>
      <div className={cn("rounded-xl", compact ? "h-32" : "h-40")} style={{ background: SITE.block }} />
      <div className="space-y-2">
        <span className="block h-3 w-2/3 rounded-full" style={{ background: SITE.strong }} />
        <span className="block h-2.5 w-full rounded-full" style={{ background: SITE.block }} />
        <span className="block h-2.5 w-5/6 rounded-full" style={{ background: SITE.block }} />
      </div>
      <div className={cn("grid gap-3", compact ? "grid-cols-2" : "grid-cols-3")}>
        {Array.from({ length: compact ? 2 : 3 }, (_, i) => (
          <span key={i} className="h-20 rounded-xl" style={{ background: SITE.block }} />
        ))}
      </div>
    </div>
  );
}

function Install({ workspaceId, settings, siteDomain }: { workspaceId: string; settings: WidgetSettings; siteDomain: string }) {
  const [platform, setPlatform] = React.useState<keyof typeof PLATFORMS>("any");
  const [checking, setChecking] = React.useState(false);
  const snippet = installSnippet(workspaceId, settings);
  const mail = `mailto:?subject=${encodeURIComponent("Adding our chat to the website")}&body=${encodeURIComponent(
    `Hi, could you add this to every page of our website, just before the closing </body> tag?\n\n${snippet}\n\nThanks!`,
  )}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      toast.success("Snippet copied.");
    } catch {
      toast.error("Could not copy. Select the text and copy it by hand.");
    }
  }

  return (
    <>
      <Panel title="On your website">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="success">
            <CheckCircleIcon aria-hidden weight="fill" className="size-3.5" />
            Installed
          </Badge>
          <p className="min-w-0 flex-1 text-sm text-ink">
            Found on <span className="font-medium">{siteDomain}</span>. It updates by itself when you publish, so there
            is nothing to paste again.
          </p>
          <Button
            variant="secondary"
            size="sm"
            loading={checking}
            onClick={() => {
              setChecking(true);
              window.setTimeout(() => {
                setChecking(false);
                toast.success(`Still there on ${siteDomain}, and answering.`);
              }, 1100);
            }}
          >
            Check again
          </Button>
        </div>
      </Panel>
      <Panel title="Add it to another site" hint="Copy once. Colour, text and voice changes reach the site without touching this again.">
        <div className="overflow-hidden rounded-xl border border-rule bg-sunken">
          <div className="flex items-center justify-between gap-2 border-b border-rule px-4 py-2">
            <p className="text-xs font-medium text-ink-muted">Snippet</p>
            <Button variant="quiet" size="sm" onClick={copy}>
              <CopyIcon aria-hidden />
              Copy
            </Button>
          </div>
          <pre tabIndex={0} aria-label="Install snippet" className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-ink">
            <code>{snippet}</code>
          </pre>
        </div>
        <div className="mt-4">
          <div role="group" aria-label="Your website builder" className="flex flex-wrap gap-1.5">
            {(Object.keys(PLATFORMS) as (keyof typeof PLATFORMS)[]).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={platform === k}
                onClick={() => setPlatform(k)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  platform === k ? "border-ink bg-ink text-canvas" : "border-rule bg-surface text-ink-muted hover:text-ink",
                )}
              >
                {PLATFORMS[k].label}
              </button>
            ))}
          </div>
          <ol className="mt-3 space-y-2">
            {PLATFORMS[platform].steps.map((step, i) => (
              <li key={step} className="flex items-start gap-3 text-sm text-ink">
                <span
                  data-numeric
                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-wash font-mono text-xs font-semibold text-primary"
                >
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <Button asChild variant="secondary" size="sm" className="mt-4">
          <a href={mail}>
            <EnvelopeSimpleIcon aria-hidden />
            Email it to whoever runs your website
          </a>
        </Button>
      </Panel>
    </>
  );
}
