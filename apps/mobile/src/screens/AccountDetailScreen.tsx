import { useMemo } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { accountsApi } from "../api";
import type {
  CompanyProfile,
  LinkedDeal,
  LinkedInvoice,
  LinkedLead,
  LinkedQuote,
} from "../api/accounts";
import { actionsApi, canSeeActions } from "../api/actions";
import {
  dealStageMeta,
  documentStatusTone,
  humanize,
  leadStageMeta,
  normalizeDealStage,
} from "../domain/stages";
import { formatDate, formatDateLong } from "../lib/dates";
import { formatMoney, formatMoneyCompact } from "../lib/money";
import { useCurrency } from "../org/workspace";
import { useAuthStore } from "../store/auth";
import { spacing, type Tone } from "../theme";
import {
  Avatar,
  Badge,
  Button,
  Card,
  DetailRow,
  ListRow,
  SectionHeader,
  StatTile,
  Txt,
} from "../ui";
import { ActionSection } from "./deals/WorkSections";
import { DetailScaffold } from "./DetailScaffold";
import type { AppRouteProps } from "../navigation/types";

/** Same four states, same four colours, as the web's company header. */
const AMC_TONE: Record<CompanyProfile["amcStatus"], Tone> = {
  active: "success",
  pending_renewal: "warning",
  expired: "danger",
  none: "neutral",
};

/**
 * Every number the profile shows, derived once.
 *
 * Mirrors `computeMetrics` in apps/web/src/app/accounts/profile/metrics.ts.
 * Each section summing the same deal list itself is exactly how the web's
 * Overview and Pipeline tabs came to print different totals.
 */
function useMetrics(
  deals: readonly LinkedDeal[],
  leads: readonly LinkedLead[],
  quotes: readonly LinkedQuote[],
  invoices: readonly LinkedInvoice[],
) {
  return useMemo(() => {
    let dealValue = 0;
    let openValue = 0;
    let wonValue = 0;
    let wonCount = 0;
    let totalCameras = 0;
    const sites = new Set<string>();

    for (const deal of deals) {
      const amount = deal.amount || 0;
      dealValue += amount;

      const stage = normalizeDealStage(deal.stage);
      if (stage === "won") {
        wonCount += 1;
        wonValue += amount;
      } else {
        openValue += amount;
      }

      if (deal.totalCameras) totalCameras += deal.totalCameras;
      const site = deal.location?.trim() || deal.siteAssessmentLocation?.trim();
      if (site) sites.add(site.toLowerCase());
    }

    const invoiced = invoices.reduce((sum, i) => sum + (i.total || 0), 0);
    const paid = invoices.reduce((sum, i) => sum + (i.amountPaid || 0), 0);

    return {
      dealValue,
      openValue,
      wonValue,
      wonCount,
      totalCameras,
      siteCount: sites.size,
      leadEstimate: leads.reduce((sum, l) => sum + (l.value || 0), 0),
      quoteValue: quotes.reduce((sum, q) => sum + (q.total || 0), 0),
      invoiced,
      paid,
      outstanding: invoiced - paid,
    };
  }, [deals, leads, quotes, invoices]);
}

/**
 * Company profile. The web's version is a tabbed workspace (overview,
 * pipeline, financials, leads, actions); on a phone those become stacked
 * sections in the same order, which reads better than a cramped tab bar.
 */
