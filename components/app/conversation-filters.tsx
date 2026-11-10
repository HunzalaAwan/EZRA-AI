"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { XIcon } from "@phosphor-icons/react";
import { Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

/**
 * Filters live in the URL so a filtered view is shareable and the back button
 * behaves. One row above the content, per the dataviz interaction rules.
 */
export function ConversationFilters({
  agents,
}: {
  agents: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function set(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "all" || value === "") next.delete(key);
    else next.set(key, value);
    router.replace(`${pathname}?${next.toString()}` as Route, {
      scroll: false,
    });
  }

  const active = Array.from(params.keys()).length > 0;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-36 flex-1 sm:flex-none">
        <label
          htmlFor="filter-channel"
          className="mb-1 block text-2xs font-medium text-ink-muted"
        >
          Channel
        </label>
        <Select
          id="filter-channel"
          value={params.get("channel") ?? "all"}
          onChange={(e) => set("channel", e.target.value)}
        >
          <option value="all">Phone and chat</option>
          <option value="voice">Phone only</option>
          <option value="chat">Website chat only</option>
        </Select>
      </div>

      <div className="min-w-36 flex-1 sm:flex-none">
        <label
          htmlFor="filter-outcome"
          className="mb-1 block text-2xs font-medium text-ink-muted"
        >
          Outcome
        </label>
        <Select
          id="filter-outcome"
          value={params.get("outcome") ?? "all"}
          onChange={(e) => set("outcome", e.target.value)}
        >
          <option value="all">Any outcome</option>
          <option value="booked">Booked</option>
          <option value="lead">Lead captured</option>
          <option value="answered">Answered</option>
          <option value="transferred">Transferred</option>
          <option value="message">Message taken</option>
          <option value="missed">Dropped</option>
        </Select>
      </div>

      <div className="min-w-40 flex-1 sm:flex-none">
        <label
          htmlFor="filter-agent"
          className="mb-1 block text-2xs font-medium text-ink-muted"
        >
          Agent
        </label>
        <Select
          id="filter-agent"
          value={params.get("agent") ?? "all"}
          onChange={(e) => set("agent", e.target.value)}
        >
          <option value="all">All agents</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>

      <label className="flex h-9.5 cursor-pointer items-center gap-2 rounded-sm border border-rule-control bg-surface px-3 text-sm text-ink transition-colors hover:bg-panel">
        <input
          type="checkbox"
          checked={params.get("review") === "1"}
          onChange={(e) => set("review", e.target.checked ? "1" : "all")}
          className="size-4 rounded-xs border-rule-control"
        />
        Needs a person
      </label>

      {active ? (
        <Button
          variant="quiet"
          size="sm"
          onClick={() => router.replace(pathname as Route, { scroll: false })}
        >
          <XIcon aria-hidden />
          Clear
        </Button>
      ) : null}
    </div>
  );
}
