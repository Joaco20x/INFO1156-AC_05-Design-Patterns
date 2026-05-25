import { Module } from "@nestjs/common"
import { PostsController } from "@/posts/posts.controller"
import { PostsService } from "@/posts/posts.service"
import { LatestStrategy } from "@/posts/strategies/latest.strategy"
import { MostLikedStrategy } from "@/posts/strategies/most-liked.strategy"
import { MostCommentedStrategy } from "@/posts/strategies/most-commented.strategy"
import { RelevanceStrategy } from "@/posts/strategies/relevance.strategy"
import { SortingContext } from "@/posts/strategies/sorting-context"
import { EventBus } from "@/posts/events/event-bus"
import { LoggerSubscriber } from "@/posts/events/subscribers/logger.subscriber"
import { NotificationSubscriber } from "@/posts/events/subscribers/notification.subscriber"
import { RecomputeSubscriber } from "@/posts/events/subscribers/recompute.subscriber"

@Module({
    controllers: [PostsController],
    providers: [
        PostsService,
        LatestStrategy,
        MostLikedStrategy,
        MostCommentedStrategy,
        RelevanceStrategy,
        SortingContext,
        // Observer Pattern — EventBus + suscriptores
        EventBus,
        LoggerSubscriber,
        NotificationSubscriber,
        RecomputeSubscriber,
    ],
})
export class PostsModule {}
