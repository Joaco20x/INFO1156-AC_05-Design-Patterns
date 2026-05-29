import { Like } from "@prisma/client"
import { LikeEntity } from "@/posts/entities/like.entity"

export class LikeEntityFactory {
    static createFromPrisma(
        like: Like,
        overrides?: {
            strengthLabel?: string
            shouldAffectRelevanceScore?: boolean
            metadata?: Record<string, unknown>
        },
    ): LikeEntity {
        const defaultStrengthLabel = like.weight > 2 ? "strong" : "normal"
        const defaultShouldAffect = true
        const defaultMetadata = { from: "manual", r: like.reactionType }

        return new LikeEntity(
            like.id,
            like.postId,
            like.reactionType,
            like.weight,
            like.source,
            like.createdAt,
            overrides?.strengthLabel ?? defaultStrengthLabel,
            overrides?.shouldAffectRelevanceScore ?? defaultShouldAffect,
            overrides?.metadata ?? defaultMetadata,
        )
    }
}
