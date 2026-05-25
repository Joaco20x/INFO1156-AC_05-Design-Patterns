export class CommentEntity {
    constructor(
        public id: number,
        public postId: number,
        public content: string,
        public createdAt: Date,
        public updatedAt: Date,
        public source: string,
        public moderationState: string,
        public sentimentScore: number,
        public isPinned: boolean,
        public language: string,
        public metadata: Record<string, unknown>,
    ) {}
}
