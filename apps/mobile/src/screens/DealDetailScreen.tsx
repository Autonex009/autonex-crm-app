import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { dealsApi } from "../api";
import { actionsApi, canSeeActions } from "../api/actions";
import { dealTasksApi } from "../api/tasks";
import { dealStageMeta, normalizeDealStage } from "../domain/stages";
import { daysUntil, formatDateLong } from "../lib/dates";
import { formatMoney } from "../lib/money";
import { useCurrency } from "../org/workspace";
import { useAuthStore } from "../store/auth";
import { spacing } from "../theme";
import { Avatar, Badge, Card, DetailRow, SectionHeader, StatTile, Txt } from "../ui";
import { ActionSection, TaskSection } from "./deals/WorkSections";
import { DetailScaffold } from "./DetailScaffold";
import type { AppRouteProps } from "../navigation/types";

export function DealDetailScreen({ route }: AppRouteProps<"DealDetail">) {
  const { id } = route.params;
  const currency = useCurrency();
  const role = useAuthStore((s) => s.user?.role);
  const managerView = canSeeActions(role);

  const query = useQuery({ queryKey: ["deal", id], queryFn: () => dealsApi.get(id) });

  // Both are context around the deal, not the deal itself, so neither blocks
  // the screen — the scaffold renders as soon as the record resolves.
  const tasks = useQuery({
    queryKey: ["deal-tasks", id],
    queryFn: () => dealTasksApi.list(id),
    enabled: !query.isPending && !query.isError,
  });

  const actions = useQuery({
    queryKey: ["actions", { dealId: id }],
    queryFn: () => actionsApi.list({ dealId: id }),
    enabled: managerView && !query.isPending && !query.isError,
  });

  const deal = query.data;
  const meta = dealStageMeta(deal?.stage);
  const stageKey = normalizeDealStage(deal?.stage);
  const closed = stageKey === "won" || stageKey === "post_delivery";
  const days = closed ? null : daysUntil(deal?.expectedCloseDate);

  const openTasks = (tasks.data ?? []).filter((t) => !t.done).length;
  const openActions = (actions.data ?? []).filter((a) => a.status !== "done").length;

  return (
    <DetailScaffold query={query} scope={{ dealId: id }}>
      {deal && (
        <>
          <Card>
            <View style={{ gap: 8 }}>
              <Txt variant="title">{deal.title || deal.accountName || "Untitled deal"}</Txt>
              <Txt variant="display">{formatMoney(deal.amount, currency)}</Txt>

              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                <Badge tone={meta.tone} dot>
                  {meta.label}
                </Badge>
                {days !== null && days < 0 ? (
                  <Badge tone="danger">{Math.abs(days)} days late</Badge>
                ) : days !== null && days === 0 ? (
                  <Badge tone="warning">Closes today</Badge>
                ) : null}
              </View>

              {deal.ownerName ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                    marginTop: 2,
                  }}
                >
                  <Avatar name={deal.ownerName} size={26} />
                  <Txt variant="label" color="muted" numberOfLines={1}>
                    {deal.ownerName}
                    {deal.ownerEmail ? ` · ${deal.ownerEmail}` : ""}
                  </Txt>
                </View>
              ) : null}
            </View>
          </Card>

          {/* The three counts a rep checks first: what is deployed, and what is
              still outstanding on each side. */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <StatTile
              label="Cameras"
              value={deal.totalCameras === null ? "—" : deal.totalCameras}
            />
            <StatTile
              label="Open tasks"
              value={tasks.isPending ? "…" : openTasks}
              tone={openTasks > 0 ? "warning" : "neutral"}
            />
            {managerView && (
              <StatTile
                label="Open actions"
                value={actions.isPending ? "…" : openActions}
                tone={openActions > 0 ? "warning" : "neutral"}
              />
            )}
          </View>

          <TaskSection tasks={tasks.data ?? []} loading={tasks.isPending} />

          {managerView && (
            <ActionSection actions={actions.data ?? []} loading={actions.isPending} />
          )}

          <View>
            <SectionHeader title="Details" />
            <Card>
              <DetailRow label="Company" value={deal.accountName || "—"} />
              <DetailRow label="Contact" value={deal.contactName || "—"} />
              <DetailRow label="Converted from lead" value={deal.leadName || "—"} />
              <DetailRow label="Owner" value={deal.ownerName || "Unassigned"} />
              <DetailRow label="Stage" value={meta.label} />
              <DetailRow label="Value" value={formatMoney(deal.amount, currency)} />
              <DetailRow
                label="Expected close"
                value={formatDateLong(deal.expectedCloseDate)}
              />
              <DetailRow label="Location" value={deal.location || "—"} />
              <DetailRow
                label="Total cameras"
                value={deal.totalCameras === null ? "—" : String(deal.totalCameras)}
              />
              <DetailRow label="Products" value={deal.products || "—"} />
              <DetailRow label="Created" value={formatDateLong(deal.createdAt)} />
              <DetailRow label="Last updated" value={formatDateLong(deal.updatedAt)} />
            </Card>
          </View>

          {deal.description || deal.remark ? (
            <View>
              <SectionHeader title="Notes" />
              <Card>
                {deal.description ? (
                  <Txt variant="body" color="muted">
                    {deal.description}
                  </Txt>
                ) : null}
                {deal.remark ? (
                  <Txt
                    variant="label"
                    color="subtle"
                    style={{ marginTop: deal.description ? 8 : 0 }}
                  >
                    {deal.remark}
                  </Txt>
                ) : null}
              </Card>
            </View>
          ) : null}
        </>
      )}
    </DetailScaffold>
  );
}
