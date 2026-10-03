# Stage 1: Build environment
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package management files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy TypeScript and Nest configuration and source files
COPY tsconfig*.json nest-cli.json ./
COPY src/ ./src/

# Compile NestJS application to /app/dist
RUN npm run build

# Stage 2: Production runtime environment
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package management files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Run container as unprivileged non-root user
USER node

# Expose default HTTP server port
EXPOSE 3000

# Launch compiled NestJS entrypoint
CMD ["node", "dist/main.js"]
