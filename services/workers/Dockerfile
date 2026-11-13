FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-workspace.yaml ./
COPY packages/contracts ./packages/contracts
COPY services/workers ./services/workers

# Link @hub/contracts
RUN mkdir -p services/workers/node_modules/@hub && \
    ln -sf ../../../packages/contracts services/workers/node_modules/@hub/contracts

CMD ["node", "--experimental-strip-types", "services/workers/src/index.ts"]
