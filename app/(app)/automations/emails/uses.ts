import { followUpSettings, messageTemplates, reviewSettings } from "@/lib/mock/fixtures";

/** Which automations send each email, in words, by template id. */
export function emailUses() {
  return [
    ...followUpSettings.steps.map((s, i) => ({
      templateId: s.channel === "email" ? s.emailTemplateId : null,
      label: `follow-up ${i + 1}`,
    })),
    {
      templateId: reviewSettings.channels.includes("email") ? reviewSettings.emailTemplateId : null,
      label: "the review request",
    },
    ...messageTemplates.map((m) => ({
      templateId: m.channels.includes("email") ? (m.emailTemplateId ?? null) : null,
      label: `the ${m.name.toLowerCase()}`,
    })),
  ];
}
