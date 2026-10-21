// app/page.tsx
import { getSessionClaims } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await getSessionClaims();

  // If the user already has a valid token, send them straight to Operations
  if (session) {
    redirect("/dashboard");
  }

  // Otherwise, route the root domain directly to the authentication page
  redirect("/login");
}
