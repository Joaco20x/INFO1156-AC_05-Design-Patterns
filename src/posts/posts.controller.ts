// src/posts/posts.controller.ts

import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Query,
} from "@nestjs/common"
import { PostsService } from "@/posts/posts.service"
import {
    AddLikeDto,
    CreateCommentDto,
    CreatePostDto,
    FeedQueryDto,
} from "@/posts/posts.dtos"

/**
 * Controlador delgado — recibe la request HTTP, delega al Facade (PostsService)
 * y devuelve la respuesta. No contiene lógica de negocio.
 */
@Controller("api/posts")
export class PostsController {
    constructor(private readonly postsService: PostsService) {}

    @Post()
    create(@Body() body: CreatePostDto) {
        return this.postsService.createPost(body)
    }

    @Get()
    findAll() {
        return this.postsService.findAll()
    }

    @Get("feed")
    getFeed(@Query() query: FeedQueryDto) {
        return this.postsService.getFeed(query)
    }

    @Get(":id/comments")
    getComments(@Param("id", ParseIntPipe) id: number) {
        return this.postsService.getComments(id)
    }

    @Post(":id/comments")
    createComment(
        @Param("id", ParseIntPipe) id: number,
        @Body() body: CreateCommentDto,
    ) {
        return this.postsService.createComment(id, body)
    }

    @Post(":id/likes")
    addLike(
        @Param("id", ParseIntPipe) id: number,
        @Body() body: AddLikeDto,
    ) {
        return this.postsService.addLike(id, body)
    }
}