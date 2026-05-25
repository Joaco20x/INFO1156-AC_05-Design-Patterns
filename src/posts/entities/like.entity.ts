export class LikeEntity {
    constructor(
        public id: number,
        public postId: number,
        public reactionType: string,
        public weight: number,
        public source: string,
        public createdAt: Date,
        public strengthLabel: string,
        public shouldAffectRelevanceScore: boolean,
        public metadata: Record<string, unknown>,
    ) {}
}
