import { Linking, StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { leadsApi } from "../api";
import { actionsApi, canSeeActions } from "../api/actions";
import { leadStageMeta } from "../domain/stages";
import { formatDateLong } from "../lib/dates";
import { formatMoney } from "../lib/money";
import { useCurrency } from "../org/workspace";
import { useAuthStore } from "../store/auth";
import { spacing } from "../theme";
import { Badge, Button, Card, DetailRow, Divider, SectionHeader, Txt } from "../ui";
import { ActionSection } from "./deals/WorkSections";
import { DetailScaffold } from "./DetailScaffold";
import type { AppRouteProps } from "../navigation/types";

export function LeadDetailScreen({ route, navigation }: AppRouteProps<"LeadDetail">) {
  const { id } = route.params;
  const currency = useCurrency();
  const role = useAuthStore((s) => s.user?.role);
  const managerView = canSeeActions(role);

  const query = useQuery({ queryKey: ["lead", id], queryFn: () => leadsApi.get(id) });

  const actions = useQuery({
    queryKey: ["actions", { leadId: id }],
    queryFn: () => actionsApi.list({ leadId: id }),
    enabled: managerView && !query.isPending && !query.isError,
  });

  const lead = query.data;
  const meta = leadStageMeta(lead?.stage);
  const name = lead ? [lead.firstName, lead.lastName].filter(Boolean).join(" ") : "";

  return (
    <DetailScaffold query={query} scope={{ leadId: id }}>
      {lead && (
        <>
          <Card>
            <View style={styles.head}>
              <Txt variant="title">{name || "Unnamed lead"}</Txt>
              {lead.title ? (
                <Txt variant="label" color="muted">
                  {lead.title}
                </Txt>
              ) : null}
              <View style={styles.badges}>
                <Badge tone={meta.tone} dot>
                  {meta.label}
                </Badge>
                {lead.overdue && <Badge tone="danger">Overdue</Badge>}
                {lead.dueToday && !lead.overdue && <Badge tone="warning">Due today</Badge>}
                {lead.convertedAt && <Badge tone="success">Converted</Badge>}
              </View>
            </View>

            {(lead.email || lead.phone || lead.linkedinUrl) && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.actions}>
                  {lead.email ? (
                    <Button
                      variant="secondary"
                      onPress={() => void Linking.openURL(`mailto:${lead.email}`)}
                    >
                      Email
                    </Button>
                  ) : null}
                  {lead.phone ? (
                    <Button
                      variant="secondary"
                      onPress={() => void Linking.openURL(`tel:${lead.phone}`)}
                    >
                      Call
                    </Button>
                  ) : null}
                  {lead.linkedinUrl ? (
                    <Button
                      variant="secondary"
                      onPress={() => void Linking.openURL(normalizeUrl(lead.linkedinUrl!))}
                    >
                      LinkedIn
                    </Button>
                  ) : null}
                </View>
              </>
            )}
          </Card>

          {managerView && (
            <ActionSection
              actions={actions.data ?? []}
              loading={actions.isPending}
              title="Follow-up actions"
            />
          )}

          <View>
            <SectionHeader title="Details" />
            <Card>
              <DetailRow label="Company" value={lead.accountName || lead.company || "—"} />
              <DetailRow label="Industry" value={lead.accountIndustry || "—"} />
              <DetailRow label="Email" value={lead.email || "—"} />
              <DetailRow label="Phone" value={lead.phone || "—"} />
              <DetailRow label="LinkedIn" value={lead.linkedinUrl || "—"} />
              <DetailRow label="Source" value={lead.source || "—"} />
              <DetailRow label="Stage" value={meta.label} />
              <DetailRow
                label="Value"
                value={lead.value === null ? "—" : formatMoney(lead.value, currency)}
              />
              <DetailRow label="Owner" value={lead.ownerName || "Unassigned"} />
              <DetailRow label="Follow up" value={formatDateLong(lead.followUpAt)} />
              <DetailRow label="Last contacted" value={formatDateLong(lead.lastContactedAt)} />
              <DetailRow label="Created" value={formatDateLong(lead.createdAt)} />
              <DetailRow label="Last updated" value={formatDateLong(lead.updatedAt)} />
            </Card>
          </View>

          {/* A converted lead's deal is the thing anyone opening it is
              actually looking for, so it gets its own way through. */}
          {lead.convertedAt ? (
            <View>
              <SectionHeader title="Conversion" />
              <Card>
                <DetailRow label="Converted" value={formatDateLong(lead.convertedAt)} />
                {lead.convertedDealId ? (
                  <View style={styles.convertAction}>
                    <Button
                      variant="secondary"
                      onPress={() =>
                        navigation.navigate("DealDetail", {
                          id: lead.convertedDealId!,
                          name: name || "Deal",
                        })
                      }
                    >
                      Open the deal
                    </Button>
                  </View>
                ) : null}
              </Card>
            </View>
          ) : null}

          {lead.notes ? (
            <View>
              <SectionHeader title="Notes" />
              <Card>
                <Txt variant="body" color="muted">
                  {lead.notes}
                </Txt>
              </Card>
            </View>
          ) : null}
        </>
      )}
    </DetailScaffold>
  );
}

/** A profile stored without a scheme is not a URL the OS will open. */
function normalizeUrl(raw: string): string {
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

const styles = StyleSheet.create({
  head: { gap: 6 },
  badges: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  divider: { marginVertical: 14 },
  actions: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  convertAction: { marginTop: spacing.sm, alignSelf: "flex-start" },
});
