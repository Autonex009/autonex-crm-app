import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import {
  actionPriority,
  byActionPriority,
  dueLabel,
  isOverdue,
  type Action,
} from "../../api/actions";
import {
  byTaskPriority,
  TASK_PRIORITY_META,
  taskPriority,
  type DealTask,
} from "../../api/tasks";
import type { Deal } from "../../api";
import { dealStageMeta, normalizeDealStage } from "../../domain/stages";
import { daysUntil, formatDate } from "../../lib/dates";
import { formatMoneyCompact } from "../../lib/money";
import { useCurrency } from "../../org/workspace";
import { radius, spacing, toneColors, useTheme, type Tone } from "../../theme";
import { Avatar, Badge, Txt } from "../../ui";

/** How many of each list a card shows before it collapses to a count. */
const PREVIEW = 3;

interface DealCardProps {
  deal: Deal;
  /** This deal's tasks, already grouped by the screen so the card fetches nothing. */
  tasks?: readonly DealTask[];
  /** Likewise its actions. Absent for a rep — the gateway hides them. */
  actions?: readonly Action[];
  onPress?: () => void;
}

/**
 * A deal as the board draws it on the web: what it is worth, what is being
 * deployed, what is outstanding, and who owns it.
 *
 * The phone's version is read-only — no ticking a task, no drag between
 * columns — so the card spends the room the web gives to controls on the two
 * lists that actually tell you where the deal stands.
 */
/**
 * Extracts cameras, location, and lead name from structured deal columns,
 * with fallback to parsing legacy unstructured remarks (matching web).
 */
