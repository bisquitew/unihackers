FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY packages/contracts ./packages/contracts
COPY services/api ./services/api

RUN npm install -g pnpm && pnpm install --filter @hub/api...
RUN pnpm --filter @hub/contracts build
RUN pnpm --filter @hub/api build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/contracts ./packages/contracts
COPY --from=builder /app/services/api/dist ./services/api/dist
COPY --from=builder /app/services/api/node_modules ./services/api/node_modules
COPY --from=builder /app/services/api/package.json ./services/api/package.json

EXPOSE 8000

CMD ["node", "services/api/dist/index.js"]
