import { redirect } from "next/navigation";

export default function LegacyNewClientPage() {
  redirect("/dashboard");
}
