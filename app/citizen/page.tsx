import { redirect } from "next/navigation";
import CitizenShell from "@/components/Citizen/CitizenShell";
import { getCurrentCitizenEmail } from "@/lib/session";
import { findCitizenByEmail } from "@/lib/db";

export default async function CitizenPage() {
  const email = await getCurrentCitizenEmail();
  if (!email) {
    redirect("/login?tab=citizen");
  }
  const citizen = await findCitizenByEmail(email);
  return <CitizenShell email={email} name={citizen?.name ?? null} phone={citizen?.phone ?? null} />;
}
