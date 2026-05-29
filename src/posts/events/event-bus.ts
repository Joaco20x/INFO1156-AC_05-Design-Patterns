import { Injectable } from "@nestjs/common"
import { DomainEvent } from "./post.events"

export type EventHandler<T extends DomainEvent = DomainEvent> = (
    event: T,
) => void | Promise<void>

@Injectable()
export class EventBus {
    private readonly handlers = new Map<string, EventHandler[]>()

    subscribe<T extends DomainEvent>(
        eventType: T["type"],
        handler: EventHandler<T>,
    ): void {
        const existing = this.handlers.get(eventType) ?? []
        this.handlers.set(eventType, [...existing, handler as EventHandler])
    }

    async emit<T extends DomainEvent>(event: T): Promise<void> {
        const eventHandlers = this.handlers.get(event.type) ?? []
        await Promise.all(eventHandlers.map((h) => h(event)))
    }
}
