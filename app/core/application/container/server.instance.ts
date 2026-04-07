import type { Container } from "./server";

/**
 * Server-side dependency injection container singleton.
 *
 * This instance is initialized at server startup and provides
 * all dependencies needed by application services.
 *
 * Each adapter implementation should be wired here once
 * the infrastructure layer is configured.
 */
export const container: Container = null as unknown as Container;
