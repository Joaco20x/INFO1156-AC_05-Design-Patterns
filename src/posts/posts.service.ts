// src/posts/posts.service.ts

import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"
import { SortingContext } from "@/posts/strategies/sorting-context"
import { EventBus } from "@/posts/events/event-bus"
import { ModerationAdapter } from "@/posts/moderation/moderation-adapter"
import { PostEntityFactory } from "@/posts/factories/post-entity.factory"
import { CommentEntityFactory } from "@/posts/factories/comment-entity.factory"
import { LikeEntityFactory } from "@/posts/factories/like-entity.factory"
import {
    CommentCreatedEvent,
    LikeCreatedEvent,
    PostCreatedEvent,
} from "@/posts/events/post.events"
import {
    AddLikeDto,
    CreateCommentDto,
    CreatePostDto,
    FeedQueryDto,
} from "@/posts/posts.dtos"

/**
 * Facade Pattern — Integrante 5.
 *
 * Orquesta el flujo completo de cada operación integrando los cuatro
 * patrones implementados por el resto del equipo:
 *   - Strategy  (Integrante 1) → SortingContext
 *   - Observer  (Integrante 2) → EventBus + subscribers
 *   - Adapter   (Integrante 3) → ModerationAdapter
 *   - Factory   (Integrante 4) → PostEntityFactory, CommentEntityFactory, LikeEntityFactory
 *
 * El controlador solo delega; toda la lógica de negocio vive aquí.
 */
@Injectable()
export class PostsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly sortingContext: SortingContext,
        private readonly eventBus: EventBus,
        private readonly moderationAdapter: ModerationAdapter,
    ) {}

    // ── Posts ────────────────────────────────────────────────────────────────

    async createPost(dto: CreatePostDto) {
        const post = await this.prisma.post.create({ data: dto })

        // Observer: notifica a todos los suscriptores registrados
        await this.eventBus.emit(new PostCreatedEvent(post.id, post.title))

        return { ok: true, payload: post }
    }

    async findAll() {
        const posts = await this.prisma.post.findMany({
            orderBy: { createdAt: "desc" },
        })

        return { total: posts.length, items: posts }
    }

    async getFeed(query: FeedQueryDto) {
        const mode = query.mode ?? "latest"

        const posts = await this.prisma.post.findMany({
            include: { comments: true, likes: true },
        })

        // Factory: convierte registros Prisma en entidades de dominio enriquecidas
        const entities = posts.map((post) =>
            PostEntityFactory.createFromPrisma(post, mode),
        )

        // Strategy: selecciona y aplica el algoritmo de ordenamiento
        const sorted = this.sortingContext.sort(mode, entities)

        return { mode, count: sorted.length, rows: sorted }
    }

    // ── Comments ──────────────────────────────────────────────────────────────

    async getComments(postId: number) {
        await this.ensurePostExists(postId)

        const comments = await this.prisma.comment.findMany({
            where: { postId },
            orderBy: { createdAt: "desc" },
        })

        // Factory: convierte registros Prisma en entidades de dominio
        const entities = comments.map((comment) =>
            CommentEntityFactory.createFromPrisma(comment),
        )

        return { total_comments: entities.length, comments: entities }
    }

    async createComment(postId: number, dto: CreateCommentDto) {
        await this.ensurePostExists(postId)

        // Adapter: normaliza la salida heterogénea del cliente legacy a { blocked, reason }
        const moderation = this.moderationAdapter.review(dto.content)
        if (moderation.blocked) {
            throw new BadRequestException("Comment blocked by moderation")
        }

        const comment = await this.prisma.comment.create({
            data: { postId, content: dto.content, source: "service" },
        })

        // Factory: construye entidad con sentimentScore calculado y metadata de moderación
        const entity = CommentEntityFactory.createFromPrisma(comment, {
            sentimentScore: comment.content.length > 60 ? 80 : 40,
            isPinned: false,
            metadata: { moderation, source: "legacy" },
        })

        // Observer: notifica a todos los suscriptores registrados
        await this.eventBus.emit(new CommentCreatedEvent(postId, comment.id))

        return { message: "comment_created", entity }
    }

    // ── Likes ─────────────────────────────────────────────────────────────────

    async addLike(postId: number, dto: AddLikeDto) {
        await this.ensurePostExists(postId)

        const like = await this.prisma.like.create({
            data: {
                postId,
                reactionType: dto.reactionType ?? "like",
                weight: dto.weight ?? 1,
                source: "service",
            },
        })

        // Factory: construye entidad con strengthLabel calculado
        const entity = LikeEntityFactory.createFromPrisma(like)

        // Observer: notifica a todos los suscriptores registrados
        await this.eventBus.emit(
            new LikeCreatedEvent(postId, like.id, like.reactionType),
        )

        return { success: true, like: entity }
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    private async ensurePostExists(id: number) {
        const post = await this.prisma.post.findUnique({ where: { id } })
        if (!post) throw new NotFoundException("Post not found")
        return post
    }
}