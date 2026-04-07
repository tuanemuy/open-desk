import type { PasswordHasher } from "@/core/domain/identity/ports/passwordHasher";
import type { UnitOfWorkProvider } from "../unitOfWork";

/**
 * Application Configuration
 */
export type AppConfig = {
  appUrl: string;
  sessionTimeoutHours: number;
  maxSessionsPerUser: number;
};

/**
 * Dependency Injection Container
 */
export type Container = {
  config: AppConfig;
  unitOfWorkProvider: UnitOfWorkProvider;
  passwordHasher: PasswordHasher;
};
