import DashboardShell from "@/components/Dashboard/DashboardShell";
import { getCurrentMember } from "@/lib/session";

export default async function DashboardPage() {
  const member = await getCurrentMember();
  return (
    <DashboardShell
      email={member?.email ?? null}
      isPaid={member?.isPaid ?? false}
      isAdmin={member?.role === "admin"}
    />
  );
}
