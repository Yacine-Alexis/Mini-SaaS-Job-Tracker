"use client";

import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/components/ui/Toast";

interface TagCloudProps {
  /** Pre-fetched tags with counts */
  tags?: { tag: string; count: number }[];
  /** Whether to fetch tags from API (if tags prop not provided) */
  fetchTags?: boolean;
  /** Callback when a tag is clicked */
  onTagClick?: (tag: string) => void;
  /** Currently selected tags */
  selectedTags?: string[];
  /** Max tags to show initially */
  maxTags?: number;
  /** Show counts next to tags */
  showCounts?: boolean;
  /** Allow adding new tags */
  allowAdd?: boolean;
  /** Callback when new tag is added */
  onTagAdd?: (tag: string) => void;
}

export function TagCloud({
  tags: propTags,
  fetchTags = false,
  onTagClick,
  selectedTags = [],
  maxTags = 20,
  showCounts = true,
  allowAdd = false,
  onTagAdd,
}: TagCloudProps) {
  const [tags, setTags] = useState<{ tag: string; count: number }[]>(propTags || []);
  const [loading, setLoading] = useState(fetchTags && !propTags);
  const [showAll, setShowAll] = useState(false);
  const [newTag, setNewTag] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    if (fetchTags && !propTags) {
      fetch("/api/applications/tags")
        .then((r) => r.json())
        .then((data) => {
          setTags(data.tags || []);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
          addToast({ type: "error", title: "Failed to load tags" });
        });
    }
  }, [fetchTags, propTags, addToast]);

  useEffect(() => {
    if (propTags) setTags(propTags);
  }, [propTags]);

  const displayTags = showAll ? tags : tags.slice(0, maxTags);
  const hasMore = tags.length > maxTags;

  // Calculate tag sizes based on count
  const maxCount = Math.max(...tags.map((t) => t.count), 1);
  const getTagSize = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return "text-base font-semibold";
    if (ratio > 0.4) return "text-sm font-medium";
    return "text-xs";
  };

  const handleAddTag = () => {
    const trimmed = newTag.trim().toLowerCase();
    if (!trimmed) return;
    if (tags.some((t) => t.tag.toLowerCase() === trimmed)) {
      addToast({ type: "warning", title: "Tag already exists" });
      return;
    }
    onTagAdd?.(trimmed);
    setNewTag("");
  };

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse"
            style={{ width: `${60 + Math.random() * 40}px` }}
          />
        ))}
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className="text-center py-4 text-zinc-500 dark:text-zinc-400">
        <svg className="mx-auto h-8 w-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <p className="text-sm">No tags yet</p>
        <p className="text-xs mt-1">Add tags to your applications to organize them</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {displayTags.map(({ tag, count }) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => onTagClick?.(tag)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                transition-all duration-200
                ${getTagSize(count)}
                ${isSelected
                  ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }
              `}
            >
              <span>{tag}</span>
              {showCounts && (
                <span className={`
                  text-[10px] px-1.5 py-0.5 rounded-full
                  ${isSelected
                    ? "bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                  }
                `}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Show {tags.length - maxTags} more tags
        </button>
      )}

      {showAll && hasMore && (
        <button
          onClick={() => setShowAll(false)}
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline"
        >
          Show less
        </button>
      )}

      {allowAdd && (
        <div className="flex gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
            placeholder="Add new tag..."
            className="input flex-1 text-sm"
          />
          <button onClick={handleAddTag} className="btn text-sm">
            Add
          </button>
        </div>
      )}
    </div>
  );
}

// Inline tag input for forms
interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "Add tags...",
  maxTags = 10,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = useMemo(() => {
    if (!input) return [];
    const lower = input.toLowerCase();
    return suggestions
      .filter((s) => s.toLowerCase().includes(lower) && !value.includes(s))
      .slice(0, 5);
  }, [input, suggestions, value]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || value.includes(trimmed) || value.length >= maxTags) return;
    onChange([...value, trimmed]);
    setInput("");
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="relative">
      <div className="input min-h-[42px] flex flex-wrap gap-1.5 p-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-blue-900 dark:hover:text-blue-100"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[100px] bg-transparent outline-none text-sm"
          disabled={value.length >= maxTags}
        />
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-lg py-1">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {value.length >= maxTags && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
          Maximum {maxTags} tags allowed
        </p>
      )}
    </div>
  );
}
