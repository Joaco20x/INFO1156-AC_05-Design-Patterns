export class PostEntity {
    // Entidad de salida enriquecida para feed (incluye campos derivados y metadata).
    constructor(
        public id: number,
        public title: string,
        public description: string,
        public imageUrl: string,
        public createdAt: Date,
        public updatedAt: Date,
        public likesCount: number,
        public commentsCount: number,
        public relevanceScore: number,
        public isFeatured: boolean,
        public source: string,
        public tags: string[],
        public metadata: Record<string, unknown>,
        public rankingMode: string,
    ) {}
}
