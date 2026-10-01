import { redirect } from "next/navigation";
import DashboardShell from "@/components/Dashboard/DashboardShell";
import CompleteProfileForm from "@/components/ClientForm/CompleteProfileForm";
import { getCurrentMember } from "@/lib/session";
import { hasClientProfile } from "@/lib/db";

export default async function DashboardPage() {
  const member = await getCurrentMember();
  if (!member) {
    redirect("/login");
  }
  const isAdmin = member.role === "admin";

  // Members who registered before profile capture existed are asked to
  // complete their details once, at their next login.
  if (member && !isAdmin && !(await hasClientProfile(member.email))) {
    return <CompleteProfileForm />;
  }

  return (
    <DashboardShell
      email={member?.email ?? null}
      isPaid={member?.isPaid ?? false}
      isAdmin={isAdmin}
    />
  );
}
