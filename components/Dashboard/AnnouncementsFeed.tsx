"use client";

import { useEffect, useState } from "react";
import { Megaphone, ExternalLink, Facebook, Instagram, Youtube, X, Clock, ChevronRight, Newspaper } from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  description: string;
  link?: string;
  photo?: string;
  createdAt: string;
};

export function linkMeta(link: string) {
  let host = "";
  try {
    host = new URL(link).hostname.toLowerCase();
  } catch {}
  if (host.includes("facebook") || host.includes("fb.")) return { label: "Open on Facebook", Icon: Facebook };
  if (host.includes("instagram") || host.includes("instagr.am")) return { label: "Open on Instagram", Icon: Instagram };
  if (host.includes("youtube") || host.includes("youtu.be")) return { label: "Watch on YouTube", Icon: Youtube };
  return { label: "Open link", Icon: ExternalLink };
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

const isNew = (iso: string) => Date.now() - new Date(iso).getTime() < 24 * 60 * 60 * 1000;

// Number of stories shown in the "Top stories" column next to the featured one.
const SIDE_COUNT = 4;

function Cover({ a, large = false, className = "" }: { a: Announcement; large?: boolean; className?: string }) {
  if (a.photo) {
    return (
      <img
        src={a.photo}
        alt=""
        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${className}`}
      />
    );
  }
  return (
    <div className={`w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white/40 ${className}`}>
      <Megaphone size={large ? 44 : 22} />
    </div>
  );
}

function TimeTag({ iso, light = false }: { iso: string; light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${light ? "text-white/75" : "text-gray-400"}`}>
      {isNew(iso) && <span className="w-1.5 h-1.5 rounded-full bg-red-500" aria-label="New" />}
      <Clock size={12} />
      {timeAgo(iso)}
    </span>
  );
}

// Card-like element that opens the reader. A div (not <button>) so the global
// button padding / hover-lift styles don't distort the layout.
function Story({ onOpen, className, children }: { onOpen: () => void; className: string; children: React.ReactNode }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="w-1 h-4 rounded-full bg-violet-600" />
      <h3 className="text-sm font-bold tracking-wide text-slate-900 uppercase">{children}</h3>
      <span className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function Reader({ a, onClose }: { a: Announcement; onClose: () => void }) {
  const meta = a.link ? linkMeta(a.link) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-6"
      onClick={onClose}
    >
      <article
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-3xl max-h-[94vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl animate-fadeIn"
      >
        <div className="relative">
          {a.photo ? (
            <img src={a.photo} alt="" className="w-full max-h-[55vh] object-cover" />
          ) : (
            <div className="h-28">
              <Cover a={a} />
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white !rounded-full !p-2 flex items-center justify-center"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-6 sm:px-10 sm:py-8">
          <p className="text-xs font-semibold tracking-wider uppercase text-violet-600">Announcement</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 leading-tight break-words">{a.title}</h2>
          <p className="text-sm text-gray-500 mt-3 pb-5 border-b border-gray-100">
            {new Date(a.createdAt).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}
          </p>
          <p className="text-base leading-7 text-slate-700 mt-5 whitespace-pre-wrap break-words">{a.description}</p>
          {a.link && meta && (
            <a
              href={a.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 px-4 py-2.5 rounded-lg border border-violet-200 bg-violet-50 text-sm font-medium text-violet-700 hover:bg-violet-100"
            >
              <meta.Icon size={16} /> {meta.label}
            </a>
          )}
        </div>
      </article>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-8">
      <div className="h-10 rounded-lg bg-gray-100 animate-shimmer" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 aspect-[16/10] rounded-2xl bg-gray-100 animate-shimmer" />
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 animate-shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementsFeed({ limit }: { limit?: number }) {
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [open, setOpen] = useState<Announcement | null>(null);

  useEffect(() => {
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((d) => setItems(d.announcements || []))
      .catch(() => setItems([]));
  }, []);

  if (items === null) return <Skeleton />;

  const shown = limit ? items.slice(0, limit) : items;

  if (shown.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl text-center py-16 px-6">
        <div className="w-14 h-14 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-4">
          <Newspaper size={26} />
        </div>
        <p className="font-semibold text-slate-900">No news yet</p>
        <p className="text-sm text-gray-500 mt-1">Announcements from the admin will appear here.</p>
      </div>
    );
  }

  const [featured, ...others] = shown;
  const side = others.slice(0, SIDE_COUNT);
  const more = others.slice(SIDE_COUNT);
  const todayCount = shown.filter((a) => isNew(a.createdAt)).length;

  return (
    <div className="space-y-10">
      {/* Masthead strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm">
        <span className="font-medium text-slate-700">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </span>
        <span className="inline-flex items-center gap-2 text-gray-500">
          {todayCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-red-600 font-medium">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-red-500" />
              </span>
              {todayCount} new today
            </span>
          )}
          {todayCount > 0 && <span className="text-gray-300">|</span>}
          {shown.length} {shown.length === 1 ? "update" : "updates"}
        </span>
      </div>

      {/* Featured + top stories */}
      <div className={`grid grid-cols-1 gap-6 ${side.length > 0 ? "lg:grid-cols-3" : ""}`}>
        <Story
          onOpen={() => setOpen(featured)}
          className={`relative overflow-hidden rounded-2xl bg-slate-900 shadow-sm ${side.length > 0 ? "lg:col-span-2" : ""}`}
        >
          <div className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-auto lg:h-full lg:min-h-[26rem]">
            <Cover a={featured} large />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 text-white">
            <span className="inline-block text-[11px] font-bold tracking-widest uppercase bg-violet-600 px-2.5 py-1 rounded">
              Top story
            </span>
            <h2 className="mt-3 text-xl sm:text-3xl font-bold leading-tight break-words line-clamp-3">{featured.title}</h2>
            <p className="mt-2 text-sm sm:text-base text-white/80 leading-relaxed line-clamp-2 break-words max-w-2xl">
              {featured.description}
            </p>
            <div className="mt-4 flex items-center gap-4">
              <TimeTag iso={featured.createdAt} light />
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-white group-hover:underline">
                Read more <ChevronRight size={14} />
              </span>
            </div>
          </div>
        </Story>

        {side.length > 0 && (
          <aside className="bg-white border border-gray-200 rounded-2xl p-5">
            <SectionLabel>Top stories</SectionLabel>
            <ol className="divide-y divide-gray-100">
              {side.map((a, i) => (
                <li key={a.id}>
                  <Story onOpen={() => setOpen(a)} className="flex gap-3 py-3.5 first:pt-0 rounded-lg">
                    <span className="text-2xl font-bold text-gray-200 leading-none w-6 shrink-0 tabular-nums">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 break-words group-hover:text-violet-700">
                        {a.title}
                      </h4>
                      <div className="mt-1.5">
                        <TimeTag iso={a.createdAt} />
                      </div>
                    </div>
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                      <Cover a={a} />
                    </div>
                  </Story>
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>

      {/* More news */}
      {more.length > 0 && (
        <section>
          <SectionLabel>More news</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {more.map((a) => (
              <Story
                key={a.id}
                onOpen={() => setOpen(a)}
                className="flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200"
              >
                <div className="aspect-[16/9] overflow-hidden">
                  <Cover a={a} />
                </div>
                <div className="flex flex-col flex-1 p-5">
                  <h4 className="font-semibold text-slate-900 leading-snug line-clamp-2 break-words group-hover:text-violet-700">
                    {a.title}
                  </h4>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed line-clamp-3 break-words">{a.description}</p>
                  <div className="mt-auto pt-4">
                    <TimeTag iso={a.createdAt} />
                  </div>
                </div>
              </Story>
            ))}
          </div>
        </section>
      )}

      {open && <Reader a={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
