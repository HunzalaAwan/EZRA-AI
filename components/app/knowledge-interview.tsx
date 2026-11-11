"use client";

import * as React from "react";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  MicrophoneIcon,
  RobotIcon,
  StopIcon,
  XIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { dictationSupported, startDictation, type Dictation, type DictationError } from "@/lib/voice/dictation";
import { cn } from "@/lib/utils";

/**
 * Talk it through: EZRA interviews the owner, one question at a time, and
 * every answer becomes something the agents know.
 *
 * For the owner who will never write a policy page but can explain the
 * business out loud in two minutes. Each answer can be spoken or typed, in any
 * mix. Nothing is saved until the end, where every answer is shown back as
 * what the agent will know, and any of them can be dropped.
 *
 * The questions name no trade. They are what a good new front desk hire would
 * ask on day one.
 */

const QUESTIONS = [
  {
    id: "hours",
    topic: "Opening hours",
    ask: "When are you open, and does that change by season or on holidays?",
  },
  {
    id: "first",
    topic: "What new customers ask",
    ask: "What do new customers usually ask before they book?",
  },
  {
    id: "prices",
    topic: "Talking about prices",
    ask: "What can the agent say about prices, and what should it never quote?",
  },
  {
    id: "urgent",
    topic: "Urgent calls",
    ask: "What counts as urgent for you, and what should happen when it is?",
  },
  {
    id: "dayone",
    topic: "Good to know",
    ask: "Anything else a good front desk person would know on their first day?",
  },
] as const;

export interface LearnedAnswer {
  topic: string;
  question: string;
  answer: string;
}

const MIC_ERROR: Record<DictationError, string> = {
  blocked: "Your microphone is blocked. Allow it from the address bar, or type your answer instead.",
  silence: "We did not hear anything. Try again a little closer to the microphone, or type it.",
  failed: "Listening stopped unexpectedly. Try again, or type your answer.",
};