export function AccountDetailScreen({ route, navigation }: AppRouteProps<"AccountDetail">) {
  const { id } = route.params;
  const currency = useCurrency();
  const role = useAuthStore((s) => s.user?.role);
  const managerView = canSeeActions(role);

  const query = useQuery({
    queryKey: ["account-profile", id],
    queryFn: () => accountsApi.getProfile(id),
  });

  const actions = useQuery({
    queryKey: ["actions", { accountId: id }],
    queryFn: () => actionsApi.list({ accountId: id }),
    enabled: managerView && !query.isPending && !query.isError,
  });

  const payload = query.data;
  const account = payload?.account;
  const profile = payload?.profile;

  const metrics = useMetrics(
    payload?.deals ?? [],
    payload?.leads ?? [],
    payload?.quotes ?? [],
    payload?.invoices ?? [],
  );

  const specs = profile?.hardwareSpecs;
  const hasSpecs =
    !!specs &&
    (specs.edgeProcessor || specs.cameraCount || specs.speakerCount || specs.nvrMake);

  return (
    <DetailScaffold query={query} scope={{ accountId: id }}>
      {payload && account && (
        <>
          <Card>
            <View style={styles.headRow}>
              <Avatar name={account.name} size={44} />
              <View style={styles.headText}>
                <Txt variant="title" numberOfLines={2}>
                  {account.name}
                </Txt>
                {profile?.tagline ? (
                  <Txt variant="label" color="muted" numberOfLines={2}>
                    {profile.tagline}
                  </Txt>
                ) : account.industry ? (
                  <Txt variant="label" color="muted">
                    {account.industry}
                  </Txt>
                ) : null}
              </View>
            </View>

            {profile ? (
              <View style={styles.headBadges}>
                <Badge tone={AMC_TONE[profile.amcStatus] ?? "neutral"} dot>
                  AMC {humanize(profile.amcStatus)}
                </Badge>
                {account.industry ? <Badge tone="neutral">{account.industry}</Badge> : null}
              </View>
            ) : null}

            {(account.website || account.phone) && (
              <View style={styles.headActions}>
                {account.website ? (
                  <Button
                    variant="secondary"
                    onPress={() => void Linking.openURL(normalizeUrl(account.website!))}
                  >
                    Website
                  </Button>
                ) : null}
                {account.phone ? (
                  <Button
                    variant="secondary"
                    onPress={() => void Linking.openURL(`tel:${account.phone}`)}
                  >
                    Call
                  </Button>
                ) : null}
              </View>
            )}
          </Card>

          {profile?.description ? (
            <Card>
              <Txt variant="body" color="muted">
                {profile.description}
              </Txt>
            </Card>
          ) : null}

          {/* The same snapshot the web's metrics banner carries. */}
          <View style={styles.tiles}>
            <StatTile
              label="Pipeline"
              value={formatMoneyCompact(metrics.dealValue, currency)}
              hint={`${account.dealCount} deals`}
            />
            <StatTile
              label="Open value"
              value={formatMoneyCompact(metrics.openValue, currency)}
              tone="info"
            />
            <StatTile
              label="Won"
              value={formatMoneyCompact(metrics.wonValue, currency)}
              hint={`${metrics.wonCount} closed`}
              tone="success"
            />
            <StatTile
              label="Outstanding"
              value={formatMoneyCompact(metrics.outstanding, currency)}
              hint={`${formatMoneyCompact(metrics.paid, currency)} paid`}
              tone={metrics.outstanding > 0 ? "warning" : "neutral"}
            />
            <StatTile label="Cameras" value={metrics.totalCameras || "—"} />
            <StatTile label="Sites" value={metrics.siteCount || "—"} />
            <StatTile label="Leads" value={account.leadCount} />
            <StatTile label="Contacts" value={account.contactCount} />
          </View>

          <View>
            <SectionHeader title="Details" />
            <Card>
              <DetailRow label="Industry" value={account.industry || "—"} />
              <DetailRow label="Website" value={account.website || "—"} />
              <DetailRow label="Phone" value={account.phone || "—"} />
              <DetailRow label="Owner" value={account.ownerName || "Unassigned"} />
              <DetailRow label="Created" value={formatDateLong(account.createdAt)} />
              <DetailRow label="Last updated" value={formatDateLong(account.updatedAt)} />
            </Card>
          </View>

          {profile && profile.amcStatus !== "none" ? (
            <View>
              <SectionHeader title="AMC" />
              <Card>
                <DetailRow
                  label="Status"
                  value={
                    <Badge tone={AMC_TONE[profile.amcStatus] ?? "neutral"} dot>
                      {humanize(profile.amcStatus)}
                    </Badge>
                  }
                />
                <DetailRow label="Starts" value={formatDateLong(profile.amcStartDate)} />
                <DetailRow label="Ends" value={formatDateLong(profile.amcEndDate)} />
                <DetailRow
                  label="Contract value"
                  value={formatMoney(profile.amcValue, currency)}
                />
              </Card>
            </View>
          ) : null}

          {hasSpecs ? (
            <View>
              <SectionHeader title="Hardware infrastructure" />
              <Card>
                <DetailRow label="Edge processor" value={specs!.edgeProcessor || "—"} />
                <DetailRow
                  label="Cameras"
                  value={specs!.cameraCount ? String(specs!.cameraCount) : "—"}
                />
                <DetailRow
                  label="Audio / speaker units"
                  value={specs!.speakerCount ? String(specs!.speakerCount) : "—"}
                />
                <DetailRow label="NVR / CCTV make" value={specs!.nvrMake || "—"} />
              </Card>
            </View>
          ) : null}

          {(profile?.aiDetections?.length ?? 0) > 0 && (
            <View>
              <SectionHeader
                title="Active VIGIL AI detection modules"
                action={
                  <Txt variant="caption" color="subtle">
                    {profile!.aiDetections.length}
                  </Txt>
                }
              />
              <Card>
                <View style={styles.chips}>
                  {profile!.aiDetections.map((detection) => (
                    <Badge key={detection} tone="brand">
                      {detection}
                    </Badge>
                  ))}
                </View>
              </Card>
            </View>
          )}

          {(profile?.plantLocations?.length ?? 0) > 0 && (
            <View>
              <SectionHeader
                title="Plant sites"
                action={
                  <Txt variant="caption" color="subtle">
                    {profile!.plantLocations.length}
                  </Txt>
                }
              />
              <View style={styles.group}>
                {profile!.plantLocations.map((plant, index) => (
                  <Card key={`${plant.name}-${index}`}>
                    <Txt variant="heading">{plant.name || "Unnamed site"}</Txt>
                    {plant.city || plant.address ? (
                      <Txt variant="label" color="muted" style={styles.spaced}>
                        {[plant.city, plant.address].filter(Boolean).join(" · ")}
                      </Txt>
                    ) : null}
                    {plant.spocName || plant.spocPhone ? (
                      <Txt variant="caption" color="subtle" style={styles.spaced}>
                        SPOC: {[plant.spocName, plant.spocPhone].filter(Boolean).join(" · ")}
                      </Txt>
                    ) : null}
                  </Card>
                ))}
              </View>
            </View>
          )}

          {managerView && (
            <ActionSection actions={actions.data ?? []} loading={actions.isPending} />
          )}

          {(payload.deals?.length ?? 0) > 0 && (
            <View>
              <SectionHeader
                title="Deals"
                action={
                  <Txt variant="caption" color="subtle">
                    {formatMoneyCompact(metrics.dealValue, currency)}
                  </Txt>
                }
              />
              <View style={styles.group}>
                {payload.deals.map((deal) => {
                  const meta = dealStageMeta(deal.stage);
                  return (
                    <ListRow
                      key={deal.id}
                      title={deal.title || "Untitled deal"}
                      subtitle={deal.location}
                      onPress={() =>
                        navigation.navigate("DealDetail", { id: deal.id, name: deal.title })
                      }
                      meta={
                        <>
                          <Badge tone={meta.tone} dot>
                            {meta.label}
                          </Badge>
                          {deal.totalCameras ? (
                            <Txt variant="caption" color="subtle">
                              {deal.totalCameras} cams
                            </Txt>
                          ) : null}
                          {deal.expectedCloseDate ? (
                            <Txt variant="caption" color="subtle">
                              Closes {formatDate(deal.expectedCloseDate)}
                            </Txt>
                          ) : null}
                        </>
                      }
                      trailing={
                        <Txt variant="label">
                          {formatMoneyCompact(deal.amount, currency)}
                        </Txt>
                      }
                    />
                  );
                })}
              </View>
            </View>
          )}

          {(payload.leads?.length ?? 0) > 0 && (
            <View>
              <SectionHeader title="Leads" />
              <View style={styles.group}>
                {payload.leads.map((lead) => {
                  const meta = leadStageMeta(lead.stage);
                  const name =
                    [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Unnamed lead";
                  return (
                    <ListRow
                      key={lead.id}
                      title={name}
                      subtitle={lead.title || lead.email}
                      onPress={() =>
                        navigation.navigate("LeadDetail", { id: lead.id, name })
                      }
                      meta={
                        <Badge tone={meta.tone} dot>
                          {meta.label}
                        </Badge>
                      }
                      trailing={
                        lead.value ? (
                          <Txt variant="label" color="muted">
                            {formatMoneyCompact(lead.value, currency)}
                          </Txt>
                        ) : null
                      }
                    />
                  );
                })}
              </View>
            </View>
          )}

          {(payload.quotes?.length ?? 0) > 0 && (
            <View>
              <SectionHeader
                title="Quotes"
                action={
                  <Txt variant="caption" color="subtle">
                    {formatMoneyCompact(metrics.quoteValue, currency)}
                  </Txt>
                }
              />
              <View style={styles.group}>
                {payload.quotes.map((quote) => (
                  <ListRow
                    key={quote.id}
                    title={quote.number || "Draft quote"}
                    subtitle={
                      quote.validUntil ? `Valid to ${formatDate(quote.validUntil)}` : null
                    }
                    onPress={() =>
                      navigation.navigate("QuoteDetail", {
                        id: quote.id,
                        name: quote.number ?? "Quote",
                      })
                    }
                    meta={
                      <Badge tone={documentStatusTone(quote.status)} dot>
                        {humanize(quote.status)}
                      </Badge>
                    }
                    trailing={
                      <Txt variant="label">
                        {formatMoneyCompact(quote.total, quote.currency || currency)}
                      </Txt>
                    }
                  />
                ))}
              </View>
            </View>
          )}

          {(payload.invoices?.length ?? 0) > 0 && (
            <View>
              <SectionHeader
                title="Invoices"
                action={
                  <Txt variant="caption" color="subtle">
                    {formatMoneyCompact(metrics.outstanding, currency)} due
                  </Txt>
                }
              />
              <View style={styles.group}>
                {payload.invoices.map((invoice) => (
                  <ListRow
                    key={invoice.id}
                    title={invoice.invoiceNumber || invoice.title || "Invoice"}
                    subtitle={invoice.dueDate ? `Due ${formatDate(invoice.dueDate)}` : null}
                    onPress={() =>
                      navigation.navigate("InvoiceDetail", {
                        id: invoice.id,
                        name: invoice.invoiceNumber ?? "Invoice",
                      })
                    }
                    meta={
                      <Badge tone={documentStatusTone(invoice.status)} dot>
                        {humanize(invoice.status)}
                      </Badge>
                    }
                    trailing={
                      <Txt variant="label">
                        {formatMoneyCompact(invoice.amountDue, currency)}
                      </Txt>
                    }
                  />
                ))}
              </View>
            </View>
          )}

          {(payload.contacts?.length ?? 0) > 0 && (
            <View>
              <SectionHeader title="Contacts" />
              <View style={styles.group}>
                {payload.contacts.map((contact) => (
                  <ListRow
                    key={contact.id}
                    title={
                      [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
                      "Unnamed contact"
                    }
                    subtitle={contact.title || contact.email}
                    leading={<Avatar name={contact.firstName} size={28} />}
                    meta={
                      contact.phone ? (
                        <Txt variant="caption" color="subtle">
                          {contact.phone}
                        </Txt>
                      ) : null
                    }
                  />
                ))}
              </View>
            </View>
          )}

          {account.notes ? (
            <View>
              <SectionHeader title="Notes" />
              <Card>
                <Txt variant="body" color="muted">
                  {account.notes}
                </Txt>
              </Card>
            </View>
          ) : null}
        </>
      )}
    </DetailScaffold>
  );
}

/** A website stored as "acme.com" is not a URL the OS will open. */
function normalizeUrl(raw: string): string {
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

const styles = StyleSheet.create({
  headRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm + 4 },
  headText: { flex: 1, gap: 2 },
  headBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: spacing.sm + 2,
  },
  headActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm + 2 },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  group: { gap: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  spaced: { marginTop: 3 },
});
