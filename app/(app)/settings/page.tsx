import type { Metadata } from "next";
import { UserPlusIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, Input, Select, Switch } from "@/components/ui/field";
import { Badge, type BadgeProps } from "@/components/ui/status";
import type { Member } from "@/lib/api/types";
import { members, workspace, NOW } from "@/lib/mock/fixtures";
import * as fmt from "@/lib/format";

export const metadata: Metadata = { title: "Settings" };

/** Front desk hours. Sunday is closed, and the after hours agent covers it. */
const HOURS: { day: string; open: boolean; hours: string }[] = [
  { day: "Monday", open: true, hours: "7:30 am to 5:00 pm" },
  { day: "Tuesday", open: true, hours: "7:30 am to 5:00 pm" },
  { day: "Wednesday", open: true, hours: "7:30 am to 5:00 pm" },
  { day: "Thursday", open: true, hours: "7:30 am to 6:00 pm" },
  { day: "Friday", open: true, hours: "7:30 am to 2:00 pm" },
  { day: "Saturday", open: true, hours: "8:00 am to 12:00 pm" },
  { day: "Sunday", open: false, hours: "" },
];

const TIMEZONES = [
  { value: "America/Los_Angeles", label: "Pacific time" },
  { value: "America/Denver", label: "Mountain time" },
  { value: "America/Chicago", label: "Central time" },
  { value: "America/New_York", label: "Eastern time" },
];

const ROLE: Record<Member["role"], { label: string; tone: BadgeProps["tone"] }> =
  {
    owner: { label: "Owner", tone: "primary" },
    manager: { label: "Manager", tone: "neutral" },
    viewer: { label: "Viewer", tone: "neutral" },
  };

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="max-w-[62ch] text-base leading-relaxed text-ink-muted">
          The practice details your agents repeat on every call, the hours the
          front desk is open, and who from the office can sign in here.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Practice details</CardTitle>
            <CardDescription className="mt-0.5">
              Your agents say this name when they answer.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Practice name"
              htmlFor="workspace-name"
              hint="Callers hear this in the greeting."
            >
              <Input defaultValue={workspace.name} />
            </Field>

            <Field
              label="What the practice does"
              htmlFor="workspace-industry"
              hint="Helps your agents answer questions the way your office would."
            >
              <Input defaultValue={workspace.industry} />
            </Field>
          </div>

          <Field
            className="mt-4"
            label="Time zone"
            htmlFor="workspace-timezone"
            hint="Every time you see in EZRA is shown in this zone."
          >
            <Select defaultValue={workspace.timezone}>
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </Select>
          </Field>
        </CardContent>
        <CardFooter>
          <Button variant="primary" size="sm">
            Save practice details
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Office hours</CardTitle>
            <CardDescription className="mt-0.5">
              When the front desk is open. Turn a day off and the after hours
              agent takes that day instead.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="border-t border-rule">
            {HOURS.map((day) => (
              <li
                key={day.day}
                className="flex items-center justify-between gap-4 border-b border-rule px-5 py-3 last:border-b-0"
              >
                <span className="flex items-center gap-3">
                  <Switch
                    defaultChecked={day.open}
                    aria-label={`${day.day}, open`}
                  />
                  <span className="text-sm text-ink">{day.day}</span>
                </span>

                {day.open ? (
                  <span
                    data-numeric
                    className="font-mono text-sm text-ink-muted"
                  >
                    {day.hours}
                  </span>
                ) : (
                  <span className="text-sm text-ink-muted">Closed</span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="justify-between">
          <p className="text-xs text-ink-muted">
            Outside these hours the After Hours Line answers and pages the on
            call dentist for emergencies.
          </p>
          <Button variant="primary" size="sm">
            Save hours
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Team</CardTitle>
            <CardDescription className="mt-0.5">
              Everyone who can sign in to this account.
            </CardDescription>
          </div>
          <Button variant="primary" size="sm">
            <UserPlusIcon aria-hidden weight="bold" />
            Invite someone
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="border-t border-rule">
            {members.map((member) => {
              const role = ROLE[member.role];
              return (
                <li
                  key={member.id}
                  className="flex flex-wrap items-center gap-3 border-b border-rule px-5 py-3.5 last:border-b-0"
                >
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-wash text-sm font-medium text-primary"
                  >
                    {member.initials}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {member.name}
                    </p>
                    <p className="truncate text-xs text-ink-muted">
                      {member.email}
                    </p>
                  </div>

                  <Badge tone={role.tone}>{role.label}</Badge>

                  <span className="w-full text-2xs text-ink-faint sm:w-auto sm:text-right">
                    Last here{" "}
                    <span data-numeric className="font-mono">
                      {fmt.relative(member.lastActiveAt, NOW)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-ink-muted">
            An owner can change the card on file and remove people. A manager
            can edit agents and read every conversation. A viewer can read
            conversations and nothing else.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
