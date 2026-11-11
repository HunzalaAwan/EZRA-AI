import { AutomationTabs } from "@/components/app/automations/tabs";

/** Every Automations screen sits under the same row of tabs. */
export default function AutomationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-8">
      <AutomationTabs />
      {children}
    </div>
  );
}
