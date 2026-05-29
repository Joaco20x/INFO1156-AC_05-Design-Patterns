# Patrones de Diseño — Grupo LPC

**Integrantes:**
- Joaquín Valenzuela
- Martín López
- Vicente Santin
- Bastián Liempi
- Deris Aránguiz

---

## Problemas identificados

Al analizar el código original, identificamos los siguientes problemas en la lógica del servidor:

### 1. Lógica de negocio en el controlador
El `PostsController` contenía validaciones, cálculos de relevancia, construcción de entidades y efectos secundarios directamente en cada endpoint. Esto viola el principio de responsabilidad única y hace el controlador difícil de mantener y testear.

### 2. Funciones sueltas para efectos secundarios
Las funciones `logDomainEvent`, `fakeSendNotification` y `fakeRecomputeSomething` estaban definidas como funciones inline dentro del controlador. Agregar un nuevo efecto secundario requería modificar directamente el controlador, acoplando la lógica de reacción a eventos con la lógica de recepción HTTP.

### 3. Construcción de entidades dispersa y repetida
`PostEntity`, `CommentEntity` y `LikeEntity` se construían con sus ~10 argumentos directamente en el controlador, duplicando la lógica de cálculo (relevanceScore, sentimentScore, strengthLabel, etc.) en múltiples lugares.

### 4. Integración directa con la API legacy de moderación
El controlador llamaba directamente a `legacyModerationApi.review()` y contenía un bloque `if/else if` para normalizar sus respuestas inconsistentes (`string | number | object`). Si la API legacy cambia, hay que buscar y editar esa lógica en el controlador.

### 5. Algoritmo de ordenamiento rígido
No existía forma de cambiar el criterio de ordenamiento del feed sin modificar el código del controlador.

---

## Soluciones aplicadas

### Patrón Strategy (Comportamental) — Vicente Santin

**Problema resuelto:** el ordenamiento del feed era rígido y no intercambiable.

Se definió la interfaz `FeedSortingStrategy` y se implementaron 4 estrategias concretas. Un `SortingContext` selecciona la estrategia correcta según el parámetro `mode` recibido en la query.

```typescript
// feed-sorting.strategy.ts
export interface FeedSortingStrategy {
    sort(posts: PostEntity[]): PostEntity[]
}

// latest.strategy.ts
@Injectable()
export class LatestStrategy implements FeedSortingStrategy {
    sort(posts: PostEntity[]): PostEntity[] {
        return [...posts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    }
}

// sorting-context.ts
sort(mode: string, posts: PostEntity[]): PostEntity[] {
    const strategy = this.strategies[mode] || this.strategies['latest']
    return strategy.sort(posts)
}
```

---

### Patrón Observer (Comportamental) — Martín López

**Problema resuelto:** las funciones `logDomainEvent`, `fakeSendNotification` y `fakeRecomputeSomething` estaban acopladas al controlador.

Se implementó un `EventBus` con métodos `subscribe` y `emit`. Cada efecto secundario se encapsuló en un suscriptor independiente (`LoggerSubscriber`, `NotificationSubscriber`, `RecomputeSubscriber`) que se auto-registra al inicializar el módulo.

```typescript
// event-bus.ts
@Injectable()
export class EventBus {
    private readonly handlers = new Map<string, EventHandler[]>()

    subscribe<T extends DomainEvent>(eventType: T['type'], handler: EventHandler<T>): void {
        const existing = this.handlers.get(eventType) ?? []
        this.handlers.set(eventType, [...existing, handler as EventHandler])
    }

    async emit<T extends DomainEvent>(event: T): Promise<void> {
        const eventHandlers = this.handlers.get(event.type) ?? []
        await Promise.all(eventHandlers.map((h) => h(event)))
    }
}

// En el servicio, al crear un post:
await this.eventBus.emit(new PostCreatedEvent(post.id, post.title))
```

---

### Patrón Adapter (Estructural) — Bastián Liempi

**Problema resuelto:** el controlador dependía directamente de la API legacy de moderación y normalizaba manualmente sus respuestas inconsistentes.

Se creó `ModerationAdapter` que encapsula la llamada a `legacyModerationApi` y convierte cualquier tipo de respuesta en un `ModerationResult` uniforme `{ blocked: boolean, reason?: string }`.

```typescript
// moderation-adapter.ts
@Injectable()
export class ModerationAdapter {
    review(content: string): ModerationResult {
        const raw = legacyModerationApi.review(content)

        if (raw === 'BLOCK') return { blocked: true, reason: 'blocked-by-legacy-rule' }
        if (raw === 'OK')    return { blocked: false }
        if (typeof raw === 'number') return { blocked: raw < 1 }
        if (typeof raw === 'object') return { blocked: !(raw as any).pass }

        return { blocked: false }
    }
}
```

---

### Patrón Factory (Creacional) — Deris Aránguiz

**Problema resuelto:** la construcción de entidades con múltiples argumentos y cálculos derivados estaba duplicada en el controlador.

Se crearon tres factories estáticas (`PostEntityFactory`, `CommentEntityFactory`, `LikeEntityFactory`) que centralizan la lógica de construcción y cálculo de cada entidad.

```typescript
// post-entity.factory.ts
export class PostEntityFactory {
    static createFromPrisma(
        post: Post & { comments?: Comment[]; likes?: Like[] },
        mode: string = 'latest',
    ): PostEntity {
        const likesCount = post.likes?.reduce((sum, l) => sum + l.weight, 0) ?? 0
        const commentsCount = post.comments?.length ?? 0
        const hoursSinceCreated = (Date.now() - new Date(post.createdAt).getTime()) / 3_600_000
        const relevanceScore = likesCount * 2 + commentsCount * 3 - Math.floor(hoursSinceCreated)

        return new PostEntity(post.id, post.title, post.description, post.imageUrl,
            post.createdAt, post.updatedAt, likesCount, commentsCount,
            relevanceScore, relevanceScore > 20, 'factory', 
            post.title.split(' ').filter(w => w.length > 4), {}, mode)
    }
}
```

---

### Patrón Facade (Estructural) — Joaquín Valenzuela

**Problema resuelto:** la lógica de negocio estaba dispersa en el controlador sin una capa de orquestación clara.

Se rediseñó `PostsService` como un **Facade** que orquesta los cuatro patrones anteriores. El controlador quedó completamente delegatorio: solo recibe la request HTTP y llama al servicio.

```typescript
// posts.controller.ts — después del refactor
@Controller('api/posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) {}

    @Post()
    create(@Body() body: CreatePostDto) {
        return this.postsService.createPost(body)  // delega todo al Facade
    }

    @Post(':id/comments')
    createComment(@Param('id', ParseIntPipe) id: number, @Body() body: CreateCommentDto) {
        return this.postsService.createComment(id, body)
    }
}
```

---

## Resumen de patrones aplicados

| Tipo | Patrón | Archivo(s) principal(es) | Integrante |
|---|---|---|---|
| Comportamental | Strategy | `strategies/` | Vicente Santin |
| Comportamental | Observer | `events/` | Martín López |
| Estructural | Adapter | `moderation/moderation-adapter.ts` | Bastián Liempi |
| Creacional | Factory | `factories/` | Deris Aránguiz |
| Estructural | Facade | `posts.service.ts` | Joaquín Valenzuela |