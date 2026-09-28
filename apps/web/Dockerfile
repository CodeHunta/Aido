FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY apps/web ./apps/web
COPY packages/db ./packages/db
RUN pnpm install --filter @aido/web... && pnpm --filter @aido/web build
EXPOSE 3000
CMD ["pnpm", "--filter", "@aido/web", "start"]
