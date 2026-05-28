import { Injectable } from "@nestjs/common"
import { PostEntity } from "@/posts/entities/post.entity"
import { FeedSortingStrategy } from "@/posts/strategies/feed-sorting.strategy"

@Injectable()
export class MostCommentedStrategy implements FeedSortingStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort((a, b) => b.commentsCount - a.commentsCount)
    }
}
