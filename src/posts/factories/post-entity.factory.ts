import { Post, Comment, Like } from "@prisma/client"
import { PostEntity } from "@/posts/entities/post.entity"

export class PostEntityFactory {
    static createFromPrisma(
        post: Post & { comments?: Comment[]; likes?: Like[] },
        mode: string = "latest",
        overrides?: {
            source?: string
            isFeatured?: boolean
        },
    ): PostEntity {
        const likes = post.likes || []
        const comments = post.comments || []

        const likesCount = likes.reduce((sum, like) => sum + like.weight, 0)
        const commentsCount = comments.length

        // 36_000_00 = 1 hora en milisegundos.
        const hoursSinceCreated =
            (Date.now() - new Date(post.createdAt).getTime()) / 36_000_00
        const relevanceScore =
            likesCount * 2 + commentsCount * 3 - Math.floor(hoursSinceCreated)

        const tags = post.title.split(" ").filter((word) => word.length > 4)
        const metadata = {
            likesWeights: likes.map((like) => like.weight),
            commentLengths: comments.map((comment) => comment.content.length),
            hourOfCreate: new Date(post.createdAt).getHours(),
        }

        const isFeatured = overrides?.isFeatured ?? relevanceScore > 20
        const source = overrides?.source ?? "feed-controller"

        return new PostEntity(
            post.id,
            post.title,
            post.description,
            post.imageUrl,
            post.createdAt,
            post.updatedAt,
            likesCount,
            commentsCount,
            relevanceScore,
            isFeatured,
            source,
            tags,
            metadata,
            mode,
        )
    }
}
