import { useRoute } from "@react-navigation/native";
import { ScrollView, View } from "react-native";

import { useAccountLocations, useAccounts } from "../lib/queries";
import { spacing, useTheme } from "../theme";
import { Divider, Empty, Gap, Loading, Overline, Txt } from "../ui";
import { ActionRow, DetailHeader, Field, Section, mapsUrl } from "../ui/detail";

/**
 * One company, and its sites.
 *
 * The sites are the reason this screen earns its place on a phone: each one
 * carries a SPOC number to call and an address to navigate to, which is exactly
 * what someone on their way to a plant needs and cannot get from a laptop.
 */
export function CompanyDetailScreen() {
  const { params } = useRoute<any>();
  const t = useTheme();
  const { data, isLoading } = useAccounts();
  const account = data?.items?.find((a) => a.id === params?.id);
  const locations = useAccountLocations(params?.id ?? null);

  if (isLoading) return <Loading />;
  if (!account) {
    return <Empty title="Company not found" detail="It may have been deleted." />;
  }

  const sites = (locations.data?.items ?? []).filter((l) => !l.archivedAt);
  const website = account.website?.trim();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.canvas }}
      contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
    >
      <DetailHeader
        overline={account.industry}
        title={account.name}
        subtitle={
          [
            account.dealCount ? `${account.dealCount} deals` : null,
            account.leadCount ? `${account.leadCount} leads` : null,
            account.contactCount ? `${account.contactCount} contacts` : null,
          ]
            .filter(Boolean)
            .join(" · ") || null
        }
      />

      {account.phone || website ? (
        <Section title="Contact">
          {account.phone ? (
            <ActionRow
              label="Call"
              value={account.phone}
              url={`tel:${account.phone.replace(/\s/g, "")}`}
            />
          ) : null}
          {website ? (
            <ActionRow
              label="Website"
              value={website}
              url={website.startsWith("http") ? website : `https://${website}`}
            />
          ) : null}
        </Section>
      ) : null}

      {sites.length ? (
        <Section title={`Sites · ${sites.length}`}>
          {sites.map((site) => (
            <View key={site.id}>
              <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm }}>
                <Txt variant="bodyStrong">{site.name}</Txt>
                <Gap size="xs" />
                <Txt variant="caption" tone="subtle">
                  {[site.city, site.dealCount ? `${site.dealCount} deals` : null]
                    .filter(Boolean)
                    .join(" · ") || "No city recorded"}
                </Txt>
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
      ) : (
        <Section title="Sites">
          <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
            <Txt variant="caption" tone="subtle">
              No sites recorded for this company yet.
            </Txt>
          </View>
        </Section>
      )}

      <Section title="Record">
        <View style={{ paddingVertical: spacing.sm }}>
          <Field label="Owner" value={account.ownerName} />
        </View>
      </Section>
    </ScrollView>
  );
}
