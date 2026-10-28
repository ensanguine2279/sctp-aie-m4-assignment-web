// app/page.tsx
import { getSessionClaims, homePathFor } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await getSessionClaims();

  // If the user already has a token, send them to their role's landing page
  if (session) {
    redirect(homePathFor(session.roles));
  }

  // Otherwise, route the root domain directly to the authentication page
  redirect("/login");
}
