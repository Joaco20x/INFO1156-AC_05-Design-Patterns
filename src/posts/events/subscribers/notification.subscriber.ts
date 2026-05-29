import { Injectable, Logger, OnModuleInit } from "@nestjs/common"
import { EventBus } from "../event-bus"
import {
    CommentCreatedEvent,
    LikeCreatedEvent,
    PostCreatedEvent,
} from "../post.events"

/**
 * Reemplaza la función inline `fakeSendNotification` del controlador.
 * Encapsula toda la lógica de notificaciones como suscriptor independiente.
 */
@Injectable()
export class NotificationSubscriber implements OnModuleInit {
    private readonly logger = new Logger(NotificationSubscriber.name)

    constructor(private readonly eventBus: EventBus) {}

    onModuleInit(): void {
        this.eventBus.subscribe<PostCreatedEvent>("PostCreated", (event) => {
            this.logger.log(`[notify:post]`, { postId: event.postId })
        })

        this.eventBus.subscribe<CommentCreatedEvent>(
            "CommentCreated",
            (event) => {
                this.logger.log(`[notify:comment]`, { postId: event.postId })
            },
        )

        this.eventBus.subscribe<LikeCreatedEvent>("LikeCreated", (event) => {
            this.logger.log(`[notify:like]`, {
                postId: event.postId,
                reactionType: event.reactionType,
            })
        })
    }
}
