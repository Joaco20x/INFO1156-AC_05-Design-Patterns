import {
    IsIn,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    Length,
    Matches,
    MaxLength,
    Min,
} from "class-validator"

const NO_HTML_PATTERN = /^[^<>]*$/
const NO_HTML_MESSAGE = "HTML tags are not allowed"

export class CreatePostDto {
    @IsString()
    @IsNotEmpty()
    @Length(3, 120)
    @Matches(NO_HTML_PATTERN, { message: NO_HTML_MESSAGE })
    title!: string

    @IsString()
    @IsNotEmpty()
    @Length(10, 1000)
    @Matches(NO_HTML_PATTERN, { message: NO_HTML_MESSAGE })
    description!: string

    @IsString()
    @IsNotEmpty()
    @IsUrl({ protocols: ["http", "https"], require_protocol: true })
    @MaxLength(2048)
    @Matches(NO_HTML_PATTERN, { message: NO_HTML_MESSAGE })
    imageUrl!: string
}

export class CreateCommentDto {
    @IsString()
    @IsNotEmpty()
    @Length(2, 400)
    @Matches(NO_HTML_PATTERN, { message: NO_HTML_MESSAGE })
    content!: string
}

export class AddLikeDto {
    @IsOptional()
    @IsString()
    @IsIn(["like", "fire", "clap"])
    reactionType?: string

    @IsOptional()
    @IsInt()
    @Min(1)
    weight?: number
}

export class FeedQueryDto {
    @IsOptional()
    @IsString()
    @IsIn(["latest", "mostLiked", "mostCommented", "relevance"])
    mode?: string
}
