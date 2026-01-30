# use the official Bun image
FROM oven/bun:1.1.43 AS base
WORKDIR /app

# Stage 1: Install dependencies
FROM base AS deps
# Copy workspace configuration
COPY package.json bun.lock ./
COPY frameworks/next/package.json ./frameworks/next/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies for the whole monorepo
RUN bun install --frozen-lockfile

# Stage 2: Build the application
FROM deps AS builder
WORKDIR /app
# Copy all source files
COPY . .

# Set environment variables for build time if necessary
# ENV NEXT_PUBLIC_API_URL=...

# Build the Next.js app in the workspace
WORKDIR /app/frameworks/next
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
# Standalone output includes only the necessary files from all workspaces
COPY --from=builder /app/frameworks/next/.next/standalone ./
COPY --from=builder /app/frameworks/next/.next/static ./frameworks/next/.next/static
COPY --from=builder /app/frameworks/next/public ./frameworks/next/public

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Next.js standalone server entry point
CMD ["bun", "frameworks/next/server.js"]
