"use client";

import * as React from "react";
import {
  ArrowUpIcon,
  ChatCircleDotsIcon,
  PhoneCallIcon,
  PhoneDisconnectIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { LiveIndicator } from "@/components/ui/status";
import { duration } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The persistent test panel. Always available while editing, chat and voice
 * both, because confidence in this product comes from hearing it work rather
 * than from reading a configuration.
 *
 * Call state is driven through lib/voice's interface. During the frontend
 * phase that interface is backed by a simulator, so nothing here depends on a
 * media stack existing.
 */

interface Turn {
  id: number;
  role: "you" | "agent";
  text: string;
}

const SCRIPTED: string[] = [
  "Thanks for calling. I can check the schedule, answer questions about what we offer, or get you booked. What do you need?",
  "I can do that. Is this your first visit with us, or have you been in before?",
  "Got it. I have Thursday at 9:40 in the morning, or Friday at 2:20 in the afternoon. Which one works?",
  "Booked. I am texting you the confirmation and the new patient forms now. Anything else before I let you go?",
];

export function TestPanel({ greeting }: { greeting: string }) {
  const [mode, setMode] = React.useState<"chat" | "voice">("chat");
  const [turns, setTurns] = React.useState<Turn[]>([
    { id: 0, role: "agent", text: greeting },
  ]);
  const [input, setInput] = React.useState("");
  const [callState, setCallState] = React.useState<
    "idle" | "connecting" | "live"
  >("idle");
  const [elapsed, setElapsed] = React.useState(0);
  const nextId = React.useRef(1);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (callState !== "live") return;
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(t);
  }, [callState]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const reply =
      SCRIPTED[
        Math.min(
          turns.filter((t) => t.role === "you").length,
          SCRIPTED.length - 1,
        )
      ]!;
    setTurns((prev) => [
      ...prev,
      { id: nextId.current++, role: "you", text },
      { id: nextId.current++, role: "agent", text: reply },
    ]);
    setInput("");
  }

  function toggleCall() {
    if (callState === "live") {
      setCallState("idle");
      setElapsed(0);
      return;
    }
    setCallState("connecting");
    window.setTimeout(() => setCallState("live"), 1100);
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-rule bg-surface shadow-raised">
      <div className="flex items-center justify-between gap-2 border-b border-rule px-4 py-3">
        <h3 className="font-display text-sm font-semibold text-ink">
          Try it out
        </h3>
        {callState === "live" ? (
          <LiveIndicator label={duration(elapsed)} />
        ) : (
          <div className="flex rounded-sm border border-rule-control p-0.5">
            <button
              type="button"
              onClick={() => setMode("chat")}
              className={cn(
                "cursor-pointer rounded-xs px-2 py-1 text-2xs font-medium transition-colors",
                mode === "chat"
                  ? "bg-primary text-on-primary"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setMode("voice")}
              className={cn(
                "cursor-pointer rounded-xs px-2 py-1 text-2xs font-medium transition-colors",
                mode === "voice"
                  ? "bg-primary text-on-primary"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              Voice
            </button>
          </div>
        )}
      </div>

      {mode === "chat" ? (
        <>
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {turns.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "max-w-[85%] rounded-md px-3 py-2 text-sm leading-relaxed",
                  t.role === "agent"
                    ? "bg-sunken text-ink"
                    : "ml-auto bg-primary text-on-primary",
                )}
              >
                {t.text}
              </div>
            ))}
          </div>
          <form
            onSubmit={send}
            className="flex items-center gap-2 border-t border-rule p-3"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type like a customer would"
              aria-label="Message the agent"
            />
            <Button
              type="submit"
              variant="primary"
              size="icon"
              disabled={!input.trim()}
              aria-label="Send"
            >
              <ArrowUpIcon aria-hidden weight="bold" />
            </Button>
          </form>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-8 text-center">
          <div
            className={cn(
              "flex size-14 items-center justify-center rounded-full",
              callState === "live"
                ? "bg-signal-wash text-signal"
                : "bg-primary-wash text-primary",
            )}
          >
            {callState === "live" ? (
              <ChatCircleDotsIcon
                className="size-6 animate-live-pulse motion-reduce:animate-none"
                weight="fill"
                aria-hidden
              />
            ) : (
              <PhoneCallIcon className="size-6" weight="fill" aria-hidden />
            )}
          </div>
          <p className="mt-3.5 text-sm font-medium text-ink">
            {callState === "idle" && "Ready when you are"}
            {callState === "connecting" && "Connecting"}
            {callState === "live" && "Connected. Say hello."}
          </p>
          <p className="mt-1 max-w-[34ch] text-xs leading-relaxed text-ink-muted">
            {callState === "live"
              ? "Ask for an appointment, or ask something it should not know."
              : "This is a test line. Nothing reaches your real number."}
          </p>
          <Button
            variant={callState === "live" ? "danger" : "primary"}
            className="mt-4"
            loading={callState === "connecting"}
            onClick={toggleCall}
          >
            {callState === "live" ? (
              <>
                <PhoneDisconnectIcon aria-hidden weight="fill" />
                End call
              </>
            ) : (
              "Start a test call"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
