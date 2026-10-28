import { getSessionClaims, homePathFor } from "@/lib/auth";
import { redirect } from "next/navigation";

// The old Orchestration page is gone. /dashboard (the logo link, old
// bookmarks) forwards each role to its own landing page.
export default async function DashboardIndexPage() {
  const session = await getSessionClaims();

  if (!session) {
    redirect("/login");
  }

  redirect(homePathFor(session.roles));
}
