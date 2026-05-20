import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/core/api/client';
import { useSessionStore } from '@/stores/useSessionStore';

// ── Shared types ─────────────────────────────────────────────────────────────

export interface MetadataEntry {
  name: string;
  label?: string;
}

interface MetadataResponse {
  success: boolean;
  items: MetadataEntry[];
}

// ── Connection helper ─────────────────────────────────────────────────────────

/**
 * Returns connection state derived from raw plain-value slices.
 * Does NOT use the isConnected getter — it is stripped by Zustand persist hydration.
 */
function useConnectionInfo() {
  const activeSessions = useSessionStore(s => s.activeSessions);
  const sessionName = useSessionStore(s => s.currentSessionName);
  const isConnected = Array.isArray(activeSessions) &&
    activeSessions.some(s => s.name === sessionName);
  return { isConnected, sessionName };
}

// ── Fetcher factory ───────────────────────────────────────────────────────────

function makeMetadataFetcher(endpoint: string, sessionName: string) {
  return async (): Promise<MetadataEntry[]> => {
    const result = await apiClient.get<MetadataResponse>(endpoint, { sessionName });
    return result?.items ?? [];
  };
}

// ── Public hooks ──────────────────────────────────────────────────────────────

/** All non-abstract ItemType names from ARAS. */
export function useItemTypesQuery() {
  const { isConnected, sessionName } = useConnectionInfo();
  return useQuery({
    queryKey: ['aras-metadata', 'itemtypes', sessionName],
    queryFn: makeMetadataFetcher('/api/aras/metadata/itemtypes', sessionName),
    enabled: isConnected,
  });
}

/** RelationshipTypes whose source matches parentItemType. */
export function useRelationshipTypesQuery(parentItemType: string) {
  const { isConnected, sessionName } = useConnectionInfo();
  const hasContext = Boolean(parentItemType?.trim());
  return useQuery({
    queryKey: ['aras-metadata', 'relationship-types', sessionName, parentItemType],
    queryFn: makeMetadataFetcher(
      `/api/aras/metadata/relationship-types?parentType=${encodeURIComponent(parentItemType)}`,
      sessionName,
    ),
    enabled: isConnected && hasContext,
  });
}

/** Lifecycle states linked to itemType. */
export function useLifecycleStatesQuery(itemType: string) {
  const { isConnected, sessionName } = useConnectionInfo();
  const hasContext = Boolean(itemType?.trim());
  return useQuery({
    queryKey: ['aras-metadata', 'states', sessionName, itemType],
    queryFn: makeMetadataFetcher(
      `/api/aras/metadata/states?itemType=${encodeURIComponent(itemType)}`,
      sessionName,
    ),
    enabled: isConnected && hasContext,
  });
}

/** All Method names in ARAS. */
export function useMethodsQuery() {
  const { isConnected, sessionName } = useConnectionInfo();
  return useQuery({
    queryKey: ['aras-metadata', 'methods', sessionName],
    queryFn: makeMetadataFetcher('/api/aras/metadata/methods', sessionName),
    enabled: isConnected,
  });
}

/** All Sequence names in ARAS. */
export function useSequencesQuery() {
  const { isConnected, sessionName } = useConnectionInfo();
  return useQuery({
    queryKey: ['aras-metadata', 'sequences', sessionName],
    queryFn: makeMetadataFetcher('/api/aras/metadata/sequences', sessionName),
    enabled: isConnected,
  });
}
