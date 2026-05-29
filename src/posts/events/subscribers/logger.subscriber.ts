import { Injectable, Logger, OnModuleInit } from "@nestjs/common"
import { EventBus } from "../event-bus"
import {
    CommentCreatedEvent,
    LikeCreatedEvent,
    PostCreatedEvent,
} from "../post.events"

/**
 * Reemplaza la función inline `logDomainEvent` del controlador.
 * Se registra automáticamente al inicializar el módulo.
 */
@Injectable()
export class LoggerSubscriber implements OnModuleInit {
    private readonly logger = new Logger(LoggerSubscriber.name)

    constructor(private readonly eventBus: EventBus) {}

    onModuleInit(): void {
        this.eventBus.subscribe<PostCreatedEvent>("PostCreated", (event) => {
            this.logger.log(`[event:post.created]`, {
                postId: event.postId,
                title: event.title,
            })
        })

        this.eventBus.subscribe<CommentCreatedEvent>(
            "CommentCreated",
            (event) => {
                this.logger.log(`[event:comment.created]`, {
                    postId: event.postId,
                    commentId: event.commentId,
                })
            },
        )

        this.eventBus.subscribe<LikeCreatedEvent>("LikeCreated", (event) => {
            this.logger.log(`[event:like.created]`, {
                postId: event.postId,
                likeId: event.likeId,
            })
        })
    }
}
