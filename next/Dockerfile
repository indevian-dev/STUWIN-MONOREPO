
# ═══════════════════════════════════════════════════════════════
# 🐳 Dockerfile for Next.js (Standalone) with Bun & Monorepo Support
# ═══════════════════════════════════════════════════════════════

# Use oven/bun for fast installation and building
FROM oven/bun:1 AS base

# 1. Install dependencies
FROM base AS deps
WORKDIR /app

# Copy necessary files for installation
# We copy package.json and bun.lock (or bun.lockb) to a subdirectory 'next'
# This project uses 'bun.lock'
COPY next/package.json next/bun.lock ./next/
# Copy shared types as they are a dependency
COPY _shared.types ./_shared.types

WORKDIR /app/next
RUN bun install --frozen-lockfile

# 2. Build the app
FROM base AS builder
WORKDIR /app

# Copy dependencies and source code
COPY --from=deps /app/next/node_modules ./next/node_modules
COPY --from=deps /app/_shared.types ./_shared.types
COPY next ./next

# Set working directory to the Next.js app
WORKDIR /app/next

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
# This will use the 'standalone' output configured in next.config.mjs
RUN bun run build

# 3. Production runner
# Use Bun for running the app as well
FROM oven/bun:1 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Bun image comes with a 'bun' user (uid 1000)

COPY --from=builder /app/next/public ./public

# In a monorepo + standalone build, the server.js might be nested inside the package name
# We copy the entire standalone directory content to the root of /app
# This handles the case where Next.js outputs to .next/standalone/next/server.js
COPY --from=builder --chown=bun:bun /app/next/.next/standalone/next/ ./
COPY --from=builder --chown=bun:bun /app/next/.next/static ./.next/static

USER bun

# Expose the port the app runs on
EXPOSE 8000
ENV PORT=8000
ENV HOSTNAME="0.0.0.0"

# Start the application using Bun
CMD ["bun", "server.js"]
