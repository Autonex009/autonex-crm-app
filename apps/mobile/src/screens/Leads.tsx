import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";
import { RefreshControl, SectionList, StyleSheet, View } from "react-native";

import { daysUntil, dueLabel, humanize, moneyShort } from "../lib/format";
import { type Lead, useLeads } from "../lib/queries";
import { spacing, useTheme } from "../theme";
import {
  Divider,
  Empty,
  Failed,
  Gap,
  Loading,
  Overline,
  Row,
  StatusLabel,
  type StatusTone,
  Txt,
} from "../ui";

/** Display name, falling back to the company when a lead has no person yet. */
function leadName(lead: Lead): string {
  const full = [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim();
  return full || lead.company || lead.accountName || "Unnamed lead";
}

function company(lead: Lead): string | null {
  return lead.accountName?.trim() || lead.company?.trim() || null;
}

/**
 * Leads, grouped by follow-up urgency rather than by stage.
 *
 * Stage is the right axis on the web, where the funnel is the point. On a phone
 * the question is "who am I supposed to call today", so the sections are
 * Overdue / Today / This week / Later, and stage becomes a detail on the row.
 *
 * `overdue` and `dueToday` come from the server, computed against APP_TIMEZONE.
 * They are deliberately not recomputed here: a phone in another timezone would
 * disagree with the web app about what "today" means.
 */
export function LeadsScreen() {
  const navigation = useNavigation<any>();
  const t = useTheme();
  const { data, isLoading, isRefetching, refetch, error } = useLeads();

  const sections = useMemo(() => {
    const items = data?.items ?? [];
    const buckets: Record<string, Lead[]> = {
      Overdue: [],
      Today: [],
      "This week": [],
      Later: [],
      "No follow-up": [],
    };

    for (const lead of items) {
      if (lead.overdue) buckets.Overdue.push(lead);
      else if (lead.dueToday) buckets.Today.push(lead);
      else if (!lead.followUpAt) buckets["No follow-up"].push(lead);
      else {
        const days = daysUntil(lead.followUpAt);
        buckets[days != null && days <= 7 ? "This week" : "Later"].push(lead);
      }
    }

    // Soonest first inside each bucket — within "Overdue" that means the most
    // overdue at the top, which is the one to call first.
    for (const list of Object.values(buckets)) {
      list.sort((a, b) => (a.followUpAt ?? "9999").localeCompare(b.followUpAt ?? "9999"));
    }

    return Object.entries(buckets)
      .filter(([, list]) => list.length > 0)
      .map(([title, list]) => ({ title, data: list }));
  }, [data]);

  if (isLoading) return <Loading />;
  if (error) return <Failed error={error} onRetry={refetch} />;
  if (!sections.length) {
    return <Empty title="No leads" detail="Leads created on the web will appear here." />;
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(l) => l.id}
      style={{ backgroundColor: t.canvas }}
      contentContainerStyle={{ paddingBottom: spacing["2xl"] }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.fg.subtle} />
      }
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Overline>
            {section.title} · {section.data.length}
          </Overline>
        </View>
      )}
      renderItem={({ item }) => (
        <LeadRow lead={item} onPress={() => navigation.navigate("LeadDetail", { id: item.id })} />
      )}
      ItemSeparatorComponent={() => <Divider inset={spacing.md} />}
    />
  );
}

function LeadRow({ lead, onPress }: { lead: Lead; onPress: () => void }) {
  const tone: StatusTone = lead.overdue ? "danger" : lead.dueToday ? "warning" : "neutral";
  const org = company(lead);

  return (
    <Row onPress={onPress}>
      {org ? <Overline>{org}</Overline> : null}
      <Gap size="xs" />
      <View style={styles.titleLine}>
        <Txt variant="title" numberOfLines={1} style={styles.name}>
          {leadName(lead)}
        </Txt>
        {lead.value ? (
          <Txt variant="bodyStrong" tone="muted" numeric>
            {moneyShort(lead.value)}
          </Txt>
        ) : null}
      </View>
      {lead.title ? (
        <>
          <Gap size="xs" />
          <Txt variant="caption" tone="subtle" numberOfLines={1}>
            {lead.title}
          </Txt>
        </>
      ) : null}
      <Gap size="sm" />
      <View style={styles.metaLine}>
        <StatusLabel tone={tone}>{dueLabel(lead.followUpAt)}</StatusLabel>
        <Txt variant="caption" tone="subtle">
          {humanize(lead.stage)}
        </Txt>
      </View>
    </Row>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  titleLine: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm },
  name: { flex: 1 },
  metaLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
