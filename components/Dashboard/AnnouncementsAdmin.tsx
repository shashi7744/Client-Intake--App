"use client";

import { useEffect, useState, useCallback } from "react";
import { Send, Trash2 } from "lucide-react";
import { linkMeta } from "./AnnouncementsFeed";
import PhotoUpload from "@/components/shared/PhotoUpload";

type Announcement = { id: string; title: string; description: string; link?: string; photo?: string; createdAt: string };

export default function AnnouncementsAdmin() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [photo, setPhoto] = useState("");
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Announcement[]>([]);

  const load = useCallback(() => {
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((d) => setItems(d.announcements || []))
      .catch(() => {});
  }, []);

  useEffect(load, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, link, photo }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      setOk(true);
      setMessage("Announcement posted. All members can now see it.");
      setTitle("");
      setDescription("");
      setLink("");
      setPhoto("");
      load();
    } else {
      setOk(false);
      setMessage(data.message || "Could not post announcement");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Header</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} placeholder="Announcement title" className="w-full" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={3000} placeholder="What do you want to share?" className="w-full" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Link <span className="font-normal text-gray-400">(optional — Facebook, Instagram or YouTube)</span>
          </label>
          <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://www.youtube.com/..." className="w-full" />
        </div>
        <PhotoUpload
          value={photo}
          onChange={setPhoto}
          label="Photo (optional)"
          helperText="Shown as the cover image of the news post."
          maxDimension={1280}
        />
        {message && <p className={`text-sm ${ok ? "text-green-600" : "text-red-500"}`}>{message}</p>}
        <button
          type="submit"
          disabled={loading || !title.trim() || !description.trim()}
          className="inline-flex items-center gap-2 bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
        >
          <Send size={16} /> {loading ? "Posting..." : "Submit"}
        </button>
      </form>

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Posted announcements ({items.length})</h3>
        {items.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing posted yet.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 border border-gray-100 rounded-lg p-3">
                {a.photo && (
                  <img src={a.photo} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 break-words">{a.title}</p>
                  <p className="text-sm text-gray-500 line-clamp-2 break-words">{a.description}</p>
                  {a.link && <p className="text-xs text-violet-600 mt-1">{linkMeta(a.link).label}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  className="shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  aria-label="Delete announcement"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
