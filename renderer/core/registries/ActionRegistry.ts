import React from "react";
import actionSchemas from "@/core/schemas/action-schemas.json";
import { SchemaFormRenderer } from "@/components/schema";
import type { ActionPlugin, ActionSchema, ActionSchemaField } from "@/types/plan";

/**
 * ActionRegistry - Schema-driven action plugin system
 *
 * Static imports stay at the top (required by Vite/ESM).
 * Actual processing (building the Maps, creating React elements for every action)
 * is deferred to the first call that needs it. This removes ~35 React.createElement
 * calls from the module-load critical path, eliminating the 180ms scheduler violation.
 */
class ActionRegistry {
  private plugins: Map<string, ActionPlugin> | null = null;
  private categories: Map<string, unknown> | null = null;

  // ── Lazy init ──────────────────────────────────────────────────────────────

  private ensureLoaded() {
    if (this.plugins !== null) return;

    this.plugins = new Map();
    this.categories = new Map();

    // Load categories
    if (actionSchemas.categories) {
      actionSchemas.categories.forEach((cat: unknown) => {
        const category = cat as { id: string; [key: string]: unknown };
        if (category?.id) this.categories!.set(category.id, category);
      });
    }

    // Load actions
    if (actionSchemas.actions) {
      actionSchemas.actions.forEach((schema: unknown) => {
        this.register(this.createPluginFromSchema(schema as ActionSchema));
      });
    }
  }

  // ── Plugin creation ────────────────────────────────────────────────────────

  createPluginFromSchema(schema: ActionSchema): ActionPlugin {
    return {
      type: schema.type,
      label: schema.label,
      category: schema.category,
      description: schema.description,
      apiEndpoint: schema.apiEndpoint,
      apiMethod: schema.apiMethod || "POST",
      isClientSide: schema.isClientSide || false,
      defaultParams: this.buildDefaultParams(schema.fields),
      Editor: (props: {
        params?: Record<string, unknown>;
        onChange?: (p: Record<string, unknown>) => void;
      }) =>
        React.createElement(SchemaFormRenderer, {
          schema,
          params: props.params ?? {},
          onChange: props.onChange ?? (() => undefined),
        }),
      schema,
    };
  }

  buildDefaultParams(fields: ActionSchemaField[]): Record<string, unknown> {
    if (!fields?.length) return {};
    return fields.reduce((acc: Record<string, unknown>, field) => {
      if (field.default !== undefined) acc[field.name] = field.default;
      return acc;
    }, {});
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  register(plugin: ActionPlugin) {
    if (!plugin.type) {
      console.error("Invalid plugin registration — missing type:", plugin);
      return;
    }
    // ensureLoaded is NOT called here — register() is only used internally
    // after ensureLoaded has already run, or for external manual registrations.
    if (this.plugins === null) this.plugins = new Map();
    this.plugins.set(plugin.type, plugin);
  }

  get(type: string): ActionPlugin | undefined {
    this.ensureLoaded();
    return this.plugins!.get(type);
  }

  getAll(): ActionPlugin[] {
    this.ensureLoaded();
    return Array.from(this.plugins!.values());
  }

  getByCategory() {
    this.ensureLoaded();
    const grouped = new Map<string, { id: string; label: string; icon: string; actions: ActionPlugin[] }>();

    this.plugins!.forEach(plugin => {
      const categoryId = plugin.category || "other";
      if (!grouped.has(categoryId)) {
        const info = (this.categories!.get(categoryId) as {
          id: string; label: string; icon: string;
        }) ?? {
          id: categoryId,
          label: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
          icon: "📋",
        };
        grouped.set(categoryId, { ...info, actions: [] });
      }
      grouped.get(categoryId)!.actions.push(plugin);
    });

    return grouped;
  }
}

export const actionRegistry = new ActionRegistry();
