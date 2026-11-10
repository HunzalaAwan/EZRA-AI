import type { Metadata } from "next";
import { IntegrationsDirectory } from "@/components/app/integrations-directory";
import {
  apiKeys,
  bookingLinks,
  integrations,
  webhookDeliveries,
  webhookEndpoints,
} from "@/lib/mock/fixtures";

export const metadata: Metadata = { title: "Integrations" };

/**
 * The apps your agents write into, as a searchable directory, with the API
 * and webhooks on their own tab for whoever builds on top of EZRA.
 *
 * `?tab=developers` opens straight on the second tab.
 */
export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const connected = integrations.filter((i) => i.status !== "available").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-ink">Integrations</h2>
        <p className="mt-1.5 max-w-[62ch] text-base leading-relaxed text-ink-muted">
          Connect the apps your business already runs on, so your agents book, file, and alert in the places you
          already check. {connected} connected so far.
        </p>
      </div>
      <IntegrationsDirectory
        apps={integrations}
        linkStats={{ sent7d: bookingLinks.sent7d, booked7d: bookingLinks.booked7d }}
        apiKeys={apiKeys}
        endpoints={webhookEndpoints}
        deliveries={webhookDeliveries}
        initialTab={tab === "developers" ? "developers" : "apps"}
      />
    </div>
  );
}
