FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

# Copy root manifest and workspaces
COPY package*.json ./
COPY packages ./packages
COPY services/api ./services/api

# Install production dependencies for API and contracts
RUN npm install --omit=dev

EXPOSE 8000

CMD ["node", "--experimental-strip-types", "services/api/src/server.ts"]
