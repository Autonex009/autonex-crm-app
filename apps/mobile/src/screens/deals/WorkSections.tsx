import { StyleSheet, View } from "react-native";

import {
  ACTION_PRIORITY_META,
  ACTION_STATUS_LABEL,
  actionPriority,
  byActionPriority,
  dueLabel,
  isOverdue,
  type Action,
} from "../../api/actions";
import {
  TASK_PRIORITY_META,
  byTaskPriority,
  taskAuditLine,
  taskPriority,
  type DealTask,
} from "../../api/tasks";
import { formatDateLong } from "../../lib/dates";
import { spacing, toneColors, useTheme, type Tone } from "../../theme";
import { Badge, Card, SectionHeader, Txt } from "../../ui";

/**
 * A deal's checklist, as the detail screen shows it.
 *
 * Everything is listed, done included — this is the record of the deal, not a
 * to-do surface, and "who closed this out and when" is the part a detail
 * screen is asked for. Pending first, most urgent first within that.
 */
export function TaskSection({
  tasks,
  loading,
}: {
  tasks: readonly DealTask[];
  loading?: boolean;
}) {
  const pending = byTaskPriority(tasks.filter((t) => !t.done));
  const done = tasks.filter((t) => t.done);
  const ordered = [...pending, ...done];

  return (
    <View>
      <SectionHeader
        title="Tasks"
        action={
          tasks.length > 0 ? (
            <Txt variant="caption" color="subtle">
              {pending.length} open · {done.length} done
            </Txt>
          ) : null
        }
      />
      <Card padded={false}>
        {loading ? (
          <Placeholder>Loading…</Placeholder>
        ) : ordered.length === 0 ? (
          <Placeholder>No tasks on this deal.</Placeholder>
        ) : (
          ordered.map((task, index) => {
            const meta = TASK_PRIORITY_META[taskPriority(task)];
            const audit = taskAuditLine(task);
            return (
              <Row key={task.id} first={index === 0}>
                <View style={styles.rowHead}>
                  <Badge tone={task.done ? "neutral" : meta.tone} dot>
                    {task.done ? "Done" : meta.label}
                  </Badge>
                  {task.assignedToName ? (
                    <Txt variant="caption" color="subtle" numberOfLines={1}>
                      {task.assignedToName}
                    </Txt>
                  ) : null}
                </View>

                <Txt
                  variant="body"
                  color={task.done ? "subtle" : "fg"}
                  style={task.done ? styles.struck : undefined}
                >
                  {task.text}
                </Txt>

                {audit ? (
                  <Txt variant="caption" color="subtle">
                    {audit}
                    {task.done && task.completedAt
                      ? ` · ${formatDateLong(task.completedAt)}`
                      : ""}
                  </Txt>
                ) : null}
              </Row>
            );
          })
        )}
      </Card>
    </View>
  );
}

/**
 * The follow-up actions attached to a record.
 *
 * Same three priority levels as a task, plus a status and a due date — the
 * shape the web's Actions table shows, minus the controls.
 */
export function ActionSection({
  actions,
  loading,
  title = "Actions",
}: {
  actions: readonly Action[];
  loading?: boolean;
  title?: string;
}) {
  const open = actions.filter((a) => a.status !== "done");
  const ordered = [...byActionPriority(open), ...actions.filter((a) => a.status === "done")];
  const overdue = open.filter(isOverdue).length;

  return (
    <View>
      <SectionHeader
        title={title}
        action={
          overdue > 0 ? (
            <Badge tone="danger">{overdue} overdue</Badge>
          ) : actions.length > 0 ? (
            <Txt variant="caption" color="subtle">
              {open.length} open
            </Txt>
          ) : null
        }
      />
      <Card padded={false}>
        {loading ? (
          <Placeholder>Loading…</Placeholder>
        ) : ordered.length === 0 ? (
          <Placeholder>No actions on this record.</Placeholder>
        ) : (
          ordered.map((action, index) => {
            const due = dueLabel(action);
            const priority = ACTION_PRIORITY_META[actionPriority(action)];
            return (
              <Row key={action.id} first={index === 0}>
                <View style={styles.rowHead}>
                  <Badge tone={action.status === "done" ? "neutral" : priority.tone} dot>
                    {priority.label}
                  </Badge>
                  <Badge tone={action.status === "done" ? "success" : "neutral"}>
                    {ACTION_STATUS_LABEL[action.status] ?? action.status}
                  </Badge>
                </View>

                <Txt
                  variant="body"
                  color={action.status === "done" ? "subtle" : "fg"}
                  style={action.status === "done" ? styles.struck : undefined}
                >
                  {action.title}
                </Txt>

                <DueLine text={due.text} tone={due.tone} />
              </Row>
            );
          })
        )}
      </Card>
    </View>
  );
}

/* -------------------------------------------------------------------------- */

function DueLine({ text, tone }: { text: string; tone: Tone }) {
  const { colors } = useTheme();
  const color = tone === "neutral" ? colors.fgSubtle : toneColors(tone, colors).fg;
  return (
    <Txt variant="caption" style={{ color }}>
      {text}
    </Txt>
  );
}

function Row({ children, first }: { children: React.ReactNode; first: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.row,
        !first && { borderTopColor: colors.line, borderTopWidth: StyleSheet.hairlineWidth },
      ]}
    >
      {children}
    </View>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Txt variant="label" color="subtle">
        {children}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 5, padding: spacing.sm + 4 },
  rowHead: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  struck: { textDecorationLine: "line-through" },
});
