"use client";

import { useState, useEffect } from "react";
import { UserPlus, Users, Bell, LayoutGrid, UserCog, ClipboardList, Megaphone } from "lucide-react";
import Sidebar, { Section } from "@/components/Dashboard/Sidebar";
import Topbar from "@/components/Dashboard/Topbar";
import SectionHero, { HeroAccent } from "@/components/Dashboard/SectionHero";
import DashboardOverview from "@/components/Dashboard/DashboardOverview";
import PushPromptCard from "@/components/shared/PushPromptCard";
import AdminClientEntryForm from "@/components/Dashboard/AdminClientEntryForm";
import AnnouncementsAdmin from "@/components/Dashboard/AnnouncementsAdmin";
import ClientsTable from "@/components/Dashboard/ClientsTable";
import RequestsPanel from "@/components/Dashboard/RequestsPanel";
import AdminRequestsPanel from "@/components/Dashboard/AdminRequestsPanel";
import MembersTable from "@/components/Dashboard/MembersTable";
import ComplaintsList from "@/components/Dashboard/ComplaintsList";

const HERO_CONTENT: Record<
  Section,
  { icon: React.ReactNode; title: string; subtitle: string; accent: HeroAccent }
> = {
  overview: {
    icon: <LayoutGrid size={22} />,
    title: "Dashboard Overview",
    subtitle: "Announcements and updates from the admin",
    accent: "indigo",
  },
  "new-entry": {
    icon: <UserPlus size={22} />,
    title: "New Client Entry",
    subtitle: "Create a member account and client record for someone else",
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
    subtitle: "All registered members and their submitted client details",
    accent: "violet",
  },
  "all-complaints": {
    icon: <ClipboardList size={22} />,
    title: "All Complaints",
    subtitle: "Filter by location and update complaint status",
    accent: "amber",
  },
  "admin-requests": {
    icon: <Bell size={22} />,
    title: "Contact Number Requests",
    subtitle: "Review and approve phone number access requests across all members",
    accent: "amber",
  },
  announcements: {
    icon: <Megaphone size={22} />,
    title: "Announcements",
    subtitle: "Share updates with every member - visible on their dashboard",
    accent: "indigo",
  },
};

export default function DashboardShell({
  email,
  isPaid = true,
  isAdmin,
}: {
  email: string | null;
  isPaid?: boolean;
  isAdmin: boolean;
}) {
  const [section, setSection] = useState<Section>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tableKey, setTableKey] = useState(0);

  useEffect(() => {
    if (email) {
      try {
        localStorage.setItem("member_email", email.trim().toLowerCase());
        localStorage.setItem("last_portal", "member");
      } catch {
        // ignore
      }
    }
  }, [email]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const s = params.get("section");
    if (s && s in HERO_CONTENT) {
      const next = s === "requests" && isAdmin ? "admin-requests" : s;
      if (next in HERO_CONTENT) setSection(next as Section);
    }
  }, [isAdmin]);

  const hero = HERO_CONTENT[section] || HERO_CONTENT.overview;

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
          onNavigate={(target) => {
            // Notifications name a logical screen; admins have their own
            // Requests screen.
            const next = target === "requests" && isAdmin ? "admin-requests" : target;
            if (next in HERO_CONTENT) setSection(next as Section);
          }}
          onToggleMobileMenu={() => setMobileMenuOpen((o) => !o)}
        />

        <main className="flex-1 px-3 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-6xl w-full mx-auto">
          <PushPromptCard message="Get notified instantly about new announcements, complaints and requests, even when the app is closed." />
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
              {section === "new-entry" && isAdmin && (
                <AdminClientEntryForm onSubmitted={() => setTableKey((k) => k + 1)} />
              )}
              {section === "announcements" && isAdmin && <AnnouncementsAdmin />}
              {section === "all-clients" && <ClientsTable key={tableKey} />}
              {section === "requests" && <RequestsPanel />}
              {section === "admin-requests" && isAdmin && <AdminRequestsPanel />}
              {section === "members" && isAdmin && <MembersTable currentEmail={email} />}
              {section === "all-complaints" && isAdmin && <ComplaintsList />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
