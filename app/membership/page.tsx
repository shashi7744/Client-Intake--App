import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MembershipCard from "@/components/Membership/MembershipCard";

export default function MembershipPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md mb-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>
      </div>
      <MembershipCard />
    </main>
  );
}
