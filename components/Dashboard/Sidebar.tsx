"use client";

import { UserPlus, Users, ShieldCheck, Lock, Crown, LayoutGrid, Bell, UserCog, ClipboardList, X } from "lucide-react";
import Link from "next/link";

export type Section = "overview" | "new-entry" | "all-clients" | "requests" | "members" | "all-complaints";

export default function Sidebar({
  section,
  onChange,
  isPaid,
  isAdmin,
  mobileOpen = false,
  onClose,
}: {
  section: Section;
  onChange: (s: Section) => void;
  isPaid: boolean;
  isAdmin: boolean;
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const navItems: {
    id: Section;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: "overview", label: "Overview", icon: <LayoutGrid size={18} /> },
    { id: "new-entry", label: "New Client Entry", icon: <UserPlus size={18} /> },
    { id: "all-clients", label: "All Clients", icon: <Users size={18} /> },
    { id: "requests", label: "Requests", icon: <Bell size={18} /> },
  ];

  const adminItems: {
    id: Section;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: "members", label: "Members", icon: <UserCog size={18} /> },
    { id: "all-complaints", label: "All Complaints", icon: <ClipboardList size={18} /> },
  ];

  const unlocked = isPaid || isAdmin;

  const handleSelect = (id: Section) => {
    onChange(id);
    onClose?.();
  };

  const renderItem = (item: { id: Section; label: string; icon: React.ReactNode }) => {
    const active = section === item.id;

    if (!unlocked) {
      return (
        <Link
          key={item.id}
          href="/membership"
          onClick={() => onClose?.()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-all duration-200"
        >
          {item.icon}
          <span className="flex-1">{item.label}</span>
          <Lock size={14} />
        </Link>
      );
    }

    return (
      <button
        key={item.id}
        onClick={() => handleSelect(item.id)}
        className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all duration-200 ${
          active
            ? "bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-md shadow-violet-900/40"
            : "text-slate-300 hover:bg-slate-800 hover:text-white hover:translate-x-0.5"
        }`}
      >
        {item.icon}
        {item.label}
      </button>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar container: fixed drawer on mobile, static on md+ */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 shrink-0 bg-slate-900 text-slate-300 flex flex-col min-h-screen transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-white">
              <ShieldCheck size={22} className="text-violet-400" />
              <span className="font-bold tracking-tight text-lg">CLIENT REGISTRY</span>
            </div>
            <p className="text-[11px] tracking-wider text-slate-500 mt-0.5 uppercase">
              {isAdmin ? "Member Portal · Admin" : "Member Portal"}
            </p>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="md:hidden p-1 text-slate-400 hover:text-white rounded-lg"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(renderItem)}

          {isAdmin && (
            <>
              <p className="px-3 pt-4 pb-1.5 text-[10px] font-semibold tracking-wider text-slate-600 uppercase">
                Admin
              </p>
              {adminItems.map(renderItem)}
            </>
          )}
        </nav>

        {!unlocked && (
          <div className="mx-3 mb-3 p-3 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-1">
              <Crown size={16} />
              Not a member yet
            </div>
            <p className="text-xs text-slate-400 mb-2">
              Unlock client entries and complaint records.
            </p>
            <Link
              href="/membership"
              onClick={() => onClose?.()}
              className="block text-center text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 rounded-md py-1.5"
            >
              Become a Member
            </Link>
          </div>
        )}

        <div className="px-6 py-4 border-t border-slate-800 text-[11px] text-slate-500">
          © {new Date().getFullYear()} Client Registry
        </div>
      </aside>
    </>
  );
}
