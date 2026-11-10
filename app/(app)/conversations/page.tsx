import Link from "next/link";
import type { Route } from "next";
import type { Metadata } from "next";
import {
  ChatCircleDotsIcon,
  ChatsCircleIcon,
  PhoneIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { OutcomeBadge } from "@/components/ui/status";
import { Button } from "@/components/ui/button";
import { ConversationFilters } from "@/components/app/conversation-filters";
import { agents, conversations, NOW } from "@/lib/mock/fixtures";
import * as fmt from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Conversations" };

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const channel = typeof params.channel === "string" ? params.channel : "all";
  const outcome = typeof params.outcome === "string" ? params.outcome : "all";
  const agentId = typeof params.agent === "string" ? params.agent : "all";
  const reviewOnly = params.review === "1";

  const filtered = conversations.filter((c) => {
    if (channel !== "all" && c.channel !== channel) return false;
    if (outcome !== "all" && c.outcome !== outcome) return false;
    if (agentId !== "all" && c.agentId !== agentId) return false;
    if (reviewOnly && !c.needsReview) return false;
    return true;
  });

  const anyFilter =
    channel !== "all" || outcome !== "all" || agentId !== "all" || reviewOnly;

  return (
    <div className="space-y-5">
      <div>
        <p className="max-w-[62ch] text-base leading-relaxed text-ink-muted">
          Every call and chat your agents handled. Open one to hear the
          recording and read what was said.
        </p>
      </div>

      <ConversationFilters
        agents={agents.map((a) => ({ id: a.id, name: a.name }))}
      />

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            icon={ChatsCircleIcon}
            title={anyFilter ? "Nothing matches those filters" : "No conversations yet"}
            body={
              anyFilter
                ? "Try widening the channel or the outcome. Your agents may not have handled anything like this in the period shown."
                : "When someone calls your number or opens the website chat, the conversation lands here with a recording and a transcript."
            }
            action={
              anyFilter ? (
                <Button asChild variant="secondary">
                  <Link href="/conversations">Clear the filters</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <CardContent className="p-0">
            {/* Table at md and up. Below md the same data stacks into rows. */}
            <div
              aria-label="Conversations"
            >
              <div
                aria-hidden
                className="hidden border-b border-rule bg-sunken px-5 py-2.5 text-2xs font-medium text-ink-muted md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_7rem_5rem_6rem] md:gap-4"
              >
                <span>Caller</span>
                <span>Agent</span>
                <span>Outcome</span>
                <span className="text-right">
                  Length
                </span>
                <span className="text-right">
                  When
                </span>
              </div>

              <ul>
                {filtered.map((c) => {
                  const Icon = c.channel === "voice" ? PhoneIcon : ChatCircleDotsIcon;
                  return (
                    <li key={c.id} className="border-b border-rule last:border-b-0">
                      <Link
                        href={`/conversations/${c.id}` as Route}
                        className={cn(
                          "block px-5 py-3.5 transition-colors hover:bg-panel",
                          "md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_7rem_5rem_6rem] md:items-center md:gap-4",
                        )}
                      >
                        <span className="block min-w-0">
                          <span className="flex items-center gap-2">
                            <Icon
                              className="size-4 shrink-0 text-ink-faint"
                              aria-hidden
                            />
                            <span className="truncate text-sm font-medium text-ink">
                              {c.contactName ?? fmt.phone(c.contactNumber)}
                            </span>
                            {c.needsReview ? (
                              <WarningCircleIcon
                                className="size-4 shrink-0 text-signal"
                                aria-label="Needs review"
                              />
                            ) : null}
                          </span>
                          <span className="mt-1 block line-clamp-2 pl-6 text-xs leading-relaxed text-ink-muted md:line-clamp-1">
                            {c.summary}
                          </span>
                        </span>

                        <span
                          className="mt-2 block truncate pl-6 text-xs text-ink-muted md:mt-0 md:pl-0"
                        >
                          {c.agentName}
                        </span>

                        <span className="mt-2 block pl-6 md:mt-0 md:pl-0">
                          <OutcomeBadge outcome={c.outcome} />
                        </span>

                        <span
                          data-numeric
                          className="mt-2 block pl-6 font-mono text-xs text-ink-muted md:mt-0 md:pl-0 md:text-right"
                        >
                          {fmt.duration(c.durationSeconds)}
                        </span>

                        <span
                          className="mt-1 block pl-6 text-2xs text-ink-faint md:mt-0 md:pl-0 md:text-right"
                        >
                          {fmt.relative(c.startedAt, NOW)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {filtered.length > 0 ? (
        <p className="text-xs text-ink-muted">
          Showing {fmt.count(filtered.length)} of{" "}
          {fmt.count(conversations.length)} conversations.
        </p>
      ) : null}
    </div>
  );
}
