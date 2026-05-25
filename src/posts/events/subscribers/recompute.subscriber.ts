import { Injectable, Logger, OnModuleInit } from "@nestjs/common"
import { EventBus } from "../event-bus"
import {
    CommentCreatedEvent,
    LikeCreatedEvent,
    PostCreatedEvent,
} from "../post.events"

/**
 * Reemplaza la función inline `fakeRecomputeSomething` del controlador.
 * Cualquier nuevo cálculo derivado de un evento se agrega aquí sin tocar el controlador.
 */
@Injectable()
export class RecomputeSubscriber implements OnModuleInit {
    private readonly logger = new Logger(RecomputeSubscriber.name)

    constructor(private readonly eventBus: EventBus) {}

    onModuleInit(): void {
        this.eventBus.subscribe<PostCreatedEvent>("PostCreated", (event) => {
            this.logger.log(`[recompute] postId=${event.postId}`)
        })

        this.eventBus.subscribe<CommentCreatedEvent>(
            "CommentCreated",
            (event) => {
                this.logger.log(`[recompute] postId=${event.postId}`)
            },
        )

        this.eventBus.subscribe<LikeCreatedEvent>("LikeCreated", (event) => {
            this.logger.log(`[recompute] postId=${event.postId}`)
        })
    }
}
