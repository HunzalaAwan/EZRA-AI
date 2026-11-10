import type { Metadata } from "next";
import {
  CreditCardIcon,
  DownloadSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/status";
import { workspace } from "@/lib/mock/fixtures";
import * as fmt from "@/lib/format";

export const metadata: Metadata = { title: "Plan and usage" };

/**
 * Closed months. Each amount is the total for the minutes used in that period,
 * which is the only figure we can state: plan pricing is set per account and is
 * read from configuration, never written here.
 */
const INVOICES = [
  {
    id: "inv_2026_08",
    period: "August 2026",
    issuedOn: "Sep 1",
    minutes: 1394,
    amountCents: 48790,
  },
  {
    id: "inv_2026_07",
    period: "July 2026",
    issuedOn: "Aug 1",
    minutes: 1208,
    amountCents: 43120,
  },
  {
    id: "inv_2026_06",
    period: "June 2026",
    issuedOn: "Jul 1",
    minutes: 1331,
    amountCents: 45960,
  },
];

/** The card on file. Only the last four digits are ever stored or shown. */
const PAYMENT_METHOD = {
  brand: "Visa",
  last4: "4412",
  expires: "03/2029",
  receiptsTo: "billing@aldercreekdental.com",
};

const PERIOD_ENDS = "Sep 30";

export default function BillingPage() {
  const { minutesUsed, minutesIncluded } = workspace;
  const minutesLeft = Math.max(0, minutesIncluded - minutesUsed);
  const share = minutesUsed / minutesIncluded;
  const meterWidth = `${Math.min(100, share * 100)}%`;

  return (
    <div className="space-y-5">
      <div>
        <p className="max-w-[62ch] text-base leading-relaxed text-ink-muted">
          How many minutes your agents have spent on the phone this month, what
          the last few months came to, and the card we charge.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Minutes this month</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="flex items-baseline gap-2">
                <span
                  data-numeric
                  className="font-mono text-2xl text-ink"
                >
                  {fmt.count(minutesUsed)}
                </span>
                <span className="text-sm text-ink-muted">
                  of{" "}
                  <span data-numeric className="font-mono">
                    {fmt.count(minutesIncluded)}
                  </span>{" "}
                  minutes used
                </span>
              </p>

              {/* The bar repeats what the sentence above already says, so it
                  carries no meaning of its own and stays out of the reading. */}
              <div
                aria-hidden
                className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sunken"
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: meterWidth }}
                />
              </div>

              <dl className="mt-5 grid grid-cols-1 gap-3 border-t border-rule pt-4 md:grid-cols-3">
                <div>
                  <dt className="text-2xs text-ink-faint">Left this month</dt>
                  <dd data-numeric className="mt-0.5 font-mono text-sm text-ink">
                    {fmt.count(minutesLeft)}
                  </dd>
                </div>
                <div>
                  <dt className="text-2xs text-ink-faint">Share used</dt>
                  <dd data-numeric className="mt-0.5 font-mono text-sm text-ink">
                    {fmt.percent(share)}
                  </dd>
                </div>
                <div>
                  <dt className="text-2xs text-ink-faint">Month ends</dt>
                  <dd data-numeric className="mt-0.5 font-mono text-sm text-ink">
                    {PERIOD_ENDS}
                  </dd>
                </div>
              </dl>

              <p className="mt-4 max-w-[62ch] text-xs leading-relaxed text-ink-muted">
                Your minutes start over on the first of the month. If the
                practice runs past what is included, the agents keep answering
                and the extra minutes land on the next invoice. Nothing gets
                turned off mid month.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Invoices</CardTitle>
                <CardDescription className="mt-0.5">
                  Each one covers the minutes used in that month.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="border-t border-rule">
                {INVOICES.map((invoice) => (
                  <li
                    key={invoice.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-3.5 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-ink">{invoice.period}</p>
                      <p className="mt-0.5 text-2xs text-ink-faint">
                        <span data-numeric className="font-mono">
                          {fmt.count(invoice.minutes)}
                        </span>{" "}
                        minutes, charged{" "}
                        <span data-numeric className="font-mono">
                          {invoice.issuedOn}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        data-numeric
                        className="font-mono text-sm text-ink"
                      >
                        {fmt.money(invoice.amountCents, { cents: true })}
                      </span>
                      <Badge tone="success">Paid</Badge>
                      <Button
                        variant="quiet"
                        size="icon-sm"
                        aria-label={`Download the ${invoice.period} invoice`}
                      >
                        <DownloadSimpleIcon aria-hidden />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your plan</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-muted">Plan</dt>
                  <dd className="text-ink">{workspace.plan}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-muted">Minutes included</dt>
                  <dd data-numeric className="font-mono text-ink">
                    {fmt.count(minutesIncluded)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-muted">Monthly price</dt>
                  {/* Set per account. This surface reads it, it never sets it. */}
                  <dd className="text-ink-muted">Set on your account</dd>
                </div>
              </dl>

              <p className="mt-4 text-xs leading-relaxed text-ink-muted">
                Your price comes from the agreement the practice signed, so it
                is not editable here. If it does not match what you agreed to,
                tell us and we will correct it.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" size="sm">
                Ask about changing your plan
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Card on file</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sunken text-ink-faint"
                >
                  <CreditCardIcon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-ink">
                    {PAYMENT_METHOD.brand} ending in{" "}
                    <span data-numeric className="font-mono">
                      {PAYMENT_METHOD.last4}
                    </span>
                  </p>
                  <p className="mt-0.5 text-2xs text-ink-faint">
                    Expires{" "}
                    <span data-numeric className="font-mono">
                      {PAYMENT_METHOD.expires}
                    </span>
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-ink-muted">
                Receipts go to {PAYMENT_METHOD.receiptsTo}. We charge on the
                first of the month, after the month it covers has closed.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" size="sm">
                Update card
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
