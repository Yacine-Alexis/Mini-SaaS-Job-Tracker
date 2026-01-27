"use client";

import { useEffect, useState } from "react";

type Contact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  company: string | null;
  createdAt: string;
};

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

  async function load() {
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
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

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
          email: email.trim() ? email.trim() : null,
          phone: phone.trim() ? phone.trim() : null,
          role: role.trim() ? role.trim() : null,
          company: company.trim() ? company.trim() : null
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

  async function del(id: string) {
    if (!confirm("Delete this contact?")) return;
    const res = await fetch(`/api/contacts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) setErr(data?.error?.message ?? "Delete failed");
    else await load();
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Contacts</h2>
        <button className="btn" onClick={load} disabled={loading}>Refresh</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Role (recruiter…)" value={role} onChange={(e) => setRole(e.target.value)} />
        <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className="input md:col-span-2" placeholder="Company (optional)" value={company} onChange={(e) => setCompany(e.target.value)} />
        <button className="btn btn-primary md:col-span-2" onClick={add} disabled={saving || !name.trim()}>
          {saving ? "Adding…" : "Add contact"}
        </button>
      </div>

      {loading && <div className="text-sm text-zinc-600">Loading…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}

      {!loading && !err && items.length === 0 && (
        <div className="text-sm text-zinc-600">No contacts yet.</div>
      )}

      <div className="space-y-2">
        {items.map((c) => (
          <ContactRow key={c.id} contact={c} onChanged={load} onDelete={del} />
        ))}
      </div>
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
  onDelete: (id: string) => Promise<void>;
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
          role: role.trim() ? role.trim() : null,
          email: email.trim() ? email.trim() : null,
          phone: phone.trim() ? phone.trim() : null,
          company: company.trim() ? company.trim() : null
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
    <div className="rounded-lg border border-zinc-200 p-3">
      <div className="text-xs text-zinc-500">{new Date(contact.createdAt).toLocaleString()}</div>

      {!editing ? (
        <>
          <div className="mt-1 text-sm font-medium">{contact.name}</div>
          <div className="mt-1 text-sm text-zinc-700">
            {contact.role && <span className="badge mr-2">{contact.role}</span>}
            {contact.company && <span className="badge mr-2">{contact.company}</span>}
          </div>
          <div className="mt-2 text-sm text-zinc-700 space-y-1">
            {contact.email && <div>Email: <a className="underline" href={`mailto:${contact.email}`}>{contact.email}</a></div>}
            {contact.phone && <div>Phone: <a className="underline" href={`tel:${contact.phone}`}>{contact.phone}</a></div>}
          </div>

          <div className="mt-2 flex gap-2">
            <button className="btn" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn" onClick={() => onDelete(contact.id)}>Delete</button>
          </div>
        </>
      ) : (
        <div className="mt-2 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
            <input className="input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" />
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
            <input className="input md:col-span-2" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company (optional)" />
          </div>
          {err && <div className="text-sm text-red-600">{err}</div>}
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            <button className="btn" onClick={() => { setEditing(false); setErr(null); }} disabled={saving}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
