"use client";

import { useState, useRef, useCallback } from "react";
import DOMPurify from "dompurify";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  disabled?: boolean;
  className?: string;
}

type FormatType = "bold" | "italic" | "underline" | "strikethrough" | "code" | "link" | "list" | "orderedList" | "heading";

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something...",
  minHeight = "120px",
  maxHeight = "400px",
  disabled = false,
  className = "",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    
    // Update value
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleFormat = useCallback((format: FormatType) => {
    switch (format) {
      case "bold":
        execCommand("bold");
        break;
      case "italic":
        execCommand("italic");
        break;
      case "underline":
        execCommand("underline");
        break;
      case "strikethrough":
        execCommand("strikethrough");
        break;
      case "code":
        // Wrap selection in code tag
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const code = document.createElement("code");
          code.className = "px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-sm font-mono";
          range.surroundContents(code);
          onChange(editorRef.current?.innerHTML || "");
        }
        break;
      case "link":
        const url = prompt("Enter URL:");
        if (url) {
          execCommand("createLink", url);
        }
        break;
      case "list":
        execCommand("insertUnorderedList");
        break;
      case "orderedList":
        execCommand("insertOrderedList");
        break;
      case "heading":
        execCommand("formatBlock", "h3");
        break;
    }
  }, [execCommand, onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }, []);

  const ToolbarButton = ({ 
    format, 
    icon, 
    label 
  }: { 
    format: FormatType; 
    icon: React.ReactNode; 
    label: string 
  }) => (
    <button
      type="button"
      onClick={() => handleFormat(format)}
      disabled={disabled}
      className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title={label}
    >
      {icon}
    </button>
  );

  return (
    <div className={`rounded-xl border transition-colors ${
      isFocused 
        ? "border-blue-500 ring-2 ring-blue-500/20" 
        : "border-zinc-200 dark:border-zinc-700"
    } ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-1.5 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-t-xl">
        <ToolbarButton
          format="bold"
          label="Bold (Ctrl+B)"
          icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" /></svg>}
        />
        <ToolbarButton
          format="italic"
          label="Italic (Ctrl+I)"
          icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 4h4m-2 0v16m-4 0h8" transform="skewX(-10)" /></svg>}
        />
        <ToolbarButton
          format="underline"
          label="Underline (Ctrl+U)"
          icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 4v7a5 5 0 0010 0V4M5 20h14" /></svg>}
        />
        <ToolbarButton
          format="strikethrough"
          label="Strikethrough"
          icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5v14" transform="rotate(0 12 12)" /><line x1="4" y1="12" x2="20" y2="12" strokeWidth={2} /></svg>}
        />
        
        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
        
        <ToolbarButton
          format="code"
          label="Code"
          icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
        />
        <ToolbarButton
          format="link"
          label="Link"
          icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
        />
        
        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
        
        <ToolbarButton
          format="list"
          label="Bullet List"
          icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /><circle cx="2" cy="6" r="1" fill="currentColor" /><circle cx="2" cy="12" r="1" fill="currentColor" /><circle cx="2" cy="18" r="1" fill="currentColor" /></svg>}
        />
        <ToolbarButton
          format="orderedList"
          label="Numbered List"
          icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 6h13M7 12h13M7 18h13" /><text x="2" y="7" fontSize="6" fill="currentColor">1</text><text x="2" y="13" fontSize="6" fill="currentColor">2</text><text x="2" y="19" fontSize="6" fill="currentColor">3</text></svg>}
        />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPaste={handlePaste}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value) }}
        className="p-3 outline-none overflow-y-auto prose prose-sm dark:prose-invert max-w-none"
        style={{ minHeight, maxHeight }}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 1.5rem;
        }
        [contenteditable] li {
          margin: 0.25rem 0;
        }
      `}</style>
    </div>
  );
}

// Simple markdown-ish text area for basic formatting
interface SimpleRichTextProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
}

export function SimpleRichText({
  value,
  onChange,
  placeholder = "Write something... (supports **bold**, *italic*, `code`)",
  rows = 4,
  disabled = false,
  className = "",
}: SimpleRichTextProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className={`input resize-none ${className}`}
    />
  );
}

// Render markdown-ish text to HTML
export function renderSimpleMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-sm font-mono">$1</code>')
    .replace(/\n/g, "<br />");
}
