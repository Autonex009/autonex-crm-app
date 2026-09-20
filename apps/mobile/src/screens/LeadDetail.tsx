import { useRoute } from "@react-navigation/native";
import { ScrollView, View } from "react-native";

import { dueLabel, humanize, money, shortDate } from "../lib/format";
import { useLeads } from "../lib/queries";
import { spacing, useTheme } from "../theme";
import { Divider, Empty, Gap, Loading, Overline, StatusLabel, type StatusTone, Txt } from "../ui";
import { ActionRow, DetailHeader, Field, Section } from "../ui/detail";

/**
 * One lead.
 *
 * The two things worth doing to a lead from a phone are calling and emailing
 * them, so those sit above the record detail rather than below it.
 */
export function LeadDetailScreen() {
  const { params } = useRoute<any>();
  const t = useTheme();
  const { data, isLoading } = useLeads();

  const lead = data?.items?.find((l) => l.id === params?.id);

  if (isLoading) return <Loading />;
  if (!lead) {
    return (
      <Empty
        title="Lead not found"
        detail="It may have been converted, deleted, or it belongs to another workspace."
      />
    );
  }

  const name =
    [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim() ||
    lead.company ||
    "Unnamed lead";
  const org = lead.accountName?.trim() || lead.company?.trim() || null;
  const tone: StatusTone = lead.overdue ? "danger" : lead.dueToday ? "warning" : "neutral";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.canvas }}
      contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
    >
      <DetailHeader overline={org} title={name} subtitle={lead.title} />

      <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
        <StatusLabel tone={tone}>{dueLabel(lead.followUpAt)}</StatusLabel>
      </View>

      {lead.phone || lead.email ? (
        <Section title="Reach out">
          {lead.phone ? (
            <ActionRow
              label="Call"
              value={lead.phone}
              url={`tel:${lead.phone.replace(/\s/g, "")}`}
            />
          ) : null}
          {lead.phone ? (
            <ActionRow
              label="WhatsApp"
              value={lead.phone}
              url={`https://wa.me/${lead.phone.replace(/[^\d]/g, "")}`}
            />
          ) : null}
          {lead.email ? (
            <ActionRow label="Email" value={lead.email} url={`mailto:${lead.email}`} />
          ) : null}
        </Section>
      ) : null}

      <Section title="Detail">
        <View style={{ paddingVertical: spacing.sm }}>
          <Field label="Stage" value={humanize(lead.stage)} />
          <Field label="Value" value={lead.value ? money(lead.value) : null} />
          <Field label="Owner" value={lead.ownerName} />
          <Field
            label="Last contacted"
            value={lead.lastContactedAt ? shortDate(lead.lastContactedAt) : null}
          />
        </View>
      </Section>

      <Section title="Record">
        <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
          <Overline>Read only</Overline>
          <Gap size="xs" />
          <Txt variant="caption" tone="subtle">
            Advancing a lead or logging a call happens on the web app.
          </Txt>
        </View>
      </Section>
    </ScrollView>
  );
}
