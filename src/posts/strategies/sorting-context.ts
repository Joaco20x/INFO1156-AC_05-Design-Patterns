import { Injectable } from "@nestjs/common"
import { PostEntity } from "@/posts/entities/post.entity"
import { FeedSortingStrategy } from "@/posts/strategies/feed-sorting.strategy"
import { LatestStrategy } from "@/posts/strategies/latest.strategy"
import { MostLikedStrategy } from "@/posts/strategies/most-liked.strategy"
import { MostCommentedStrategy } from "@/posts/strategies/most-commented.strategy"
import { RelevanceStrategy } from "@/posts/strategies/relevance.strategy"

@Injectable()
export class SortingContext {
    private strategies: Record<string, FeedSortingStrategy>

    constructor(
        latest: LatestStrategy,
        mostLiked: MostLikedStrategy,
        mostCommented: MostCommentedStrategy,
        relevance: RelevanceStrategy,
    ) {
        this.strategies = {
            latest,
            mostLiked,
            mostCommented,
            relevance,
        }
    }

    sort(mode: string, posts: PostEntity[]): PostEntity[] {
        const strategy = this.strategies[mode] || this.strategies["latest"]
        return strategy.sort(posts)
    }
}
