import type { Metadata } from "next";
import { WidgetStudio } from "@/components/app/widget/widget-studio";
import { voices, widgetSettings, workspace } from "@/lib/mock/fixtures";

export const metadata: Metadata = { title: "Widget and voice" };

/**
 * How EZRA looks on the business's website and sounds on its phone line,
 * with a working preview of both.
 */
export default function CustomizePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-ink">Widget and voice</h2>
        <p className="mt-1.5 max-w-[62ch] text-base leading-relaxed text-ink-muted">
          Make the chat on your website and the voice on your phone line feel like your business. The preview is the
          real thing: open it, tap around, and play the greeting.
        </p>
      </div>
      <WidgetStudio
        initial={widgetSettings}
        workspaceId={workspace.id}
        businessName={workspace.name}
        siteDomain="aldercreekdental.com"
        voices={voices.map(({ id, name, tone }) => ({ id, name, tone }))}
      />
    </div>
  );
}
