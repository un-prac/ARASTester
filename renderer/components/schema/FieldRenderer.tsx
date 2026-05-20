import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { SuggestInput } from '@/components/ui/SuggestInput';
import KeyValueEditor from './KeyValueEditor';
import type { ActionSchemaField } from '@/types/plan';
import {
  useItemTypesQuery,
  useRelationshipTypesQuery,
  useLifecycleStatesQuery,
  useMethodsQuery,
  useSequencesQuery,
  type MetadataEntry,
} from '@/core/hooks/useMetadataQueries';

interface FieldRendererProps {
  field: ActionSchemaField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  /** Full sibling params — used for context-aware suggestions (e.g. itemType → states). */
  allParams?: Record<string, unknown>;
}

// ── Debounced change hook ────────────────────────────────────────────────────

function useDebouncedChange<T>(value: T, onChange: (val: T) => void, delay = 300) {
  const [localValue, setLocalValue] = useState<T>(value);
  const skipUpdate = useRef(false);

  useEffect(() => {
    if (!skipUpdate.current) setLocalValue(value);
    skipUpdate.current = false;
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        skipUpdate.current = true;
        onChange(localValue);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [localValue, delay]); // eslint-disable-line react-hooks/exhaustive-deps

  return [localValue, setLocalValue] as const;
}

// ── Sibling value helper ─────────────────────────────────────────────────────

function getSiblingStr(allParams: Record<string, unknown>, key: string): string {
  const v = allParams[key];
  return typeof v === 'string' ? v.trim() : '';
}

// ── Per-field suggestion hook ────────────────────────────────────────────────

type SuggestionResult = { data: MetadataEntry[]; isLoading: boolean; hasCategory: boolean };

function useSuggestionsForField(
  fieldName: string,
  allParams: Record<string, unknown>,
): SuggestionResult {
  const itemType = getSiblingStr(allParams, 'itemType') || getSiblingStr(allParams, 'parentType');
  const parentType = getSiblingStr(allParams, 'parentType') || getSiblingStr(allParams, 'itemType');
  const propName = getSiblingStr(allParams, 'property');

  // All hooks called unconditionally (Rules of Hooks).
  // TanStack Query's `enabled` flag prevents actual network calls when not needed.
  const itemTypesQ = useItemTypesQuery();
  const relTypesQ = useRelationshipTypesQuery(parentType);
  const statesQ = useLifecycleStatesQuery(itemType);
  const methodsQ = useMethodsQuery();
  const seqQ = useSequencesQuery();

  switch (fieldName) {
    case 'itemType':
    case 'parentType':
      return { data: itemTypesQ.data ?? [], isLoading: itemTypesQ.isFetching, hasCategory: true };

    case 'relationshipType':
      return { data: relTypesQ.data ?? [], isLoading: relTypesQ.isFetching, hasCategory: true };

    case 'targetState':
    case 'expectedState':
    case 'state':
      return { data: statesQ.data ?? [], isLoading: statesQ.isFetching, hasCategory: true };

    case 'expected':
      if (propName === 'state') {
        return { data: statesQ.data ?? [], isLoading: statesQ.isFetching, hasCategory: true };
      }
      return { data: [], isLoading: false, hasCategory: false };

    case 'methodName':
      return { data: methodsQ.data ?? [], isLoading: methodsQ.isFetching, hasCategory: true };

    case 'sequenceName':
      return { data: seqQ.data ?? [], isLoading: seqQ.isFetching, hasCategory: true };

    default:
      return { data: [], isLoading: false, hasCategory: false };
  }
}

// ── Component ────────────────────────────────────────────────────────────────

const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  onChange,
  error,
  allParams = {},
}) => {
  const [textValue, setTextValue] = useDebouncedChange<string>(
    (value as string) ?? (field.default as string) ?? '',
    onChange as (v: string) => void,
  );

  const [numberValue, setNumberValue] = useDebouncedChange<string>(
    (value as string) ?? (field.default as string) ?? '',
    onChange as (v: string) => void,
  );

  const [jsonValue, setJsonValue] = useDebouncedChange<string>(
    typeof value === 'object' ? JSON.stringify(value, null, 2) : ((value as string) ?? ''),
    (val: string) => {
      try { onChange(JSON.parse(val)); } catch { onChange(val); }
    },
  );

  const { data: suggestions, isLoading, hasCategory } = useSuggestionsForField(field.name, allParams);

  const baseInputClass = 'bg-muted/30';
  const errorInputClass = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';

  // ── Shared sub-renders ───────────────────────────────────────────────────

  const renderLabel = () => (
    <label className="text-sm font-medium leading-none block mb-1">
      {field.label}
      {field.required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );

  const renderHelpText = () => {
    if (error) return <p className="text-xs text-red-500 mt-1">{error}</p>;
    if (!field.helpText) return null;
    return <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>;
  };

  // ── Field type switch ────────────────────────────────────────────────────

  switch (field.type) {
    case 'text':
    case 'password':
      // Use SuggestInput for fields with metadata suggestions, plain Input otherwise
      if (hasCategory && field.type === 'text') {
        return (
          <div className="space-y-1">
            {renderLabel()}
            <SuggestInput
              value={textValue}
              onChange={setTextValue}
              suggestions={suggestions}
              isLoading={isLoading}
              placeholder={field.placeholder}
              className={`${baseInputClass} ${errorInputClass}`}
            />
            {renderHelpText()}
          </div>
        );
      }
      return (
        <div className="space-y-1">
          {renderLabel()}
          <Input
            type={field.type}
            value={textValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTextValue(e.target.value)}
            placeholder={field.placeholder || (field.type === 'password' ? '••••••••' : undefined)}
            className={`${baseInputClass} ${errorInputClass}`}
          />
          {renderHelpText()}
        </div>
      );

    case 'number':
      return (
        <div className="space-y-1">
          {renderLabel()}
          <Input
            type="number"
            value={numberValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumberValue(e.target.value)}
            placeholder={field.placeholder}
            className={`${baseInputClass} ${errorInputClass}`}
          />
          {renderHelpText()}
        </div>
      );

    case 'textarea':
      return (
        <div className="space-y-1">
          {renderLabel()}
          {field.prefix && (
            <div className="text-xs font-mono text-muted-foreground font-bold">{field.prefix}</div>
          )}
          <textarea
            value={textValue}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTextValue(e.target.value)}
            placeholder={field.placeholder}
            className={`w-full min-h-[120px] rounded-md border border-input px-3 py-2 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary ${baseInputClass}`}
          />
          {field.suffix && (
            <div className="text-xs font-mono text-muted-foreground font-bold">{field.suffix}</div>
          )}
          {renderHelpText()}
        </div>
      );

    case 'select':
      return (
        <div className="space-y-1">
          {renderLabel()}
          <select
            value={(value as string) ?? (field.default as string) ?? ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
            className={`w-full appearance-none rounded-md border border-input px-4 py-2.5 text-sm focus:border-primary focus:ring-primary ${baseInputClass}`}
          >
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {renderHelpText()}
        </div>
      );

    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={(value as boolean) ?? (field.default as boolean) ?? false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
          />
          <label className="text-sm font-medium">{field.label}</label>
          {field.helpText && (
            <span className="text-xs text-muted-foreground ml-2">({field.helpText})</span>
          )}
        </div>
      );

    case 'keyvalue':
      return (
        <KeyValueEditor
          field={field}
          value={value as Record<string, string> | undefined}
          onChange={onChange as (val: Record<string, string> | undefined) => void}
        />
      );

    case 'json':
      return (
        <div className="space-y-1">
          {renderLabel()}
          <textarea
            value={jsonValue}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJsonValue(e.target.value)}
            placeholder={field.placeholder || '{\n  "key": "value"\n}'}
            className={`w-full min-h-[120px] rounded-md border border-input px-3 py-2 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary ${baseInputClass}`}
          />
          {renderHelpText()}
        </div>
      );

    default:
      return (
        <div className="space-y-1">
          {renderLabel()}
          <Input
            value={textValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTextValue(e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
          />
          {renderHelpText()}
        </div>
      );
  }
};

export default FieldRenderer;
