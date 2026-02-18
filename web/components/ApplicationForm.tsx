"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ApplicationStage, Priority, RemoteType, JobType } from "@prisma/client";
import { useToast } from "@/components/ui/Toast";

type Mode = "create" | "edit";

type FormState = {
  company: string;
  title: string;
  location: string;
  url: string;
  salaryMin: string;
  salaryMax: string;
  stage: ApplicationStage;
  appliedDate: string;
  source: string;
  tags: string;
  // Extended fields
  priority: Priority | "";
  remoteType: RemoteType | "";
  jobType: JobType | "";
  description: string;
  nextFollowUp: string;
  rejectionReason: string;
};

type FieldErrors = Partial<Record<keyof FormState | "general", string>>;

type TouchedFields = Partial<Record<keyof FormState, boolean>>;

const empty: FormState = {
  company: "",
  title: "",
  location: "",
  url: "",
  salaryMin: "",
  salaryMax: "",
  stage: ApplicationStage.SAVED,
  appliedDate: "",
  source: "",
  tags: "",
  // Extended fields
  priority: "",
  remoteType: "",
  jobType: "",
  description: "",
  nextFollowUp: "",
  rejectionReason: ""
};

const SOURCE_OPTIONS = [
  "LinkedIn",
  "Indeed",
  "Company Website",
  "Referral",
  "Glassdoor",
  "AngelList",
  "Other"
];

const LOCATION_SUGGESTIONS = [
  "Remote",
  "Hybrid",
  "On-site",
  "New York, NY",
  "San Francisco, CA",
  "Los Angeles, CA",
  "Seattle, WA",
  "Austin, TX",
  "Boston, MA",
  "Chicago, IL",
  "Denver, CO"
];

