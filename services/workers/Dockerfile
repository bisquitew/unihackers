FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy root manifest and workspaces
COPY package*.json ./
COPY packages ./packages
COPY services/workers ./services/workers

# Install production dependencies for workers and contracts
RUN npm install --omit=dev

CMD ["node", "--experimental-strip-types", "services/workers/src/index.ts"]
