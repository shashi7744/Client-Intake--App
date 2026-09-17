"use client";

import { useState } from "react";
import { UserPlus, Users, Bell, LayoutGrid, Crown, UserCog, ClipboardList } from "lucide-react";
import Link from "next/link";
import Sidebar, { Section } from "@/components/Dashboard/Sidebar";
import Topbar from "@/components/Dashboard/Topbar";
import SectionHero, { HeroAccent } from "@/components/Dashboard/SectionHero";
import DashboardOverview from "@/components/Dashboard/DashboardOverview";
import ClientFormWrapper from "@/components/ClientForm/ClientFormWrapper";
import ClientsTable from "@/components/Dashboard/ClientsTable";
import RequestsPanel from "@/components/Dashboard/RequestsPanel";
import MembersTable from "@/components/Dashboard/MembersTable";
import ComplaintsList from "@/components/Dashboard/ComplaintsList";

const HERO_CONTENT: Record<
  Section,
  { icon: React.ReactNode; title: string; subtitle: string; accent: HeroAccent }
> = {
  overview: {
    icon: <LayoutGrid size={22} />,
    title: "Dashboard Overview",
    subtitle: "A quick summary of your client registrations",
    accent: "indigo",
  },
  "new-entry": {
    icon: <UserPlus size={22} />,
    title: "Register Client",
    subtitle: "Fill all details to create a client record",
    accent: "emerald",
  },
  "all-clients": {
    icon: <Users size={22} />,
    title: "Client Records",
    subtitle: "Search and filter all registered clients",
    accent: "violet",
  },
  requests: {
    icon: <Bell size={22} />,
    title: "Phone Number Requests",
    subtitle: "Approve or deny access to your clients' contact numbers",
    accent: "amber",
  },
  members: {
    icon: <UserCog size={22} />,
    title: "Members",
    subtitle: "Everyone who has subscribed and registered clients",
    accent: "violet",
  },
  "all-complaints": {
    icon: <ClipboardList size={22} />,
    title: "All Complaints",
    subtitle: "Filter by location and update complaint status",
    accent: "amber",
  },
};

export default function DashboardShell({
  email,
  isPaid,
  isAdmin,
}: {
  email: string | null;
  isPaid: boolean;
  isAdmin: boolean;
}) {
  const [section, setSection] = useState<Section>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tableKey, setTableKey] = useState(0);
  const unlocked = isPaid || isAdmin;

  const hero = HERO_CONTENT[section];

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-x-hidden">
      <Sidebar
        section={section}
        onChange={setSection}
        isPaid={isPaid}
        isAdmin={isAdmin}
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          email={email}
          isPaid={isPaid}
          onOpenRequests={() => setSection("requests")}
          onToggleMobileMenu={() => setMobileMenuOpen((o) => !o)}
        />

        <main className="flex-1 px-3 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-6xl w-full mx-auto">
          {!unlocked ? (
            <div className="animate-fadeIn text-center py-12 sm:py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                <Crown size={30} className="text-amber-500" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                Become a member to unlock your dashboard
              </h2>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                Client registration, records, and complaint management are
                available once you complete a one-time membership payment.
              </p>
              <Link
                href="/membership"
                className="inline-flex bg-amber-600 text-white hover:bg-amber-700 px-6 py-2.5 rounded-lg text-sm font-medium"
              >
                Become a Member
              </Link>
            </div>
          ) : (
            <div key={section} className="animate-fadeIn">
              <SectionHero
                icon={hero.icon}
                title={hero.title}
                subtitle={hero.subtitle}
                accent={hero.accent}
              />

              <div
                className={`bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6 ${
                  section === "new-entry" ? "max-w-2xl mx-auto" : ""
                }`}
              >
                {section === "overview" && <DashboardOverview isAdmin={isAdmin} />}
                {section === "new-entry" && (
                  <ClientFormWrapper onSubmitted={() => setTableKey((k) => k + 1)} />
                )}
                {section === "all-clients" && <ClientsTable key={tableKey} />}
                {section === "requests" && <RequestsPanel />}
                {section === "members" && isAdmin && <MembersTable />}
                {section === "all-complaints" && isAdmin && <ComplaintsList />}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