function parseDealCardInfo(deal: Deal) {
  let remark = deal.remark?.trim() || deal.description?.trim() || "";
  if (remark && /kedar\s*sathe/i.test(remark)) {
    remark = remark.replace(/kedar\s*sathe/gi, "").trim();
  }

  // 1. Number of cameras
  let cameras = deal.totalCameras ?? null;
  if (cameras === null && remark) {
    const camMatch = remark.match(
      /(?:number\s+of\s+cameras?|no\.?\s+of\s+cameras?|cams?)\s*[:\-]?\s*(\d+)/i,
    );
    if (camMatch) {
      cameras = parseInt(camMatch[1], 10);
    }
  }

  // 2. Location
  let location = deal.location?.trim() || null;
  if (!location && remark) {
    const locMatch = remark.match(
      /location\s*[:\-]\s*([^,\n\-;]+(?:,\s*[^,\n\-;]+)?)/i,
    );
    if (locMatch) {
      location = locMatch[1].trim();
    }
  }

  // 3. Lead name
  let leadName = deal.leadName?.trim() || null;
  if (!leadName && remark) {
    const leadMatch = remark.match(
      /^([A-Za-z0-9\s().&'/-]+?)\s+(?:Number\s+of|no\.?\s+of|cams?)/i,
    );
    if (leadMatch) {
      const candidate = leadMatch[1].trim();
      if (candidate && !/^(call|deal|note|meeting|demo)/i.test(candidate)) {
        leadName = candidate;
      }
    }
  }
  if (leadName && /kedar\s*sathe/i.test(leadName)) {
    leadName = null;
  }

  // 4. Products
  const products = deal.products?.trim() || null;

  return { cameras, location, leadName, products };
}

export const DealCard = memo(function DealCard({
  deal,
  tasks,
  actions,
  onPress,
}: DealCardProps) {
  const { colors } = useTheme();
  const currency = useCurrency();
  const stageKey = normalizeDealStage(deal.stage);
  const stage = dealStageMeta(deal.stage);

  const { cameras, location, leadName, products } = parseDealCardInfo(deal);
  const displayLead = leadName || deal.leadName || deal.contactName;

  const allTasks = tasks ?? [];
  const pendingTasks = byTaskPriority(allTasks.filter((t) => !t.done));
  const doneTasks = allTasks.length - pendingTasks.length;

  const openActions = byActionPriority((actions ?? []).filter((a) => a.status !== "done"));
  const overdueActions = openActions.filter(isOverdue).length;

  // A closed deal's close date is history, not a deadline.
  const closed = stageKey === "won" || stageKey === "post_delivery";
  const daysToClose = closed ? null : daysUntil(deal.expectedCloseDate);
  const late = daysToClose !== null && daysToClose < 0;

  // A deal without its own name is still about a client, so the card says
  // which one rather than showing an empty header.
  const title = deal.title?.trim() || deal.accountName?.trim() || "Untitled deal";

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${formatMoneyCompact(deal.amount, currency)}, ${stage.label}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed ? colors.surfaceHover : colors.surface,
          borderColor: pressed ? colors.accent : colors.line,
          shadowOpacity: pressed ? 0.09 : 0.04,
        },
      ]}
    >
      {/* Title and amount. The amount is the one number worth reading from a
          metre away, so it gets the weight and the title gets the room. */}
      <View style={styles.titleRow}>
        <Txt variant="heading" numberOfLines={2} style={styles.title}>
          {title}
        </Txt>
        <Txt variant="heading" style={styles.amount}>
          {formatMoneyCompact(deal.amount, currency)}
        </Txt>
      </View>

      <View style={styles.badgeRow}>
        <Badge tone={stage.tone} dot>
          {stage.label}
        </Badge>
        {deal.accountName ? (
          <Txt variant="caption" color="muted" numberOfLines={1} style={styles.flexText}>
            {deal.accountName}
          </Txt>
        ) : null}
      </View>

      {displayLead ? (
        <View style={styles.personRow}>
          <Feather name="user" size={11} color={colors.fgSubtle} />
          <Txt variant="caption" color="muted" numberOfLines={1} style={styles.flexText}>
            {displayLead}
          </Txt>
        </View>
      ) : null}

      {/* Cameras, location, products: what is actually being deployed. One
          quiet chip family with the colour on the icon, so three of them don't
          compete with the task list below. */}
      {(cameras !== null || location || products) && (
        <View style={styles.chips}>
          {cameras !== null && (
            <InfoChip icon="video" tint={colors.infoFg}>
              {cameras} {cameras === 1 ? "cam" : "cams"}
            </InfoChip>
          )}
          {location ? (
            <InfoChip icon="map-pin" tint={colors.warnFg}>
              {location}
            </InfoChip>
          ) : null}
          {products ? (
            <InfoChip icon="layers" tint={colors.accent}>
              {products}
            </InfoChip>
          ) : null}
        </View>
      )}

      {/* Execution: the deal's own checklist, then the manager-owned actions
          that share the same three priority levels. */}
      <WorkList
        icon="check-square"
        label="Tasks"
        count={pendingTasks.length}
        emptyLabel={doneTasks > 0 ? "All tasks done" : "No tasks yet"}
        extra={doneTasks > 0 ? `${doneTasks} done` : undefined}
        rows={pendingTasks.slice(0, PREVIEW).map((task) => ({
          key: task.id,
          tone: TASK_PRIORITY_META[taskPriority(task)].tone,
          text: task.text,
          trailing: task.assignedToName,
        }))}
        hidden={pendingTasks.length - Math.min(pendingTasks.length, PREVIEW)}
      />

      {actions !== undefined && (
        <WorkList
          icon="flag"
          label="Actions"
          count={openActions.length}
          emptyLabel="No open actions"
          extra={overdueActions > 0 ? `${overdueActions} overdue` : undefined}
          extraTone="danger"
          rows={openActions.slice(0, PREVIEW).map((action) => ({
            key: action.id,
            tone: isOverdue(action)
              ? "danger"
              : TASK_PRIORITY_META[actionPriority(action)].tone,
            text: action.title,
            trailing: dueLabel(action).text,
            trailingTone: dueLabel(action).tone,
          }))}
          hidden={openActions.length - Math.min(openActions.length, PREVIEW)}
        />
      )}

      {/* Footer: owner on the left, the date that matters on the right. */}
      <View style={[styles.footer, { borderTopColor: colors.line }]}>
        <View style={styles.owner}>
          {deal.ownerName ? (
            <>
              <Avatar name={deal.ownerName} size={20} />
              <Txt variant="caption" color="muted" numberOfLines={1} style={styles.flexText}>
                {deal.ownerName}
              </Txt>
            </>
          ) : (
            <Txt variant="caption" color="subtle">
              Unassigned
            </Txt>
          )}
        </View>

        {deal.expectedCloseDate ? (
          late ? (
            <Badge tone="danger">{Math.abs(daysToClose!)}d late</Badge>
          ) : (
            <View style={styles.date}>
              <Feather name="calendar" size={11} color={colors.fgSubtle} />
              <Txt variant="caption" color="subtle">
                {formatDate(deal.expectedCloseDate)}
              </Txt>
            </View>
          )
        ) : null}
      </View>
    </Pressable>
  );
});

