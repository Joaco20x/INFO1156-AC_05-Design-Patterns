import { PostEntity } from "@/posts/entities/post.entity"

export interface FeedSortingStrategy {
    sort(posts: PostEntity[]): PostEntity[]
}
