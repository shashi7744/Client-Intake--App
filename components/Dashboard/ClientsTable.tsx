"use client";

import { useEffect, useMemo, useState } from "react";
import type { AccessRequest } from "@/lib/db";
import { Inbox, Search, MapPin, Users, MapPinned } from "lucide-react";
import HeadBadge, { HeadInfo } from "@/components/shared/HeadBadge";
import Avatar from "@/components/shared/Avatar";
import ContactCell from "@/components/Dashboard/ContactCell";
import LocationFilterBar, {
  LocationFilter,
  EMPTY_LOCATION_FILTER,
} from "@/components/shared/LocationFilterBar";

type ClientRow = {
  id: string;
  name: string;
  gender: string;
  age: number;
  contact: string | null;
  contactAccess: boolean;
  post: string;
  district: string;
  taluka: string;
  city: string;
  ward: string;
  submittedBy: string;
  submittedAt: string;
  head?: HeadInfo | null;
};

export default function ClientsTable() {
  const [clients, setClients] = useState<ClientRow[] | null>(null);
  const [outgoing, setOutgoing] = useState<Record<string, AccessRequest>>({});
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<LocationFilter>(EMPTY_LOCATION_FILTER);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/clients")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setClients(data.clients);
        } else {
          setError(data.message || "Failed to load clients");
        }
      })
      .catch(() => setError("Failed to load clients"));

    fetch("/api/access-requests")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          const map: Record<string, AccessRequest> = {};
          for (const r of data.outgoing as AccessRequest[]) map[r.clientId] = r;
          setOutgoing(map);
        }
      })
      .catch(() => {});
  }, []);

  const handleRequested = (clientId: string, request: AccessRequest) => {
    setOutgoing((prev) => ({ ...prev, [clientId]: request }));
  };

  // Nothing is listed until a district is chosen. Once it is, that district's
  // head is shown first, then its taluka heads, then everyone else.
  const districtChosen = !!filter.district;

  const filtered = useMemo(() => {
    if (!clients || !filter.district) return [];
    const typedTaluka = filter.taluka.trim().toLowerCase();
    const headsThisDistrict = (c: ClientRow) => c.head?.district === filter.district;
    const isDistrictHead = (c: ClientRow) => headsThisDistrict(c) && c.head?.level === "district";
    const isTalukaHead = (c: ClientRow) => headsThisDistrict(c) && c.head?.level === "taluka";
    const talukaHeadMatchesTyped = (c: ClientRow) =>
      !typedTaluka || (c.head?.taluka ?? "").toLowerCase().includes(typedTaluka);

    const rank = (c: ClientRow) => {
      if (isDistrictHead(c)) return 0;
      if (isTalukaHead(c)) return typedTaluka && talukaHeadMatchesTyped(c) ? 1 : 2;
      return 3;
    };

    return clients
      .filter((c) => {
        const head = isDistrictHead(c) || (isTalukaHead(c) && talukaHeadMatchesTyped(c));
        if (!head) {
          if (c.district !== filter.district) return false;
          if (typedTaluka && !c.taluka.toLowerCase().includes(typedTaluka)) return false;
          if (filter.city && !c.city.toLowerCase().includes(filter.city.toLowerCase())) return false;
        }
        if (search) {
          const q = search.toLowerCase();
          const contactMatch = c.contact ? c.contact.includes(q) : false;
          if (!c.name.toLowerCase().includes(q) && !contactMatch) return false;
        }
        return true;
      })
      .map((c, idx) => ({ c, idx }))
      .sort((a, b) => rank(a.c) - rank(b.c) || a.idx - b.idx)
      .map((x) => x.c);
  }, [clients, filter, search]);

  if (error) return <p className="text-red-500 text-sm">{error}</p>;

  if (!clients) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-14 rounded-lg bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 bg-[length:200%_100%] animate-shimmer"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Users size={15} className="text-violet-600" />
          {districtChosen ? (
            <>
              <span className="font-semibold text-slate-900">{filtered.length}</span>
              {filtered.length === 1 ? "client" : "clients"}
              <span className="text-gray-400">in {filter.district}</span>
            </>
          ) : (
            <span className="text-gray-500">Choose a district to see clients</span>
          )}
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or contact..."
            className="w-full pl-8 text-sm py-1.5"
          />
        </div>
      </div>

      <LocationFilterBar value={filter} onChange={setFilter} />

      {!districtChosen ? (
        <div className="text-center py-14 animate-fadeIn">
          <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-3">
            <MapPinned size={22} className="text-violet-500" />
          </div>
          <p className="text-sm font-medium text-slate-700">Select a district to view members</p>
          <p className="text-xs text-gray-400 mt-1">
            Pick a district in the filter above. The district head is shown first.
          </p>
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-14 animate-fadeIn">
          <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-3">
            <Inbox size={22} className="text-violet-400" />
          </div>
          <p className="text-sm font-medium text-slate-700">No client entries yet</p>
          <p className="text-xs text-gray-400 mt-1">
            New registrations will appear here as members are added.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No clients match this filter.</p>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filtered.map((c, i) => (
              <div
                key={c.id}
                className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm space-y-2.5 animate-fadeInUp"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={c.name} size="md" />
                    <div>
                      <p className="font-semibold text-slate-900 text-sm leading-tight">{c.name}</p>
                      <HeadBadge head={c.head} />
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} />
                        {c.city}, Ward {c.ward}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 font-medium whitespace-nowrap">
                    {c.post}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-2">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Gender / Age</span>
                    <span className="font-medium">{c.gender}, {c.age} yrs</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Taluka / District</span>
                    <span className="font-medium">{c.taluka}, {c.district}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                  <div className="text-xs">
                    <ContactCell
                      clientId={c.id}
                      contact={c.contact}
                      contactAccess={c.contactAccess}
                      outgoingRequest={outgoing[c.id]}
                      onRequested={handleRequested}
                    />
                  </div>
                  <span className="text-[11px] text-gray-400">
                    {new Date(c.submittedAt).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Client</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Gender / Age</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Contact</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Post</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Location</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Registered By</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((c, i) => (
                    <tr
                      key={c.id}
                      className="animate-fadeInUp hover:bg-slate-50 transition-colors"
                      style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.name} size="md" />
                          <div>
                            <p className="font-medium text-slate-900 leading-tight">{c.name}</p>
                            <HeadBadge head={c.head} />
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <MapPin size={11} />
                              {c.city}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {c.gender}, {c.age}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        <ContactCell
                          clientId={c.id}
                          contact={c.contact}
                          contactAccess={c.contactAccess}
                          outgoingRequest={outgoing[c.id]}
                          onRequested={handleRequested}
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">{c.post}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {c.district}, {c.taluka}
                        <br />
                        <span className="text-xs text-gray-400">Ward {c.ward}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">{c.submittedBy}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-400 text-xs">
                        {new Date(c.submittedAt).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
