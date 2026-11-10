"use client";

import * as React from "react";
import {
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import type { Message } from "@/lib/api/types";
import { duration } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Call review. The transcript is the primary representation and the audio is
 * secondary, so this screen is fully usable with sound muted or absent.
 *
 * The playhead is a ref-driven value, never useState, because it updates on
 * every animation frame and re-rendering the tree at that rate collapses on
 * mobile. Only the active-turn index is state, and it changes a few times a
 * minute.
 *
 * There is no real audio behind the fixtures, so playback is simulated against
 * the known duration. The controls and the sync behavior are the real thing.
 */
export function TranscriptPlayer({
  transcript,
  totalSeconds,
  hasRecording,
}: {
  transcript: Message[];
  totalSeconds: number;
  hasRecording: boolean;
}) {
  const [playing, setPlaying] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const positionRef = React.useRef(0);
  const barRef = React.useRef<HTMLDivElement>(null);
  const readoutRef = React.useRef<HTMLSpanElement>(null);
  const listRef = React.useRef<HTMLOListElement>(null);

  const indexAt = React.useCallback(
    (seconds: number) => {
      let idx = -1;
      for (let i = 0; i < transcript.length; i++) {
        if (transcript[i]!.atSeconds <= seconds) idx = i;
        else break;
      }
      return idx;
    },
    [transcript],
  );

  const paint = React.useCallback(
    (seconds: number) => {
      positionRef.current = seconds;
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${Math.min(1, seconds / totalSeconds)})`;
      }
      if (readoutRef.current) {
        readoutRef.current.textContent = duration(Math.floor(seconds));
      }
    },
    [totalSeconds],
  );

  React.useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const next = positionRef.current + dt;

      if (next >= totalSeconds) {
        paint(totalSeconds);
        setPlaying(false);
        return;
      }
      paint(next);
      const idx = indexAt(next);
      setActiveIndex((prev) => (prev === idx ? prev : idx));
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, totalSeconds, paint, indexAt]);

  // Keep the active turn in view without yanking the page.
  React.useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIndex]);

  function seekTo(seconds: number) {
    const clamped = Math.max(0, Math.min(totalSeconds, seconds));
    paint(clamped);
    setActiveIndex(indexAt(clamped));
  }

  return (
    <div>
      {hasRecording ? (
        <div className="rounded-lg border border-rule bg-surface p-4 shadow-raised">
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="icon"
              onClick={() => setPlaying((p) => !p)}
              aria-label={
                playing ? "Pause the recording" : "Play the recording"
              }
            >
              {playing ? (
                <PauseIcon weight="fill" aria-hidden />
              ) : (
                <PlayIcon weight="fill" aria-hidden />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => seekTo(positionRef.current - 10)}
              aria-label="Back 10 seconds"
            >
              <SkipBackIcon aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => seekTo(positionRef.current + 10)}
              aria-label="Forward 10 seconds"
            >
              <SkipForwardIcon aria-hidden />
            </Button>

            <div className="flex flex-1 items-center gap-2.5">
              <span
                ref={readoutRef}
                data-numeric
                className="w-11 shrink-0 font-mono text-xs text-ink-muted"
              >
                0:00
              </span>
              <div
                role="slider"
                tabIndex={0}
                aria-label="Seek within the recording"
                aria-valuemin={0}
                aria-valuemax={totalSeconds}
                aria-valuenow={Math.floor(positionRef.current)}
                aria-valuetext={`${duration(Math.floor(positionRef.current))} of ${duration(totalSeconds)}`}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") {
                    e.preventDefault();
                    seekTo(positionRef.current + 5);
                  }
                  if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    seekTo(positionRef.current - 5);
                  }
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    setPlaying((p) => !p);
                  }
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  seekTo(((e.clientX - rect.left) / rect.width) * totalSeconds);
                }}
                className="h-2 flex-1 cursor-pointer overflow-hidden rounded-full bg-sunken"
              >
                <div
                  ref={barRef}
                  className="h-full origin-left rounded-full bg-primary"
                  style={{ transform: "scaleX(0)" }}
                />
              </div>
              <span
                data-numeric
                className="w-11 shrink-0 text-right font-mono text-xs text-ink-faint"
              >
                {duration(totalSeconds)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <p className="rounded-sm border border-rule bg-sunken px-3.5 py-2.5 text-xs text-ink-muted">
          Website chats are not recorded. The full transcript is below.
        </p>
      )}

      <ol ref={listRef} className="mt-4 space-y-3">
        {transcript.map((m, i) => {
          const isAgent = m.role === "agent";
          const active = i === activeIndex;
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => seekTo(m.atSeconds)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex w-full cursor-pointer gap-3 rounded-sm px-3 py-2.5 text-left transition-colors",
                  active ? "bg-primary-wash" : "hover:bg-panel",
                )}
              >
                <span
                  data-numeric
                  className="w-10 shrink-0 pt-0.5 font-mono text-2xs text-ink-faint"
                >
                  {duration(m.atSeconds)}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-2xs font-medium",
                      isAgent ? "text-primary" : "text-ink-muted",
                    )}
                  >
                    {isAgent ? "Agent" : "Caller"}
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-ink">
                    {m.text}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
