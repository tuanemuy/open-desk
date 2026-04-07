/**
 * Server-side dependency injection container singleton.
 *
 * Re-exports the container created by the DI module,
 * which initializes all adapters from environment configuration.
 */
export { container } from "@/core/di/server";
