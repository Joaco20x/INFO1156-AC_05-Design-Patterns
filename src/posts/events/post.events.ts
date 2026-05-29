// Clases de eventos de dominio — Observer Pattern (Tarea 2 — Integrante 2)
// Cada clase encapsula el payload necesario para que los suscriptores reaccionen.

export class PostCreatedEvent {
    readonly type = "PostCreated" as const

    constructor(
        public readonly postId: number,
        public readonly title: string,
    ) {}
}

export class CommentCreatedEvent {
    readonly type = "CommentCreated" as const

    constructor(
        public readonly postId: number,
        public readonly commentId: number,
    ) {}
}

export class LikeCreatedEvent {
    readonly type = "LikeCreated" as const

    constructor(
        public readonly postId: number,
        public readonly likeId: number,
        public readonly reactionType: string,
    ) {}
}

export type DomainEvent =
    | PostCreatedEvent
    | CommentCreatedEvent
    | LikeCreatedEvent
