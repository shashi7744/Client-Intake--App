"use client";

import AnnouncementsFeed from "@/components/Dashboard/AnnouncementsFeed";

// The overview is a news feed of the latest admin announcements - the same
// for admins and members.
export default function DashboardOverview({ isAdmin: _isAdmin }: { isAdmin?: boolean } = {}) {
  return <AnnouncementsFeed />;
}
