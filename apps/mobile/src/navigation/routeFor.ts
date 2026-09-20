/**
 * Maps a notification's `actionUrl` onto a screen in this app.
 *
 * The gateway writes web paths ("/deals", "/leads/abc") because the web app was
 * its only client. Rather than change the contract and break every notification
 * already in the database, the app translates on the way in.
 *
 * Unknown paths return null and the tap simply opens the app on Activity —
 * a notification type added server-side must never crash an older build.
 */
export interface Route {
  screen: string;
  params?: Record<string, string>;
}

export function routeFor(actionUrl: string | null | undefined): Route | null {
  if (!actionUrl) return null;

  // Tolerate an absolute URL as well as a path: the field is free-form.
  const path = actionUrl.replace(/^https?:\/\/[^/]+/, "").split("?")[0];
  const [, head, id] = path.split("/");

  switch (head) {
    case "deals":
      return id ? { screen: "DealDetail", params: { id } } : { screen: "Deals" };
    case "leads":
      return id ? { screen: "LeadDetail", params: { id } } : { screen: "Leads" };
    case "accounts":
    case "companies":
      return id ? { screen: "CompanyDetail", params: { id } } : { screen: "Companies" };
    default:
      return null;
  }
}
