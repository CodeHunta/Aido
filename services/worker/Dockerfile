FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY services/worker ./services/worker
COPY packages/db ./packages/db
RUN pnpm install --filter @aido/worker...
CMD ["pnpm", "--filter", "@aido/worker", "dev"]
