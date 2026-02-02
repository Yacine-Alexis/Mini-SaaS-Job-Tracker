"use client";

import { useEffect, useState, useCallback } from "react";
import { ConfirmModal } from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

type Contact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  company: string | null;
  createdAt: string;
};

function ContactsSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-4 w-32 mb-2" />
          <div className="flex gap-2 mb-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-40" />
        </div>
      ))}
    </div>
  );
}

export default function ContactsPanel({ applicationId }: { applicationId: string }) {
  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/contacts?applicationId=${encodeURIComponent(applicationId)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error?.message ?? "Failed to load contacts");
        return;
      }
      setItems(data.items ?? []);
    } catch {
      setErr("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function add() {
    if (!name.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          applicationId,
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          role: role.trim() || null,
          company: company.trim() || null
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error?.message ?? "Create failed");
        return;
      }
      setName(""); setEmail(""); setPhone(""); setRole(""); setCompany("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/contacts?id=${encodeURIComponent(deleteId)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) setErr(data?.error?.message ?? "Delete failed");
      else await load();
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Contacts</h2>
        <button className="btn" onClick={load} disabled={loading}>Refresh</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input 
          className="input" 
          placeholder="Name *" 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              e.preventDefault();
              add();
            }
          }}
        />
        <input className="input" placeholder="Role (recruiter, hiring manager...)" value={role} onChange={(e) => setRole(e.target.value)} />
        <input className="input" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" placeholder="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className="input md:col-span-2" placeholder="Company (optional)" value={company} onChange={(e) => setCompany(e.target.value)} />
        <button className="btn btn-primary md:col-span-2" onClick={add} disabled={saving || !name.trim()}>
          {saving ? "Adding..." : "Add contact"}
        </button>
      </div>

      {err && <div role="alert" aria-live="polite" className="text-sm text-red-600">{err}</div>}

      {loading ? (
        <ContactsSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon="contacts"
          title="No contacts yet"
          description="Add contacts like recruiters or hiring managers for this application."
        />
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <ContactRow key={c.id} contact={c} onChanged={load} onDelete={(id) => setDeleteId(id)} />
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete contact"
        message="Are you sure you want to delete this contact? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

function ContactRow({
  contact,
  onChanged,
  onDelete
}: {
  contact: Contact;
  onChanged: () => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(contact.name);
  const [role, setRole] = useState(contact.role ?? "");
  const [email, setEmail] = useState(contact.email ?? "");
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [company, setCompany] = useState(contact.company ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setName(contact.name);
    setRole(contact.role ?? "");
    setEmail(contact.email ?? "");
    setPhone(contact.phone ?? "");
    setCompany(contact.company ?? "");
  }, [contact]);

  async function save() {
    if (!name.trim()) { setErr("Name required."); return; }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/contacts?id=${encodeURIComponent(contact.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          role: role.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          company: company.trim() || null
        })
      });
      const data = await res.json();
      if (!res.ok) { setErr(data?.error?.message ?? "Update failed"); return; }
      setEditing(false);
      await onChanged();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
      <div className="text-xs text-zinc-500">{new Date(contact.createdAt).toLocaleString()}</div>

      {!editing ? (
        <>
          <div className="mt-1 text-sm font-medium">{contact.name}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {contact.role && <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{contact.role}</span>}
            {contact.company && <span className="badge bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">{contact.company}</span>}
          </div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
            {contact.email && (
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a className="underline hover:text-blue-600" href={`mailto:${contact.email}`}>{contact.email}</a>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a className="underline hover:text-blue-600" href={`tel:${contact.phone}`}>{contact.phone}</a>
              </div>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <button className="btn text-xs" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => onDelete(contact.id)}>Delete</button>
          </div>
        </>
      ) : (
        <div className="mt-2 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name *" />
            <input className="input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" />
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" type="tel" />
            <input className="input md:col-span-2" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" />
          </div>
          {err && <div role="alert" aria-live="polite" className="text-sm text-red-600">{err}</div>}
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            <button className="btn" onClick={() => { setEditing(false); setErr(null); }} disabled={saving}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
