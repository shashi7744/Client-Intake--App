import CitizenShell from "@/components/Citizen/CitizenShell";
import { getCurrentCitizenEmail } from "@/lib/session";
import { findCitizenByEmail } from "@/lib/db";

export default async function CitizenPage() {
  const email = getCurrentCitizenEmail();
  const citizen = email ? await findCitizenByEmail(email) : undefined;
  return <CitizenShell email={email} name={citizen?.name ?? null} />;
}
