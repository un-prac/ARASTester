import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { MetadataEntry } from '@/core/hooks/useMetadataQueries';

interface SuggestInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: MetadataEntry[];
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  type?: string;
}

/**
 * SuggestInput — a text input with a custom floating dropdown for ARAS metadata suggestions.
 *
 * Replaces the native <datalist> approach which does not work reliably in Electron.
 * Shows filtered suggestions on focus/typing, allows free-text input, and supports
 * keyboard navigation (↑/↓/Enter/Escape).
 */
const SuggestInput: React.FC<SuggestInputProps> = ({
  value,
  onChange,
  suggestions,
  isLoading = false,
  placeholder,
  className,
  type = 'text',
}) => {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filter suggestions based on current input value
  const filtered = suggestions.filter(s => {
    if (!value) return true; // show all when empty
    const lower = value.toLowerCase();
    return (
      s.name.toLowerCase().includes(lower) ||
      (s.label && s.label.toLowerCase().includes(lower))
    );
  });

  const showDropdown = open && (filtered.length > 0 || isLoading);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  const selectItem = useCallback(
    (entry: MetadataEntry) => {
      onChange(entry.name);
      setOpen(false);
      setHighlightIndex(-1);
      inputRef.current?.focus();
    },
    [onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) {
      // Open dropdown on ArrowDown even when closed
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setOpen(true);
        setHighlightIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex(prev => (prev < filtered.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(prev => (prev > 0 ? prev - 1 : filtered.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < filtered.length) {
          selectItem(filtered[highlightIndex]);
        }
        break;
      case 'Escape':
        setOpen(false);
        setHighlightIndex(-1);
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setOpen(true);
          setHighlightIndex(-1);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          'flex h-11 w-full rounded-xl border border-input/80 bg-panelMuted px-3 py-2 text-sm text-foreground shadow-inner shadow-black/10 ring-offset-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      />

      {showDropdown && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-border/60 bg-popover shadow-xl shadow-black/20 py-1"
          role="listbox"
        >
          {isLoading && filtered.length === 0 && (
            <li className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-primary/50 animate-pulse" />
              Loading suggestions…
            </li>
          )}
          {filtered.map((entry, i) => (
            <li
              key={entry.name}
              role="option"
              aria-selected={i === highlightIndex}
              className={cn(
                'px-3 py-2 text-sm cursor-pointer transition-colors',
                i === highlightIndex
                  ? 'bg-primary/20 text-primary-foreground'
                  : 'hover:bg-muted/50',
              )}
              onMouseDown={e => {
                e.preventDefault(); // Prevent blur before click registers
                selectItem(entry);
              }}
              onMouseEnter={() => setHighlightIndex(i)}
            >
              <span className="font-medium">{entry.name}</span>
              {entry.label && entry.label !== entry.name && (
                <span className="ml-2 text-xs text-muted-foreground">({entry.label})</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SuggestInput;
export { SuggestInput };
