"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowsClockwiseIcon,
  CalendarBlankIcon,
  ChatCircleDotsIcon,
  CheckCircleIcon,
  DatabaseIcon,
  FileTextIcon,
  GlobeIcon,
  LightbulbIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  PlusIcon,
  QuestionIcon,
  StackIcon,
  TextAaIcon,
  TrashIcon,
  WarningCircleIcon,
  XCircleIcon,
  type Icon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Badge, type BadgeProps } from "@/components/ui/status";
import type {
  Agent,
  DailyNotice,
  KnowledgeGap,
  KnowledgeSource,
} from "@/lib/api/types";
import { NOW } from "@/lib/mock/fixtures";
import * as fmt from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Everything the agents know about the business, in one place.
 *
 * Until now knowledge lived only inside each agent's builder, so the office
 * manager had to open an agent to see what it had read, and had no way to see
 * what it had been asked and could not answer. This page inverts that. It
 * leads with the gaps, because that list is where knowledge actually gets
 * added: somebody asked, the agent did not know, and the fix is one sentence
 * typed here. The sources come second, grouped by what they are rather than by
 * which agent uses them.
 *
 * The daily notice is here too. One thing that is true today and not
 * tomorrow. A tour operator lives on this (a sailing cancelled for weather, a
 * trail closed); a clinic needs it the day someone is out sick. It is not a
 * knowledge source, because it expires, and it is not an agent setting,
 * because it is about the business and every agent should say it.
 *
 * Nothing here names a trade. The vocabulary is caller, customer, booking.
 * The fixture data is one dental group's, which is what one workspace's data
 * looks like; the page would read the same for a boat tour.
 */

const STATUS: Record<
  KnowledgeSource["status"],
  { label: string; tone: BadgeProps["tone"]; icon: Icon }
> = {
  ready: { label: "Ready", tone: "success", icon: CheckCircleIcon },
  reading: { label: "Reading", tone: "primary", icon: ArrowsClockwiseIcon },
  stale: { label: "Out of date", tone: "warning", icon: WarningCircleIcon },
  failed: { label: "Could not read", tone: "danger", icon: XCircleIcon },
};

const KIND: Record<KnowledgeSource["kind"], { label: string; icon: Icon }> = {
  website: { label: "Your website", icon: GlobeIcon },
  faq: { label: "Questions and answers", icon: ChatCircleDotsIcon },
  document: { label: "Documents", icon: FileTextIcon },
  text: { label: "Notes you wrote", icon: TextAaIcon },
};
/** One colour per kind of source, in the chart order. Identity only, never text. */
const KIND_TONE: Record<KnowledgeSource["kind"], string> = {
  website: "var(--color-series-1)",
  faq: "var(--color-series-2)",
  document: "var(--color-series-3)",
  text: "var(--color-series-4)",
};

const KIND_ORDER: KnowledgeSource["kind"][] = [
  "website",
  "faq",
  "document",
  "text",
];

const FALLBACK: Record<KnowledgeGap["fallback"], string> = {
  message: "Took a message",
  transfer: "Handed off to a person",
  declined: "Said it did not know",
};

type Way = "website" | "text" | "document";

const WAYS: { id: Way; label: string; hint: string }[] = [
  { id: "website", label: "A web page", hint: "One page, or your whole site" },
  { id: "text", label: "Write it down", hint: "Hours, policies, a price list" },
  { id: "document", label: "A document", hint: "PDF, Word, or a spreadsheet" },
];

