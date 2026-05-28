import { Comment } from "@prisma/client"
import { CommentEntity } from "@/posts/entities/comment.entity"

export class CommentEntityFactory {
    static createFromPrisma(
        comment: Comment,
        overrides?: {
            moderationState?: string
            sentimentScore?: number
            isPinned?: boolean
            language?: string
            metadata?: Record<string, unknown>
        },
    ): CommentEntity {
        const defaultSentimentScore = comment.content.length > 80 ? 70 : 45
        const defaultIsPinned = comment.content.length % 2 === 0
        const defaultMetadata = {
            chars: comment.content.length,
            source: comment.source,
        }

        return new CommentEntity(
            comment.id,
            comment.postId,
            comment.content,
            comment.createdAt,
            comment.updatedAt,
            comment.source,
            overrides?.moderationState ?? "approved",
            overrides?.sentimentScore ?? defaultSentimentScore,
            overrides?.isPinned ?? defaultIsPinned,
            overrides?.language ?? "es",
            overrides?.metadata ?? defaultMetadata,
        )
    }
}
