import { Menu } from "lucide-react";
import LogoutButton from "@/components/Login/LogoutButton";
import Avatar from "@/components/shared/Avatar";
import NotificationBell from "@/components/Dashboard/NotificationBell";

export default function Topbar({
  email,
  isPaid,
  onOpenRequests,
  onToggleMobileMenu,
}: {
  email: string | null;
  isPaid: boolean;
  onOpenRequests: () => void;
  onToggleMobileMenu?: () => void;
}) {
  return (
    <header className="flex items-center justify-between px-3 sm:px-6 lg:px-8 py-3 sm:py-4 bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center gap-2.5">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <h1 className="font-bold text-base sm:text-lg text-slate-900">Dashboard</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <NotificationBell onOpenRequests={onOpenRequests} />
        <div className="flex items-center gap-2 text-sm text-slate-700 sm:pl-3 sm:border-l sm:border-gray-200">
          <Avatar name={email || "Member"} size="sm" />
          <span className="font-medium hidden md:inline-block max-w-[140px] lg:max-w-[200px] truncate">
            {email || "Member"}
          </span>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}