/* -------------------------------------------------------------------------- */

interface WorkRow {
  key: string;
  tone: Tone;
  text: string;
  trailing?: string | null;
  trailingTone?: Tone;
}

/**
 * One outstanding-work list: a counted header, up to three rows dotted by
 * priority, and a line for whatever did not fit. Tasks and actions render
 * through the same component because on a card they are the same shape — and
 * two near-identical blocks are exactly how the web's card drifted.
 */
function WorkList({
  icon,
  label,
  count,
  rows,
  hidden,
  emptyLabel,
  extra,
  extraTone = "neutral",
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  count: number;
  rows: readonly WorkRow[];
  hidden: number;
  emptyLabel: string;
  extra?: string;
  extraTone?: Tone;
}) {
  const { colors } = useTheme();
  const extraColor = toneColors(extraTone, colors).fg;

  return (
    <View style={[styles.work, { borderTopColor: colors.line }]}>
      <View style={styles.workHead}>
        <Feather name={icon} size={11} color={colors.fgSubtle} />
        <Txt variant="caption" color="subtle" uppercase>
          {label}
        </Txt>
        {count > 0 ? (
          <Txt variant="caption" color="muted">
            {count}
          </Txt>
        ) : null}
        <View style={styles.spacer} />
        {extra ? (
          <Txt variant="caption" style={{ color: extraColor }}>
            {extra}
          </Txt>
        ) : null}
      </View>

      {rows.length === 0 ? (
        <Txt variant="caption" color="subtle" style={styles.italic}>
          {emptyLabel}
        </Txt>
      ) : (
        rows.map((row) => (
          <View key={row.key} style={styles.workRow}>
            {/* A ring, not a checkbox: nothing here is tappable, and a hollow
                dot reads as a priority marker rather than a dead control. */}
            <View
              style={[
                styles.priorityDot,
                { borderColor: toneColors(row.tone, colors).fg },
              ]}
            />
            <Txt variant="label" color="muted" numberOfLines={2} style={styles.flexText}>
              {row.text}
            </Txt>
            {row.trailing ? (
              <Txt
                variant="caption"
                color="subtle"
                numberOfLines={1}
                style={[
                  styles.workTrailing,
                  row.trailingTone && row.trailingTone !== "neutral"
                    ? { color: toneColors(row.trailingTone, colors).fg }
                    : null,
                ]}
              >
                {row.trailing}
              </Txt>
            ) : null}
          </View>
        ))
      )}

      {hidden > 0 ? (
        <Txt variant="caption" color="subtle">
          +{hidden} more
        </Txt>
      ) : null}
    </View>
  );
}

/** One muted metadata chip; only its icon carries colour. */
function InfoChip({
  icon,
  tint,
  children,
}: {
  icon: keyof typeof Feather.glyphMap;
  tint: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: colors.surfaceMuted, borderColor: colors.line },
      ]}
    >
      <Feather name={icon} size={11} color={tint} />
      <Txt variant="caption" color="muted" numberOfLines={1}>
        {children}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.sm + 4,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  title: { flex: 1 },
  amount: { fontVariant: ["tabular-nums"] },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  personRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  flexText: { flex: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 1 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "100%",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  work: {
    gap: 5,
    marginTop: 3,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  workHead: { flexDirection: "row", alignItems: "center", gap: 5 },
  spacer: { flex: 1 },
  workRow: { flexDirection: "row", alignItems: "flex-start", gap: 7 },
  priorityDot: {
    width: 9,
    height: 9,
    marginTop: 4,
    borderRadius: 5,
    borderWidth: 2,
  },
  workTrailing: { maxWidth: "35%" },
  italic: { fontStyle: "italic" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: 3,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  owner: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  date: { flexDirection: "row", alignItems: "center", gap: 4 },
});
