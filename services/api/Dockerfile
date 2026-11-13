FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8000

COPY package.json pnpm-workspace.yaml ./
COPY packages/contracts ./packages/contracts
COPY services/api ./services/api

# Link @hub/contracts
RUN mkdir -p services/api/node_modules/@hub && \
    ln -sf ../../../packages/contracts services/api/node_modules/@hub/contracts

EXPOSE 8000

CMD ["node", "--experimental-strip-types", "services/api/src/server.ts"]
