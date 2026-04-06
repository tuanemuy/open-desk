/**
 * Base type for all domain events.
 *
 * @template TType - The event type string literal
 * @template TPayload - The event payload type
 */
export type DomainEventBase<
  TType extends string = string,
  TPayload = unknown,
> = {
  readonly type: TType;
  readonly payload: TPayload;
  readonly occurredAt: Date;
};

/**
 * Union of all domain events in the system.
 * Extend this type as new domains are added.
 */
export type DomainEvent = DomainEventBase;

/**
 * Represents an entity along with the domain events it produced.
 *
 * @template TEntity - The entity type
 * @template TEvent - The domain event union type for the entity
 */
export type WithEvents<TEntity, TEvent extends DomainEventBase> = {
  readonly entity: TEntity;
  readonly events: readonly TEvent[];
};
