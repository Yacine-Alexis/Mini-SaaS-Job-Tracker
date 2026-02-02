"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/Modal";
import { formatCurrency, CURRENCIES, OfferType } from "@/lib/validators/salaryOffers";

type SalaryOffer = {
  id: string;
  type: OfferType;
  baseSalary: number;
  bonus: number | null;
  equity: string | null;
  signingBonus: number | null;
  benefits: string | null;
  notes: string | null;
  offerDate: string;
  isAccepted: boolean | null;
  currency: string;
  createdAt: string;
};

const OFFER_TYPE_LABELS: Record<OfferType, { label: string; color: string; icon: string }> = {
  INITIAL_OFFER: { label: "Initial Offer", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: "📩" },
  COUNTER_OFFER: { label: "Counter Offer", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: "🔄" },
  REVISED_OFFER: { label: "Revised Offer", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: "📝" },
  FINAL_OFFER: { label: "Final Offer", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: "✅" },
};

interface SalaryOffersPanelProps {
  applicationId: string;
}

export default function SalaryOffersPanel({ applicationId }: SalaryOffersPanelProps) {
  const { addToast } = useToast();
  const [offers, setOffers] = useState<SalaryOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<OfferType>("INITIAL_OFFER");
  const [baseSalary, setBaseSalary] = useState("");
  const [bonus, setBonus] = useState("");
  const [equity, setEquity] = useState("");
  const [signingBonus, setSigningBonus] = useState("");
  const [benefits, setBenefits] = useState("");
  const [notes, setNotes] = useState("");
  const [offerDate, setOfferDate] = useState(new Date().toISOString().slice(0, 10));
  const [isAccepted, setIsAccepted] = useState<boolean | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/salary-offers?applicationId=${applicationId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error?.message ?? "Failed to load offers");
        return;
      }
      setOffers(data.items ?? []);
    } catch {
      setErr("Failed to load offers");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setType("INITIAL_OFFER");
    setBaseSalary("");
    setBonus("");
    setEquity("");
    setSigningBonus("");
    setBenefits("");
    setNotes("");
    setOfferDate(new Date().toISOString().slice(0, 10));
    setIsAccepted(null);
    setCurrency("USD");
  }

  function startEdit(offer: SalaryOffer) {
    setEditingId(offer.id);
    setType(offer.type);
    setBaseSalary(String(offer.baseSalary));
    setBonus(offer.bonus ? String(offer.bonus) : "");
    setEquity(offer.equity ?? "");
    setSigningBonus(offer.signingBonus ? String(offer.signingBonus) : "");
    setBenefits(offer.benefits ?? "");
    setNotes(offer.notes ?? "");
    setOfferDate(offer.offerDate.slice(0, 10));
    setIsAccepted(offer.isAccepted);
    setCurrency(offer.currency);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...(editingId && { id: editingId }),
        applicationId,
        type,
        baseSalary: parseInt(baseSalary, 10),
        bonus: bonus ? parseInt(bonus, 10) : null,
        equity: equity || null,
        signingBonus: signingBonus ? parseInt(signingBonus, 10) : null,
        benefits: benefits || null,
        notes: notes || null,
        offerDate: `${offerDate}T12:00:00.000Z`,
        isAccepted,
        currency,
      };

      const res = await fetch("/api/salary-offers", {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        addToast({ type: "error", title: "Error", message: data?.error?.message ?? "Failed to save" });
        return;
      }

      addToast({ type: "success", title: editingId ? "Offer updated" : "Offer recorded" });
      resetForm();
      await load();
    } catch {
      addToast({ type: "error", title: "Failed to save offer" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/salary-offers?id=${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        addToast({ type: "error", title: "Error", message: data?.error?.message ?? "Failed to delete" });
        return;
      }
      addToast({ type: "success", title: "Offer deleted" });
      setDeleteId(null);
      await load();
    } catch {
      addToast({ type: "error", title: "Failed to delete offer" });
    } finally {
      setDeleting(false);
    }
  }

  // Calculate total compensation
  function getTotalComp(offer: SalaryOffer): number {
    return offer.baseSalary + (offer.bonus ?? 0);
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <span>💰</span>
          Salary Offers
        </h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="btn btn-sm text-xs"
        >
          + Add Offer
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-3">
            {editingId ? "Edit Offer" : "Record New Offer"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as OfferType)}
                  className="input text-sm"
                >
                  {Object.entries(OFFER_TYPE_LABELS).map(([value, { label }]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="input text-sm"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Base Salary *
                </label>
                <input
                  type="number"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  placeholder="e.g., 120000"
                  className="input text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Annual Bonus
                </label>
                <input
                  type="number"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  placeholder="e.g., 15000"
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Signing Bonus
                </label>
                <input
                  type="number"
                  value={signingBonus}
                  onChange={(e) => setSigningBonus(e.target.value)}
                  placeholder="e.g., 20000"
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Offer Date
                </label>
                <input
                  type="date"
                  value={offerDate}
                  onChange={(e) => setOfferDate(e.target.value)}
                  className="input text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Equity/Stock
                </label>
                <input
                  type="text"
                  value={equity}
                  onChange={(e) => setEquity(e.target.value)}
                  placeholder="e.g., 10,000 RSUs over 4 years"
                  className="input text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Benefits
                </label>
                <input
                  type="text"
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  placeholder="e.g., 401k match, health insurance, PTO"
                  className="input text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional details about this offer..."
                  className="input text-sm"
                  rows={2}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Status
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAccepted(null)}
                    className={`btn btn-sm text-xs flex-1 ${isAccepted === null ? "bg-zinc-200 dark:bg-zinc-600" : ""}`}
                  >
                    Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAccepted(true)}
                    className={`btn btn-sm text-xs flex-1 ${isAccepted === true ? "bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300" : ""}`}
                  >
                    Accepted
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAccepted(false)}
                    className={`btn btn-sm text-xs flex-1 ${isAccepted === false ? "bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300" : ""}`}
                  >
                    Declined
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="btn btn-primary btn-sm text-xs" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update" : "Save Offer"}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-sm text-xs">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-6">
          <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}

      {/* Error */}
      {err && (
        <div className="text-sm text-red-600 dark:text-red-400 mb-4">{err}</div>
      )}

      {/* Empty State */}
      {!loading && !err && offers.length === 0 && (
        <div className="text-center py-6 text-zinc-500 dark:text-zinc-400">
          <span className="text-3xl">💸</span>
          <p className="mt-2 text-sm">No offers recorded yet</p>
          <p className="text-xs">Track offers and negotiations here</p>
        </div>
      )}

      {/* Offers List */}
      {!loading && !err && offers.length > 0 && (
        <div className="space-y-3">
          {offers.map((offer) => {
            const typeInfo = OFFER_TYPE_LABELS[offer.type];
            return (
              <div
                key={offer.id}
                className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                      {typeInfo.icon} {typeInfo.label}
                    </span>
                    {offer.isAccepted === true && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        ✓ Accepted
                      </span>
                    )}
                    {offer.isAccepted === false && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        ✗ Declined
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(offer)}
                      className="btn btn-sm text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(offer.id)}
                      className="btn btn-sm text-xs text-red-600 dark:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Base:</span>{" "}
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(offer.baseSalary, offer.currency)}
                    </span>
                  </div>
                  {offer.bonus && (
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Bonus:</span>{" "}
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {formatCurrency(offer.bonus, offer.currency)}
                      </span>
                    </div>
                  )}
                  {offer.signingBonus && (
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Signing:</span>{" "}
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {formatCurrency(offer.signingBonus, offer.currency)}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Total Comp:</span>{" "}
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(getTotalComp(offer), offer.currency)}
                    </span>
                  </div>
                </div>

                {offer.equity && (
                  <div className="mt-2 text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Equity:</span>{" "}
                    <span className="text-zinc-700 dark:text-zinc-300">{offer.equity}</span>
                  </div>
                )}

                {offer.benefits && (
                  <div className="mt-1 text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Benefits:</span>{" "}
                    <span className="text-zinc-700 dark:text-zinc-300">{offer.benefits}</span>
                  </div>
                )}

                {offer.notes && (
                  <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 italic">
                    {offer.notes}
                  </div>
                )}

                <div className="mt-2 text-xs text-zinc-400">
                  {new Date(offer.offerDate).toLocaleDateString()}
                </div>
              </div>
            );
          })}

          {/* Summary */}
          {offers.length > 1 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Negotiation Summary
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">Initial:</span>{" "}
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {formatCurrency(
                      offers.find((o) => o.type === "INITIAL_OFFER")?.baseSalary ?? offers[offers.length - 1].baseSalary,
                      offers[0].currency
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">Latest:</span>{" "}
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(offers[0].baseSalary, offers[0].currency)}
                  </span>
                </div>
                {offers.find((o) => o.type === "INITIAL_OFFER") && (
                  <div className="col-span-2">
                    <span className="text-zinc-500 dark:text-zinc-400">Change:</span>{" "}
                    <span className={`font-semibold ${
                      offers[0].baseSalary > (offers.find((o) => o.type === "INITIAL_OFFER")?.baseSalary ?? 0)
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}>
                      {offers[0].baseSalary > (offers.find((o) => o.type === "INITIAL_OFFER")?.baseSalary ?? 0) ? "+" : ""}
                      {formatCurrency(
                        offers[0].baseSalary - (offers.find((o) => o.type === "INITIAL_OFFER")?.baseSalary ?? 0),
                        offers[0].currency
                      )}
                      {" "}
                      ({(((offers[0].baseSalary / (offers.find((o) => o.type === "INITIAL_OFFER")?.baseSalary ?? 1)) - 1) * 100).toFixed(1)}%)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Offer"
        message="Are you sure you want to delete this offer record?"
        confirmText="Delete"
        loading={deleting}
        variant="danger"
      />
    </div>
  );
}
