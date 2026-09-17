"use client";

import { useEffect, useMemo, useState } from "react";
import type { AccessRequest } from "@/lib/db";
import { Inbox, Search, MapPin, Users } from "lucide-react";
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

  const filtered = useMemo(() => {
    if (!clients) return [];
    return clients.filter((c) => {
      if (filter.district && c.district !== filter.district) return false;
      if (filter.taluka && !c.taluka.toLowerCase().includes(filter.taluka.toLowerCase())) return false;
      if (filter.city && !c.city.toLowerCase().includes(filter.city.toLowerCase())) return false;
      if (search) {
        const q = search.toLowerCase();
        const contactMatch = c.contact ? c.contact.includes(q) : false;
        if (!c.name.toLowerCase().includes(q) && !contactMatch) return false;
      }
      return true;
    });
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
          <span className="font-semibold text-slate-900">{filtered.length}</span>
          {filtered.length === 1 ? "client" : "clients"}
          {filtered.length !== clients.length && (
            <span className="text-gray-400">of {clients.length}</span>
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

      {clients.length === 0 ? (
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
        <div className="border border-gray-200 rounded-xl overflow-hidden">
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
      )}
    </div>
  );
}
