import { useRoute } from "@react-navigation/native";
import { ScrollView, View } from "react-native";

import { humanize, money, shortDate } from "../lib/format";
import { useAccountLocations, useDeals } from "../lib/queries";
import { spacing, useTheme } from "../theme";
import { Divider, Empty, Gap, Loading, Overline, Txt } from "../ui";
import { ActionRow, DetailHeader, Field, Section, mapsUrl } from "../ui/detail";

/**
 * One deal.
 *
 * Reads from the cached board rather than fetching `/deals/{id}`: the list
 * screen has almost always populated it, so arriving from a tap is instant and
 * works with no connection. The fetch still happens when the cache is cold —
 * arriving straight from a notification on a fresh launch — because the query
 * is shared and will run itself.
 */
export function DealDetailScreen() {
  const { params } = useRoute<any>();
  const t = useTheme();
  const { data, isLoading } = useDeals();

  const deal = data?.deals?.find((d) => d.id === params?.id);
  const locations = useAccountLocations(deal?.accountId ?? null);

  if (isLoading) return <Loading />;
  if (!deal) {
    return (
      <Empty
        title="Deal not found"
        detail="It may have been deleted, or it belongs to another workspace."
      />
    );
  }

  // The sites this deal delivers to, resolved from the company's list. `location`
  // on the deal is the same names joined by the server, but the resolved records
  // are what carry the SPOC phone and the address worth navigating to.
  const sites = (locations.data?.items ?? []).filter((l) => !l.archivedAt);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.canvas }}
      contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
    >
      <DetailHeader overline={deal.accountName} title={money(deal.amount)} subtitle={deal.title} />

      <Divider />
      <View style={{ paddingVertical: spacing.sm }}>
        <Field label="Stage" value={humanize(deal.stage)} />
        <Field label="Owner" value={deal.ownerName} />
        <Field label="Primary contact" value={deal.contactName} />
        <Field
          label="Expected close"
          value={deal.expectedCloseDate ? shortDate(deal.expectedCloseDate) : null}
        />
        <Field
          label="Deployment"
          value={deal.totalCameras ? `${deal.totalCameras} cameras` : null}
        />
      </View>

      {sites.length ? (
        <Section title={`Sites · ${sites.length}`}>
          {sites.map((site) => (
            <View key={site.id}>
              <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm }}>
                <Txt variant="bodyStrong">{site.name}</Txt>
                {site.city ? (
                  <>
                    <Gap size="xs" />
                    <Txt variant="caption" tone="subtle">
                      {site.city}
                    </Txt>
                  </>
                ) : null}
                <Gap size="sm" />
              </View>
              {site.spocPhone ? (
                <ActionRow
                  label={site.spocName ? `Call ${site.spocName}` : "Call site"}
                  value={site.spocPhone}
                  url={`tel:${site.spocPhone.replace(/\s/g, "")}`}
                />
              ) : null}
              {site.address ? (
                <ActionRow
                  label="Navigate"
                  value={site.address}
                  url={mapsUrl(`${site.name} ${site.address}`)}
                />
              ) : null}
            </View>
          ))}
        </Section>
      ) : deal.location ? (
        <Section title="Location">
          <ActionRow label="Navigate" value={deal.location} url={mapsUrl(deal.location)} />
        </Section>
      ) : null}

      <Section title="Record">
        <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
          <Overline>Last updated</Overline>
          <Gap size="xs" />
          <Txt variant="caption" tone="subtle">
            {shortDate(deal.updatedAt)}
          </Txt>
          <Gap size="md" />
          <Txt variant="caption" tone="subtle">
            Editing happens on the web app — this is a read-only view.
          </Txt>
        </View>
      </Section>
    </ScrollView>
  );
}
