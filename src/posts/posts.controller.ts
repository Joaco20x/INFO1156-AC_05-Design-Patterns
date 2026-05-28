import {
    BadRequestException,
    Body,
    Controller,
    Get,
    NotFoundException,
    Param,
    ParseIntPipe,
    Post,
    Query,
} from "@nestjs/common"
import { CommentEntityFactory } from "@/posts/factories/comment-entity.factory"
import { LikeEntityFactory } from "@/posts/factories/like-entity.factory"
import { PostEntityFactory } from "@/posts/factories/post-entity.factory"
import { ModerationAdapter } from "@/posts/moderation/moderation-adapter"
import { PrismaService } from "@/prisma/prisma.service"
import { PostsService } from "@/posts/posts.service"
import { SortingContext } from "@/posts/strategies/sorting-context"
import {
    AddLikeDto,
    CreateCommentDto,
    CreatePostDto,
    FeedQueryDto,
} from "@/posts/posts.dtos"
import { EventBus } from "@/posts/events/event-bus"
import {
    CommentCreatedEvent,
    LikeCreatedEvent,
    PostCreatedEvent,
} from "@/posts/events/post.events"

@Controller("api/posts")
export class PostsController {
    constructor(
        private readonly postsService: PostsService,
        private readonly prisma: PrismaService,
        private readonly sortingContext: SortingContext,
        private readonly eventBus: EventBus,
        private readonly moderationAdapter: ModerationAdapter,
    ) {}

    @Post()
    async create(@Body() body: CreatePostDto) {
        if (body.title.length < 3 || body.title.length > 120) {
            throw new BadRequestException(
                "Title length must be between 3 and 120",
            )
        }

        if (!body.imageUrl.startsWith("http")) {
            throw new BadRequestException("Image URL must start with http")
        }

        const created = await this.postsService.create(body)

        await this.eventBus.emit(
            new PostCreatedEvent(created.id, created.title),
        )

        return {
            ok: true,
            payload: created,
        }
    }

    @Get()
    async findAll() {
        const posts = await this.postsService.findAll()

        return {
            total: posts.length,
            items: posts,
        }
    }

    @Get("feed")
    async getFeed(@Query() query: FeedQueryDto) {
        const mode = query.mode || "latest"

        const posts = await this.prisma.post.findMany({
            include: {
                comments: true,
                likes: true,
            },
        })

        const mappedPosts = posts.map((post) =>
            PostEntityFactory.createFromPrisma(post, mode),
        )

        let sorted = [...mappedPosts]

        sorted = this.sortingContext.sort(mode, sorted)

        return {
            mode,
            count: sorted.length,
            rows: sorted,
        }
    }

    @Get(":id/comments")
    async getComments(@Param("id", ParseIntPipe) id: number) {
        const post = await this.postsService.findById(id)
        if (!post) {
            throw new NotFoundException("Post not found")
        }

        const comments = await this.prisma.comment.findMany({
            where: { postId: id },
            orderBy: { createdAt: "desc" },
        })

        const entities = comments.map((comment) =>
            CommentEntityFactory.createFromPrisma(comment),
        )

        return {
            total_comments: entities.length,
            comments: entities,
        }
    }

    @Post(":id/comments")
    async createComment(
        @Param("id", ParseIntPipe) id: number,
        @Body() body: CreateCommentDto,
    ) {
        const post = await this.postsService.findById(id)
        if (!post) {
            throw new NotFoundException("Post not found")
        }

        if (body.content.length < 2) {
            throw new BadRequestException("Comment too short")
        }

        // Adapter: normaliza la salida del cliente legacy a { blocked, reason }
        const moderation = this.moderationAdapter.review(body.content)

        if (moderation.blocked) {
            throw new BadRequestException("Comment blocked by moderation")
        }

        // Se persiste la información en la base de datos
        const created = await this.prisma.comment.create({
            data: {
                postId: id,
                content: body.content,
                source: "controller",
            },
        })

        const entity = CommentEntityFactory.createFromPrisma(created, {
            sentimentScore: created.content.length > 60 ? 80 : 40,
            isPinned: false,
            metadata: { moderation, source: "legacy" },
        })

        await this.eventBus.emit(
            new CommentCreatedEvent(id, created.id),
        )

        return {
            message: "comment_created",
            entity,
        }
    }

    @Post(":id/likes")
    async addLike(
        @Param("id", ParseIntPipe) id: number,
        @Body() body: AddLikeDto,
    ) {
        const post = await this.postsService.findById(id)
        if (!post) {
            throw new NotFoundException("Post not found")
        }

        const reactionType = body.reactionType || "like"
        const weight = body.weight || 1

        if (weight < 1) {
            throw new BadRequestException("Weight must be at least 1")
        }

        const like = await this.prisma.like.create({
            data: {
                postId: id,
                reactionType,
                weight,
                source: "controller",
            },
        })

        const entity = LikeEntityFactory.createFromPrisma(like)

        await this.eventBus.emit(
            new LikeCreatedEvent(id, like.id, reactionType),
        )

        return {
            success: true,
            like: entity,
        }
    }
}
