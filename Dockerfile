# use the official Bun image
FROM oven/bun:1.1.43 AS base
WORKDIR /app

# Stage 1: Install dependencies
FROM base AS deps
# Copy workspace configuration
COPY stuwin-monorepo/package.json stuwin-monorepo/bun.lock ./stuwin-monorepo/
COPY stuwin-monorepo/frameworks/next/package.json ./stuwin-monorepo/frameworks/next/
COPY stuwin-monorepo/packages/shared/package.json ./stuwin-monorepo/packages/shared/

# Install dependencies for the whole monorepo
WORKDIR /app/stuwin-monorepo
RUN bun install --frozen-lockfile

# Stage 2: Build the application
FROM deps AS builder
WORKDIR /app
# Copy all source files
COPY . .

# Build the Next.js app in the workspace
WORKDIR /app/stuwin-monorepo/frameworks/next
RUN bun run build

# Stage 3: Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a non-root user for security
RUN adduser --system --uid 1001 nextjs
RUN addgroup --system --gid 1001 nodejs

# Copy the standalone build from the builder stage
# Standalone mode copies the necessary parts of the monorepo
COPY --from=builder /app/stuwin-monorepo/frameworks/next/.next/standalone ./
COPY --from=builder /app/stuwin-monorepo/frameworks/next/.next/static ./stuwin-monorepo/frameworks/next/.next/static
COPY --from=builder /app/stuwin-monorepo/frameworks/next/public ./stuwin-monorepo/frameworks/next/public

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Next.js standalone server entry point
CMD ["bun", "stuwin-monorepo/frameworks/next/server.js"]
