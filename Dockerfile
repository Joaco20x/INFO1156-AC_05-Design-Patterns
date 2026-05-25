FROM node:lts-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

EXPOSE 3000
EXPOSE 5555

CMD ["sh", "-c", "pnpm config set store-dir /pnpm/store && pnpm install && pnpm prisma migrate deploy && pnpm prisma generate && (HOST=0.0.0.0 pnpm prisma studio --port 5555 --browser none &) && pnpm run start:dev"]