export function KnowledgeBase({
  sources: initialSources,
  gaps: initialGaps,
  notice: initialNotice,
  agents,
}: {
  sources: KnowledgeSource[];
  gaps: KnowledgeGap[];
  notice: DailyNotice;
  agents: Agent[];
}) {
  const [sources, setSources] = React.useState(initialSources);
  const [gaps, setGaps] = React.useState(initialGaps);

  const [noticeText, setNoticeText] = React.useState(initialNotice.text);
  const [noticeDraft, setNoticeDraft] = React.useState(initialNotice.text);
  const [editingNotice, setEditingNotice] = React.useState(false);

  const [answering, setAnswering] = React.useState<string | null>(null);
  const [answer, setAnswer] = React.useState("");

  const [adding, setAdding] = React.useState(false);
  const [way, setWay] = React.useState<Way>("website");
  const [url, setUrl] = React.useState("");
  const [noteTitle, setNoteTitle] = React.useState("");
  const [noteBody, setNoteBody] = React.useState("");

  /* Timers that flip a new source from "reading" to "ready". Cleared on
     unmount so a navigation mid-read never sets state on a dead tree. */
  const timers = React.useRef<number[]>([]);
  React.useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const agentName = (id: string) =>
    agents.find((a) => a.id === id)?.name ?? "Every agent";

  /** The live agent that handles this channel, so a saved answer lands somewhere real. */
  const agentFor = (gap: KnowledgeGap) =>
    agents.find((a) => a.status === "live" && a.channels.includes(gap.channel))
      ?.id ??
    agents[0]?.id ??
    "";

  function addSource(src: Omit<KnowledgeSource, "__fixture">) {
    const full: KnowledgeSource = { __fixture: true, ...src };
    setSources((all) => [full, ...all]);
    const id = window.setTimeout(() => {
      setSources((all) =>
        all.map((s) =>
          s.id === full.id
            ? { ...s, status: "ready", chunks: Math.max(1, s.chunks) }
            : s,
        ),
      );
    }, 1600);
    timers.current.push(id);
  }

  function saveAnswer(gap: KnowledgeGap) {
    const text = answer.trim();
    if (!text) return;
    addSource({
      id: `ks_${gap.id}`,
      agentId: agentFor(gap),
      kind: "faq",
      label: gap.question,
      detail: text,
      chunks: 1,
      lastReadAt: NOW.toISOString(),
      status: "ready",
    });
    setGaps((all) => all.filter((g) => g.id !== gap.id));
    setAnswering(null);
    setAnswer("");
    toast.success("Saved. The agent uses it from the next call.");
  }

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    const first = agents.find((a) => a.status === "live")?.id ?? agents[0]?.id ?? "";
    if (way === "website") {
      const clean = url.trim();
      if (!clean) return;
      addSource({
        id: `ks_web_${Date.now()}`,
        agentId: first,
        kind: "website",
        label: clean.replace(/^https?:\/\//, ""),
        detail: "Reading every page we can reach from here.",
        chunks: 0,
        lastReadAt: NOW.toISOString(),
        status: "reading",
      });
      setUrl("");
      toast("Reading it now. Usually under a minute.");
    } else if (way === "text") {
      const body = noteBody.trim();
      if (!body) return;
      addSource({
        id: `ks_note_${Date.now()}`,
        agentId: first,
        kind: "text",
        label: noteTitle.trim() || body.slice(0, 48),
        detail: body,
        chunks: 1,
        lastReadAt: NOW.toISOString(),
        status: "ready",
      });
      setNoteTitle("");
      setNoteBody("");
      toast.success("Added. The agent knows it from the next call.");
    } else {
      addSource({
        id: `ks_doc_${Date.now()}`,
        agentId: first,
        kind: "document",
        label: "Uploaded document",
        detail: "Reading the file.",
        chunks: 0,
        lastReadAt: NOW.toISOString(),
        status: "reading",
      });
      toast("Reading it now. Usually under a minute.");
    }
    setAdding(false);
  }

  const passages = sources.reduce((n, s) => n + s.chunks, 0);
  const latest = sources.reduce<string | null>(
    (m, s) => (s.chunks > 0 && (!m || s.lastReadAt > m) ? s.lastReadAt : m),
    null,
  );
  const attention = sources.filter(
    (s) => s.status === "stale" || s.status === "failed",
  ).length;

  const [kindFilter, setKindFilter] = React.useState<"all" | KnowledgeSource["kind"]>("all");
  const [query, setQuery] = React.useState("");

  const q = query.trim().toLowerCase();
  const visible = sources.filter(
    (s) =>
      (kindFilter === "all" || s.kind === kindFilter) &&
      (!q || s.label.toLowerCase().includes(q) || s.detail.toLowerCase().includes(q)),
  );

  function reread(src: KnowledgeSource) {
    setSources((all) => all.map((x) => (x.id === src.id ? { ...x, status: "reading" } : x)));
    const id = window.setTimeout(() => {
      setSources((all) =>
        all.map((x) =>
          x.id === src.id
            ? { ...x, status: "ready", lastReadAt: NOW.toISOString(), chunks: Math.max(1, x.chunks) }
            : x,
        ),
      );
    }, 1600);
    timers.current.push(id);
  }

  function remove(src: KnowledgeSource) {
    setSources((all) => all.filter((x) => x.id !== src.id));
    toast("Removed. Agents stop using it now.");
  }

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------ head */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-ink">
            Knowledge
          </h2>
          <p className="mt-1.5 max-w-[62ch] text-base leading-relaxed text-ink-muted">
            What your agents know about the business. Anything you add is used
            on the very next call, by every agent that needs it.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setAdding((v) => !v)}
          aria-expanded={adding}
          aria-controls="add-knowledge"
        >
          <PlusIcon aria-hidden weight="bold" />
          Add knowledge
        </Button>
      </div>

      {/* ------------------------------------------------------------ add */}
      {adding ? (
        <Card id="add-knowledge">
          <CardHeader>
            <div>
              <CardTitle>Add something the agent should know</CardTitle>
              <CardDescription>Three ways in. Pick whichever you already have.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div role="group" aria-label="How you want to add it" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {WAYS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  aria-pressed={way === w.id}
                  onClick={() => setWay(w.id)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left transition-colors duration-150",
                    way === w.id
                      ? "border-primary/40 bg-primary-wash"
                      : "border-rule bg-canvas hover:border-rule-control",
                  )}
                >
                  <span className={cn("block text-sm font-semibold", way === w.id ? "text-primary" : "text-ink")}>
                    {w.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted">{w.hint}</span>
                </button>
              ))}
            </div>

            <form onSubmit={submitAdd} className="mt-5 space-y-4">
              {way === "website" ? (
                <Field
                  label="The address"
                  htmlFor="kb-url"
                  hint="Paste one page, or your home page and we read everything linked from it."
                >
                  <Input type="url" inputMode="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} required />
                </Field>
              ) : null}
              {way === "text" ? (
                <>
                  <Field
                    label="What should the agent know"
                    htmlFor="kb-note-body"
                    hint="Plain sentences work best. Hours, a policy, group rates, where to park."
                  >
                    <Textarea
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                      placeholder="Groups of eight or more get the group rate. Under twelves ride free with a paying adult."
                      required
                    />
                  </Field>
                  <Field label="Call it" htmlFor="kb-note-title" hint="So you can find it again in the list.">
                    <Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Group rates" />
                  </Field>
                </>
              ) : null}
              {way === "document" ? (
                <Field label="The file" htmlFor="kb-file" hint="PDF, Word, or a spreadsheet. Password protected files cannot be read.">
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-rule-control bg-canvas px-4 py-5">
                    <FileTextIcon className="size-6 shrink-0 text-ink-faint" aria-hidden />
                    <div className="min-w-0 flex-1 text-sm text-ink-muted">Drop it here, or</div>
                    <Button type="button" variant="secondary" size="sm">
                      Choose a file
                    </Button>
                  </div>
                </Field>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="primary">
                  {way === "website" ? "Read it" : way === "text" ? "Add it" : "Upload it"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {/* ------------------------------------------------------------ health */}
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Sources", value: fmt.count(sources.length), icon: StackIcon, tone: "var(--color-series-1)" },
          {
            label: "Passages learned",
            value: fmt.count(passages),
            icon: DatabaseIcon,
            tone: "var(--color-series-2)",
            note: latest ? `last read ${fmt.relative(latest, NOW)}` : undefined,
          },
          { label: "Unanswered this week", value: fmt.count(gaps.length), icon: QuestionIcon, tone: "var(--color-series-4)" },
          { label: "Need attention", value: fmt.count(attention), icon: WarningCircleIcon, tone: "var(--color-series-3)" },
        ].map((t) => {
          const TIcon = t.icon;
          return (
            <li
              key={t.label}
              style={{ "--tone": t.tone } as React.CSSProperties}
              className="flex items-center gap-3.5 rounded-2xl border border-rule bg-surface px-4 py-3.5 shadow-[0_1px_2px_rgb(10_10_10/0.04)]"
            >
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--tone)_14%,transparent)] text-[var(--tone)]"
              >
                <TIcon className="size-5" />
              </span>
              <span className="min-w-0">
                <span data-numeric className="block font-display text-2xl font-semibold leading-none tracking-[-0.02em] text-ink">
                  {t.value}
                </span>
                <span className="mt-1 block truncate text-xs text-ink-muted">{t.label}</span>
                {"note" in t && t.note ? (
                  <span className="block truncate text-xs text-ink-muted">{t.note}</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
        {/* ---------------------------------------------------------- sources */}
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-4">
            <div role="group" aria-label="Show sources" className="flex flex-wrap gap-1 rounded-full bg-panel p-1">
              {(["all", ...KIND_ORDER] as const).map((k) => {
                const n = k === "all" ? sources.length : sources.filter((s) => s.kind === k).length;
                if (k !== "all" && n === 0) return null;
                const active = kindFilter === k;
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setKindFilter(k)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                      active ? "bg-surface text-ink shadow-raised" : "text-ink-muted hover:text-ink",
                    )}
                  >
                    {k === "all" ? "All" : KIND[k].label}{" "}
                    <span data-numeric className="text-xs text-ink-muted">
                      {n}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="relative w-full sm:w-60">
              <MagnifyingGlassIcon
                aria-hidden
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
              />
              <label htmlFor="kb-search" className="sr-only">
                Search sources
              </label>
              <Input
                id="kb-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sources"
                className="rounded-full pl-10"
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={MagnifyingGlassIcon}
              title="Nothing matches that"
              body="Try another word, or show every source."
              className="py-12"
            />
          ) : (
            <ul>
              {visible.map((src) => {
                const st = STATUS[src.status];
                const StatusIcon = st.icon;
                const kind = KIND[src.kind];
                const KindIcon = kind.icon;
                return (
                  <li
                    key={src.id}
                    style={{ "--tone": KIND_TONE[src.kind] } as React.CSSProperties}
                    className="flex items-start gap-4 border-b border-rule px-5 py-4 transition-colors last:border-b-0 hover:bg-panel/60"
                  >
                    <span
                      aria-hidden
                      className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--tone)_14%,transparent)] text-[var(--tone)]"
                    >
                      <KindIcon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="min-w-0 truncate text-base font-semibold text-ink">{src.label}</p>
                        <Badge tone={st.tone}>
                          <StatusIcon className="size-3" aria-hidden />
                          {st.label}
                        </Badge>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-sm text-ink-muted">{src.detail}</p>
                      <p className="mt-1.5 text-xs text-ink-muted">
                        {kind.label}
                        {" · "}
                        {src.chunks > 0
                          ? `${fmt.count(src.chunks)} passages, read ${fmt.relative(src.lastReadAt, NOW)}`
                          : `last tried ${fmt.relative(src.lastReadAt, NOW)}`}
                        {" · used by "}
                        <Link
                          href={`/agents/${src.agentId}` as Route}
                          className="font-medium text-ink underline-offset-2 hover:underline"
                        >
                          {agentName(src.agentId)}
                        </Link>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="quiet"
                        size="icon-sm"
                        aria-label={src.status === "failed" ? `Try reading ${src.label} again` : `Read ${src.label} again`}
                        title={src.status === "failed" ? "Try again" : "Read it again"}
                        disabled={src.status === "reading"}
                        onClick={() => reread(src)}
                      >
                        <ArrowsClockwiseIcon aria-hidden className={cn(src.status === "reading" && "animate-spin")} />
                      </Button>
                      <Button
                        variant="quiet"
                        size="icon-sm"
                        aria-label={`Remove ${src.label}`}
                        title="Remove"
                        onClick={() => remove(src)}
                      >
                        <TrashIcon aria-hidden />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* ---------------------------------------------------------- rail */}
        <div className="space-y-6">
          {/* Today only. */}
          <Card>
            <CardHeader className="pb-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarBlankIcon aria-hidden className="size-5 text-primary" />
                  Today only
                </CardTitle>
                <CardDescription>True today, forgotten at midnight.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {editingNotice ? (
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setNoticeText(noticeDraft.trim());
                    setEditingNotice(false);
                    toast.success(noticeDraft.trim() ? "Set. Agents say it until midnight." : "Cleared.");
                  }}
                >
                  <Field label="What is different today" htmlFor="kb-notice">
                    <Textarea
                      autoFocus
                      value={noticeDraft}
                      onChange={(e) => setNoticeDraft(e.target.value)}
                      placeholder="The 2pm sailing is cancelled for wind. Everyone booked on it has been moved to 4pm."
                    />
                  </Field>
                  <div className="flex gap-2">
                    <Button type="submit" variant="primary" size="sm">
                      Set for today
                    </Button>
                    <Button
                      type="button"
                      variant="quiet"
                      size="sm"
                      onClick={() => {
                        setNoticeDraft(noticeText);
                        setEditingNotice(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : noticeText ? (
                <>
                  <p className="rounded-xl bg-primary-wash px-4 py-3 text-sm leading-relaxed text-ink">{noticeText}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-ink-muted">
                      Set by {initialNotice.setBy.split(" ")[0]}, {fmt.time(initialNotice.setAt)}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setNoticeDraft(noticeText);
                          setEditingNotice(true);
                        }}
                      >
                        Change
                      </Button>
                      <Button
                        variant="quiet"
                        size="sm"
                        onClick={() => {
                          setNoticeText("");
                          setNoticeDraft("");
                          toast.success("Cleared.");
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <p className="flex items-start gap-2 text-sm text-ink-muted">
                    <LightbulbIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
                    A trip cancelled for weather, a road closed, someone out sick.
                  </p>
                  <Button variant="secondary" size="sm" className="mt-3" onClick={() => setEditingNotice(true)}>
                    Set something for today
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Unanswered. */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <QuestionIcon aria-hidden className="size-5 text-[var(--color-series-4)]" />
                  Asked, not answered
                </CardTitle>
                <CardDescription>Answer one and it is knowledge from the next call.</CardDescription>
              </div>
            </CardHeader>
            {gaps.length === 0 ? (
              <CardContent>
                <p className="flex items-center gap-2 text-sm text-ink-muted">
                  <CheckCircleIcon aria-hidden className="size-4 text-success" />
                  Every question this week had an answer.
                </p>
              </CardContent>
            ) : (
              <ul className="border-t border-rule">
                {gaps.map((gap) => {
                  const open = answering === gap.id;
                  const ChannelIcon = gap.channel === "voice" ? PhoneIcon : ChatCircleDotsIcon;
                  return (
                    <li key={gap.id} className="border-b border-rule px-5 py-3.5 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-ink">{gap.question}</p>
                          <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-ink-muted">
                            <span className="whitespace-nowrap rounded-full bg-panel px-2 py-0.5 font-medium text-ink">
                              {gap.askedCount7d}× this week
                            </span>
                            <span className="inline-flex items-center gap-1 whitespace-nowrap">
                              <ChannelIcon aria-hidden className="size-3.5" />
                              {FALLBACK[gap.fallback]}
                            </span>
                          </p>
                        </div>
                        {!open ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setAnswering(gap.id);
                              setAnswer("");
                            }}
                          >
                            Answer
                          </Button>
                        ) : null}
                      </div>
                      {open ? (
                        <form
                          className="mt-3 space-y-2.5"
                          onSubmit={(e) => {
                            e.preventDefault();
                            saveAnswer(gap);
                          }}
                        >
                          <Field label="The answer, as you would say it" htmlFor={`kb-answer-${gap.id}`}>
                            <Textarea
                              autoFocus
                              value={answer}
                              onChange={(e) => setAnswer(e.target.value)}
                              className="min-h-20"
                              required
                            />
                          </Field>
                          <div className="flex gap-2">
                            <Button type="submit" variant="primary" size="sm">
                              Save
                            </Button>
                            <Button type="button" variant="quiet" size="sm" onClick={() => setAnswering(null)}>
                              Not now
                            </Button>
                          </div>
                        </form>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
