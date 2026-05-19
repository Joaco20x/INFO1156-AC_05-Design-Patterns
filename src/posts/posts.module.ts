import { Module } from "@nestjs/common"
import { PostsController } from "@/posts/posts.controller"
import { PostsService } from "@/posts/posts.service"
import { LatestStrategy } from "@/posts/strategies/latest.strategy"
import { MostLikedStrategy } from "@/posts/strategies/most-liked.strategy"
import { MostCommentedStrategy } from "@/posts/strategies/most-commented.strategy"
import { RelevanceStrategy } from "@/posts/strategies/relevance.strategy"
import { SortingContext } from "@/posts/strategies/sorting-context"

@Module({
    controllers: [PostsController],
    providers: [
        PostsService,
        LatestStrategy,
        MostLikedStrategy,
        MostCommentedStrategy,
        RelevanceStrategy,
        SortingContext,
    ],
})
export class PostsModule {}
