FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY packages/contracts ./packages/contracts
COPY services/workers ./services/workers

RUN npm install -g pnpm && pnpm install --filter @hub/workers...
RUN pnpm --filter @hub/contracts build
RUN pnpm --filter @hub/workers build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/contracts ./packages/contracts
COPY --from=builder /app/services/workers/dist ./services/workers/dist
COPY --from=builder /app/services/workers/node_modules ./services/workers/node_modules
COPY --from=builder /app/services/workers/package.json ./services/workers/package.json

CMD ["node", "services/workers/dist/index.js"]
