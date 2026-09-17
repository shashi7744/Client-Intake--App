import { Crown } from "lucide-react";
import LogoutButton from "@/components/Login/LogoutButton";
import Avatar from "@/components/shared/Avatar";
import NotificationBell from "@/components/Dashboard/NotificationBell";

export default function Topbar({
  email,
  isPaid,
  onOpenRequests,
}: {
  email: string | null;
  isPaid: boolean;
  onOpenRequests: () => void;
}) {
  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
      <div>
        <h1 className="font-bold text-lg text-slate-900">Dashboard</h1>
      </div>
      <div className="flex items-center gap-4">
        {isPaid && (
          <span className="flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">
            <Crown size={12} />
            Member
          </span>
        )}
        {isPaid && <NotificationBell onOpenRequests={onOpenRequests} />}
        <div className="flex items-center gap-2.5 text-sm text-slate-700 pl-3 border-l border-gray-200">
          <Avatar name={email || "Member"} size="sm" />
          <span className="font-medium">{email || "Member"}</span>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
