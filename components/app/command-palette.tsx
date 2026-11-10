"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Command } from "cmdk";
import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";
import { ALL_NAV } from "./nav";
import { agents, conversations } from "@/lib/mock/fixtures";
import { phone } from "@/lib/format";

/**
 * One path to everything. This audience benefits from a single entry point
 * more than most, because they use the app infrequently and under time
 * pressure.
 */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  function go(href: Route) {
    onOpenChange(false);
    router.push(href);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close search"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 cursor-default bg-[rgb(31_27_22/0.32)]"
      />
      <Command
        label="Search EZRA"
        loop
        className="relative mx-auto mt-[12vh] w-[calc(100vw-2rem)] max-w-xl overflow-hidden rounded-lg border border-rule bg-surface shadow-overlay"
      >
        <div className="flex items-center gap-2.5 border-b border-rule px-4">
          <MagnifyingGlassIcon
            className="size-4 shrink-0 text-ink-faint"
            aria-hidden
          />
          <Command.Input
            autoFocus
            placeholder="Search agents, conversations, and settings"
            className="h-12 w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-faint"
          />
          <kbd className="shrink-0 rounded-xs border border-rule bg-sunken px-1.5 font-mono text-2xs text-ink-faint">
            Esc
          </kbd>
        </div>

        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-8 text-center text-sm text-ink-muted">
            Nothing matched that. Try an agent name or a caller.
          </Command.Empty>

          <Command.Group
            heading="Actions"
            className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-ink-faint"
          >
            <Item onSelect={() => go("/agents/new")}>
              <PlusIcon className="size-4 text-ink-faint" aria-hidden />
              Create a new agent
            </Item>
          </Command.Group>

          <Command.Group
            heading="Go to"
            className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-ink-faint"
          >
            {ALL_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Item key={item.href} onSelect={() => go(item.href)}>
                  <Icon className="size-4 text-ink-faint" aria-hidden />
                  {item.label}
                </Item>
              );
            })}
          </Command.Group>

          <Command.Group
            heading="Agents"
            className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-ink-faint"
          >
            {agents.map((a) => (
              <Item key={a.id} onSelect={() => go(`/agents/${a.id}` as Route)}>
                <span className="truncate">{a.name}</span>
                <span className="ml-auto shrink-0 text-2xs text-ink-faint">
                  {a.status === "live"
                    ? "Live"
                    : a.status === "paused"
                      ? "Paused"
                      : "Draft"}
                </span>
              </Item>
            ))}
          </Command.Group>

          <Command.Group
            heading="Recent conversations"
            className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-ink-faint"
          >
            {conversations.slice(0, 4).map((c) => (
              <Item
                key={c.id}
                value={`${c.contactName ?? ""} ${c.contactNumber ?? ""} ${c.summary}`}
                onSelect={() => go(`/conversations/${c.id}` as Route)}
              >
                <span className="truncate">
                  {c.contactName ?? phone(c.contactNumber)}
                </span>
                <span className="ml-auto shrink-0 font-mono text-2xs text-ink-faint">
                  {c.agentName}
                </span>
              </Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}

function Item({
  children,
  onSelect,
  value,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  value?: string;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm text-ink data-[selected=true]:bg-panel"
    >
      {children}
    </Command.Item>
  );
}