export function KnowledgeInterview({
  onSave,
  onCancel,
}: {
  onSave: (answers: LearnedAnswer[]) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [draft, setDraft] = React.useState("");
  const [done, setDone] = React.useState(false);

  // Whether this browser can listen. Known only after mount, so the server and
  // the first client render agree; until then the microphone button waits.
  const [canListen, setCanListen] = React.useState<boolean | null>(null);
  const [listening, setListening] = React.useState(false);
  const [micError, setMicError] = React.useState<string | null>(null);
  const dictation = React.useRef<Dictation | null>(null);
  const base = React.useRef("");

  React.useEffect(() => setCanListen(dictationSupported()), []);
  React.useEffect(() => () => dictation.current?.stop(), []);

  const current = QUESTIONS[step];
  const answered = QUESTIONS.filter((q) => answers[q.id]?.trim());

  function stopListening() {
    dictation.current?.stop();
    dictation.current = null;
    setListening(false);
  }

  function toggleMic() {
    if (listening) return stopListening();
    setMicError(null);
    base.current = draft.trim();
    setListening(true);
    dictation.current = startDictation({
      onText: (t) => setDraft(base.current ? `${base.current} ${t}` : t),
      onEnd: () => {
        dictation.current = null;
        setListening(false);
      },
      onError: (e) => setMicError(MIC_ERROR[e]),
    });
  }

  function next(skip = false) {
    stopListening();
    if (current && !skip && draft.trim()) {
      setAnswers((a) => ({ ...a, [current.id]: draft.trim() }));
    }
    setDraft("");
    setMicError(null);
    if (step + 1 >= QUESTIONS.length) setDone(true);
    else setStep(step + 1);
  }

  function finish() {
    stopListening();
    if (current && draft.trim()) setAnswers((a) => ({ ...a, [current.id]: draft.trim() }));
    setDraft("");
    setDone(true);
  }

  // --------------------------------------------------------------- summary
  if (done) {
    const learned = QUESTIONS.filter((q) => answers[q.id]?.trim());
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <EzraMark />
          <p className="pt-1.5 text-sm leading-relaxed text-ink">
            {learned.length
              ? `Here is what I will know from now on. Drop anything that is not right, then save.`
              : "Nothing to save yet. Start again whenever you have a couple of minutes."}
          </p>
        </div>

        {learned.length ? (
          <ul className="space-y-2">
            {learned.map((q) => (
              <li key={q.id} className="flex items-start gap-3 rounded-xl border border-rule bg-canvas p-3.5">
                <CheckCircleIcon aria-hidden weight="fill" className="mt-0.5 size-5 shrink-0 text-success" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{q.topic}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{answers[q.id]}</p>
                </div>
                <Button
                  variant="quiet"
                  size="icon-sm"
                  aria-label={`Drop ${q.topic}`}
                  onClick={() => setAnswers(({ [q.id]: _gone, ...rest }) => rest)}
                >
                  <XIcon aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {learned.length ? (
            <Button
              variant="primary"
              onClick={() => onSave(learned.map((q) => ({ topic: q.topic, question: q.ask, answer: answers[q.id]! })))}
            >
              Save {learned.length} {learned.length === 1 ? "answer" : "answers"}
            </Button>
          ) : null}
          <Button
            variant="secondary"
            onClick={() => {
              setAnswers({});
              setStep(0);
              setDone(false);
            }}
          >
            Start again
          </Button>
          <Button variant="quiet" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------- interview
  return (
    <div className="space-y-4">
      {/* Progress. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium text-ink-muted">
          Question <span data-numeric className="font-mono text-ink">{step + 1}</span> of{" "}
          <span data-numeric className="font-mono text-ink">{QUESTIONS.length}</span>
        </p>
        <ol aria-hidden className="flex gap-1.5">
          {QUESTIONS.map((q, i) => (
            <li
              key={q.id}
              className={cn(
                "h-1.5 w-8 rounded-full transition-colors duration-300",
                i < step ? (answers[q.id] ? "bg-primary" : "bg-rule-control") : i === step ? "bg-primary/50" : "bg-sunken",
              )}
            />
          ))}
        </ol>
      </div>

      {/* The thread so far: what was learned, then the question being asked. */}
      <div aria-live="polite" className="space-y-3">
        {answered.length ? (
          <ul aria-label="Learned so far" className="flex flex-wrap gap-1.5">
            {answered.map((q) => (
              <li
                key={q.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-success-wash px-2.5 py-1 text-xs font-medium text-ink"
              >
                <CheckCircleIcon aria-hidden weight="fill" className="size-3.5 text-success" />
                {q.topic}
              </li>
            ))}
          </ul>
        ) : null}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current?.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-start gap-3"
          >
            <EzraMark />
            <p className="rounded-2xl rounded-tl-md bg-primary-wash px-4 py-3 text-base leading-relaxed text-ink">
              {current?.ask}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* The answer: speak it, type it, or both. */}
      <div
        className={cn(
          "rounded-2xl border bg-surface p-3 transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25",
          listening ? "border-primary" : "border-rule-control",
        )}
      >
        <label htmlFor="kb-talk-answer" className="sr-only">
          Your answer
        </label>
        <Textarea
          id="kb-talk-answer"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && draft.trim()) {
              e.preventDefault();
              next();
            }
          }}
          placeholder={listening ? "Listening. Speak naturally, as you would to a new hire." : "Type your answer, or press the microphone and say it."}
          className="min-h-20 resize-none border-0 bg-transparent px-1 focus:ring-0 focus:ring-offset-0"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleMic}
            disabled={canListen !== true}
            aria-pressed={listening}
            aria-label={listening ? "Stop listening" : "Answer out loud"}
            className={cn(
              "relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-45",
              listening ? "bg-danger text-on-primary" : "bg-ink text-canvas hover:bg-ink/85",
            )}
          >
            {listening ? (
              <span aria-hidden className="absolute inset-0 animate-halo rounded-full border-2 border-danger motion-reduce:hidden" />
            ) : null}
            {listening ? <StopIcon aria-hidden weight="fill" className="size-4.5" /> : <MicrophoneIcon aria-hidden className="size-5" />}
          </button>

          {listening ? (
            <span className="flex items-center gap-2 text-sm text-ink">
              <Bars />
              Listening
            </span>
          ) : (
            <span className="text-xs text-ink-muted">
              {canListen === false
                ? "Speaking needs Chrome, Edge, or Safari. Type your answer instead."
                : "Speak or type. Ctrl and Enter to send."}
            </span>
          )}

          <span className="ml-auto flex flex-wrap gap-2">
            <Button variant="quiet" size="sm" onClick={() => next(true)}>
              Skip
            </Button>
            <Button variant="primary" size="sm" onClick={() => next()} disabled={!draft.trim()}>
              {step + 1 >= QUESTIONS.length ? "Done" : "Next question"}
              <ArrowRightIcon aria-hidden />
            </Button>
          </span>
        </div>
        {micError ? (
          <p role="alert" className="mt-2 rounded-lg bg-danger-wash px-3 py-2 text-xs text-ink">
            {micError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {answered.length ? (
          <Button variant="secondary" onClick={finish}>
            Finish and review
          </Button>
        ) : null}
        <Button variant="quiet" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function EzraMark() {
  return (
    <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
      <RobotIcon className="size-5" />
    </span>
  );
}

/** A small live level, so the owner can see they are being heard. */
function Bars() {
  return (
    <span aria-hidden className="flex h-4 items-end gap-0.5">
      {[0.5, 1, 0.7, 0.9, 0.6].map((h, i) => (
        <motion.span
          key={i}
          className="w-1 rounded-full bg-primary"
          style={{ height: `${h * 100}%`, transformOrigin: "bottom" }}
          animate={{ scaleY: [0.35, 1, 0.5, 0.85, 0.35] }}
          transition={{ duration: 0.9 + i * 0.12, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}