export default function ApplicationForm({ mode, id }: { mode: Mode; id?: string }) {
  const { addToast } = useToast();
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  const buttonText = useMemo(() => (mode === "create" ? "Create Application" : "Save Changes"), [mode]);

  // Load existing data for edit mode
  useEffect(() => {
    if (mode !== "edit" || !id) return;

    (async () => {
      setLoading(true);
      setErrors({});
      const res = await fetch(`/api/applications/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ general: data?.error?.message ?? "Failed to load application" });
        setLoading(false);
        return;
      }

      const it = data.item;
      setForm({
        company: it.company ?? "",
        title: it.title ?? "",
        location: it.location ?? "",
        url: it.url ?? "",
        salaryMin: it.salaryMin != null ? String(it.salaryMin) : "",
        salaryMax: it.salaryMax != null ? String(it.salaryMax) : "",
        stage: it.stage ?? ApplicationStage.SAVED,
        appliedDate: it.appliedDate ? new Date(it.appliedDate).toISOString().slice(0, 10) : "",
        source: it.source ?? "",
        tags: Array.isArray(it.tags) ? it.tags.join(", ") : "",
        // Extended fields
        priority: it.priority ?? "",
        remoteType: it.remoteType ?? "",
        jobType: it.jobType ?? "",
        description: it.description ?? "",
        nextFollowUp: it.nextFollowUp ? new Date(it.nextFollowUp).toISOString().slice(0, 10) : "",
        rejectionReason: it.rejectionReason ?? ""
      });
      setLoading(false);
    })();
  }, [mode, id]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors((e) => ({ ...e, [key]: undefined }));
    }
  }

  function markTouched(key: keyof FormState) {
    setTouched((t) => ({ ...t, [key]: true }));
  }

  // Client-side validation
  function validateForm(): FieldErrors {
    const errs: FieldErrors = {};

    if (!form.company.trim()) {
      errs.company = "Company name is required";
    } else if (form.company.trim().length > 120) {
      errs.company = "Company name must be 120 characters or less";
    }

    if (!form.title.trim()) {
      errs.title = "Job title is required";
    } else if (form.title.trim().length > 120) {
      errs.title = "Job title must be 120 characters or less";
    }

    if (form.location.trim().length > 120) {
      errs.location = "Location must be 120 characters or less";
    }

    if (form.url.trim()) {
      try {
        new URL(form.url.trim());
      } catch {
        errs.url = "Please enter a valid URL (e.g., https://example.com)";
      }
    }

    const salaryMin = form.salaryMin.trim() ? Number(form.salaryMin) : null;
    const salaryMax = form.salaryMax.trim() ? Number(form.salaryMax) : null;

    if (form.salaryMin.trim() && (isNaN(salaryMin!) || salaryMin! < 0)) {
      errs.salaryMin = "Please enter a valid positive number";
    }

    if (form.salaryMax.trim() && (isNaN(salaryMax!) || salaryMax! < 0)) {
      errs.salaryMax = "Please enter a valid positive number";
    }

    if (salaryMin != null && salaryMax != null && salaryMin > salaryMax) {
      errs.salaryMin = "Minimum salary cannot exceed maximum";
    }

    if (form.source.trim().length > 120) {
      errs.source = "Source must be 120 characters or less";
    }

    return errs;
  }

  function isFieldValid(key: keyof FormState): boolean {
    if (!touched[key]) return false;

    const value = form[key];
    if (typeof value !== "string") return true;

    switch (key) {
      case "company":
        return value.trim().length > 0 && value.trim().length <= 120;
      case "title":
        return value.trim().length > 0 && value.trim().length <= 120;
      case "url":
        if (!value.trim()) return true;
        try {
          new URL(value.trim());
          return true;
        } catch {
          return false;
        }
      case "salaryMin":
      case "salaryMax":
        if (!value.trim()) return true;
        const num = Number(value);
        return !isNaN(num) && num >= 0;
      default:
        return value.trim().length <= 120;
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched: TouchedFields = {};
    (Object.keys(form) as (keyof FormState)[]).forEach((k) => {
      allTouched[k] = true;
    });
    setTouched(allTouched);

    // Validate
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    const payload = {
      company: form.company.trim(),
      title: form.title.trim(),
      location: form.location.trim() || null,
      url: form.url.trim() || null,
      salaryMin: form.salaryMin.trim() ? Number(form.salaryMin) : null,
      salaryMax: form.salaryMax.trim() ? Number(form.salaryMax) : null,
      stage: form.stage,
      appliedDate: form.appliedDate ? new Date(form.appliedDate).toISOString() : null,
      source: form.source.trim() || null,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      // Extended fields
      priority: form.priority || null,
      remoteType: form.remoteType || null,
      jobType: form.jobType || null,
      description: form.description.trim() || null,
      nextFollowUp: form.nextFollowUp ? new Date(form.nextFollowUp).toISOString() : null,
      rejectionReason: form.rejectionReason.trim() || null
    };

    try {
      const res = await fetch(
        mode === "create" ? "/api/applications" : `/api/applications/${id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      const data = await res.json();

      if (!res.ok) {
        // Parse server-side validation errors
        if (data?.error?.details?.fieldErrors) {
          const fieldErrs: FieldErrors = {};
          const serverErrors = data.error.details.fieldErrors;
          Object.entries(serverErrors).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              fieldErrs[field as keyof FormState] = messages[0] as string;
            }
          });
          if (Object.keys(fieldErrs).length > 0) {
            setErrors(fieldErrs);
            return;
          }
        }
        setErrors({ general: data?.error?.message ?? "Failed to save application" });
        return;
      }

      // Show success toast before redirect
      addToast({
        type: "success",
        title: mode === "create" 
          ? "Application created successfully!" 
          : "Application updated successfully!"
      });

      // Small delay to allow toast to display before redirect
      setTimeout(() => {
        window.location.href = "/applications";
      }, 300);
    } catch {
      setErrors({ general: "Network error. Please check your connection and try again." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-zinc-500">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading application...</span>
        </div>
      </div>
    );
  }

  return (
    <form className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm p-6 space-y-6" onSubmit={onSubmit}>
      {errors.general && (
        <div role="alert" aria-live="assertive" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errors.general}</span>
        </div>
      )}

      {/* Required Fields */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs">1</span>
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Company"
            required
            value={form.company}
            onChange={(v) => set("company", v)}
            onBlur={() => markTouched("company")}
            error={touched.company ? errors.company : undefined}
            isValid={isFieldValid("company")}
            placeholder="e.g., Google, Microsoft, Startup Inc."
          />
          <InputField
            label="Job Title"
            required
            value={form.title}
            onChange={(v) => set("title", v)}
            onBlur={() => markTouched("title")}
            error={touched.title ? errors.title : undefined}
            isValid={isFieldValid("title")}
            placeholder="e.g., Senior Software Engineer"
          />
        </div>
      </div>

      {/* Location & Source */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs">2</span>
          Location & Source
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <InputField
              label="Location"
              value={form.location}
              onChange={(v) => set("location", v)}
              onBlur={() => {
                markTouched("location");
                setTimeout(() => setShowLocationSuggestions(false), 150);
              }}
              onFocus={() => setShowLocationSuggestions(true)}
              error={touched.location ? errors.location : undefined}
              isValid={isFieldValid("location")}
              placeholder="e.g., Remote, New York, NY"
            />
            {showLocationSuggestions && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 shadow-lg max-h-48 overflow-y-auto">
                {LOCATION_SUGGESTIONS.filter(
                  (loc) => !form.location || loc.toLowerCase().includes(form.location.toLowerCase())
                ).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:bg-zinc-100 dark:focus:bg-zinc-700 focus:outline-none"
                    onMouseDown={() => {
                      set("location", loc);
                      setShowLocationSuggestions(false);
                    }}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            )}
          </div>
          <SelectField
            label="Source"
            value={form.source}
            onChange={(v) => set("source", v)}
            onBlur={() => markTouched("source")}
            options={[{ value: "", label: "Select where you found this job..." }, ...SOURCE_OPTIONS.map((s) => ({ value: s, label: s }))]}
            isValid={touched.source && !!form.source}
          />
        </div>
      </div>

      {/* Job Details */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs">3</span>
          Job Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Job Posting URL"
            type="url"
            value={form.url}
            onChange={(v) => set("url", v)}
            onBlur={() => markTouched("url")}
            error={touched.url ? errors.url : undefined}
            isValid={isFieldValid("url")}
            placeholder="https://..."
          />
          <SelectField
            label="Stage"
            value={form.stage}
            onChange={(v) => set("stage", v as ApplicationStage)}
            options={Object.values(ApplicationStage).map((s) => ({ value: s, label: formatStage(s) }))}
            isValid={true}
          />
          <InputField
            label="Applied Date"
            type="date"
            value={form.appliedDate}
            onChange={(v) => set("appliedDate", v)}
            onBlur={() => markTouched("appliedDate")}
            isValid={touched.appliedDate && !!form.appliedDate}
          />
          <InputField
            label="Tags"
            value={form.tags}
            onChange={(v) => set("tags", v)}
            onBlur={() => markTouched("tags")}
            placeholder="react, typescript, remote (comma separated)"
            isValid={touched.tags && !!form.tags.trim()}
          />
        </div>
      </div>

      {/* Salary */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs">4</span>
          Salary Range
          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">(Optional)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Minimum Salary"
            type="number"
            value={form.salaryMin}
            onChange={(v) => set("salaryMin", v)}
            onBlur={() => markTouched("salaryMin")}
            error={touched.salaryMin ? errors.salaryMin : undefined}
            isValid={isFieldValid("salaryMin")}
            placeholder="e.g., 80000"
            prefix="$"
          />
          <InputField
            label="Maximum Salary"
            type="number"
            value={form.salaryMax}
            onChange={(v) => set("salaryMax", v)}
            onBlur={() => markTouched("salaryMax")}
            error={touched.salaryMax ? errors.salaryMax : undefined}
            isValid={isFieldValid("salaryMax")}
            placeholder="e.g., 120000"
            prefix="$"
          />
        </div>
      </div>

      {/* Extended Details */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs">5</span>
          Additional Details
          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">(Optional)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectField
            label="Priority"
            value={form.priority}
            onChange={(v) => set("priority", v as Priority | "")}
            options={[
              { value: "", label: "Select priority..." },
              { value: Priority.LOW, label: "Low" },
              { value: Priority.MEDIUM, label: "Medium" },
              { value: Priority.HIGH, label: "High" }
            ]}
            isValid={!!form.priority}
          />
          <SelectField
            label="Work Type"
            value={form.remoteType}
            onChange={(v) => set("remoteType", v as RemoteType | "")}
            options={[
              { value: "", label: "Select work type..." },
              { value: RemoteType.REMOTE, label: "Remote" },
              { value: RemoteType.HYBRID, label: "Hybrid" },
              { value: RemoteType.ONSITE, label: "On-site" }
            ]}
            isValid={!!form.remoteType}
          />
          <SelectField
            label="Job Type"
            value={form.jobType}
            onChange={(v) => set("jobType", v as JobType | "")}
            options={[
              { value: "", label: "Select job type..." },
              { value: JobType.FULL_TIME, label: "Full-time" },
              { value: JobType.PART_TIME, label: "Part-time" },
              { value: JobType.CONTRACT, label: "Contract" },
              { value: JobType.FREELANCE, label: "Freelance" },
              { value: JobType.INTERNSHIP, label: "Internship" }
            ]}
            isValid={!!form.jobType}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <InputField
            label="Follow-up Date"
            type="date"
            value={form.nextFollowUp}
            onChange={(v) => set("nextFollowUp", v)}
            onBlur={() => markTouched("nextFollowUp")}
            isValid={touched.nextFollowUp && !!form.nextFollowUp}
          />
          {form.stage === ApplicationStage.REJECTED && (
            <InputField
              label="Rejection Reason"
              value={form.rejectionReason}
              onChange={(v) => set("rejectionReason", v)}
              onBlur={() => markTouched("rejectionReason")}
              placeholder="e.g., Position filled, not enough experience"
              isValid={touched.rejectionReason && !!form.rejectionReason.trim()}
            />
          )}
        </div>
        <div className="mt-4">
          <TextareaField
            label="Job Description"
            value={form.description}
            onChange={(v) => set("description", v)}
            onBlur={() => markTouched("description")}
            placeholder="Paste the job description here for reference..."
            rows={4}
            isValid={touched.description && !!form.description.trim()}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-zinc-100">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {buttonText}
            </>
          )}
        </button>
        <Link
          href="/applications"
          className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium border border-zinc-300 bg-white hover:bg-zinc-50 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

// Helper Components
type InputFieldProps = {
  label: string;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  isValid?: boolean;
  placeholder?: string;
  type?: "text" | "url" | "date" | "number";
  required?: boolean;
  prefix?: string;
};

function InputField({
  label,
  id,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  isValid,
  placeholder,
  type = "text",
  required,
  prefix
}: InputFieldProps) {
  const hasError = !!error;
  const showValid = isValid && !hasError;
  const inputId = id ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const errorId = `${inputId}-error`;

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none" aria-hidden="true">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          required={required}
          aria-required={required}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          className={`
            w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all text-zinc-900 dark:text-zinc-100
            ${prefix ? "pl-7" : ""}
            ${hasError
              ? "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              : showValid
              ? "border-green-300 bg-green-50/50 dark:bg-green-900/20 dark:border-green-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              : "border-zinc-300 bg-white dark:bg-zinc-800 dark:border-zinc-600 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20"
            }
          `}
        />
        {/* Status icon */}
        {(hasError || showValid) && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
            {hasError ? (
              <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
        )}
      </div>
      {hasError && (
        <p id={errorId} className="mt-1 text-xs text-red-600 flex items-center gap-1" role="alert">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: { value: string; label: string }[];
  isValid?: boolean;
};

function SelectField({ label, id, value, onChange, onBlur, options, isValid }: SelectFieldProps) {
  const selectId = id ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div>
      <label htmlFor={selectId} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{label}</label>
      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={`
            w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all appearance-none pr-10 text-zinc-900 dark:text-zinc-100
            ${isValid
              ? "border-green-300 bg-green-50/50 dark:bg-green-900/20 dark:border-green-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              : "border-zinc-300 bg-white dark:bg-zinc-800 dark:border-zinc-600 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20"
            }
          `}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
        {isValid && value && (
          <span className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </span>
        )}
      </div>
    </div>
  );
}

type TextareaFieldProps = {
  label: string;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  rows?: number;
  isValid?: boolean;
};

function TextareaField({ label, id, value, onChange, onBlur, placeholder, rows = 3, isValid }: TextareaFieldProps) {
  const textareaId = id ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div>
      <label htmlFor={textareaId} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{label}</label>
      <textarea
        id={textareaId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        className={`
          w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all resize-y text-zinc-900 dark:text-zinc-100
          ${isValid
            ? "border-green-300 bg-green-50/50 dark:bg-green-900/20 dark:border-green-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            : "border-zinc-300 bg-white dark:bg-zinc-800 dark:border-zinc-600 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20"
          }
        `}
      />
    </div>
  );
}

function formatStage(stage: ApplicationStage): string {
  const labels: Record<ApplicationStage, string> = {
    SAVED: "Saved",
    APPLIED: "Applied",
    INTERVIEW: "Interview",
    OFFER: "Offer",
    REJECTED: "Rejected"
  };
  return labels[stage];
}
