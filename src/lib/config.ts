/**
 * Legacy store config. DEPRECATED — use getStoreConfig() from data.ts
 * for server components, or useStoreConfig() from the provider for
 * client components.
 *
 * This file re-exports STORE_CONFIG_DEFAULTS under the legacy name
 * STORE so callers that haven't been migrated yet keep working. New
 * code should NOT import from this file.
 *
 * The STORE object here is FROZEN DEFAULTS — it does not reflect
 * runtime config changes made via the admin UI. If you see stale
 * values in the UI, it's because a caller is reading STORE.xxx
 * instead of getStoreConfig().
 *
 * TODO: remove this file once every caller has been migrated.
 */
import { STORE_CONFIG_DEFAULTS } from "./default-store-config";

export const STORE = STORE_CONFIG_DEFAULTS;
