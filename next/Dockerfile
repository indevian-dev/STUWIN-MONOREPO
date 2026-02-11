
# ═══════════════════════════════════════════════════════════════
# 🐳 Dockerfile for Next.js (Standalone) with Bun & Monorepo Support
# ═══════════════════════════════════════════════════════════════

# Use oven/bun for fast installation and building
FROM oven/bun:1 AS base

# 1. Install dependencies
FROM base AS deps
WORKDIR /app

# Copy necessary files for installation
# We copy package.json and bun.lock to a subdirectory 'next'
COPY next/package.json next/bun.lock ./next/
COPY _shared.types ./_shared.types

WORKDIR /app/next
RUN bun install --frozen-lockfile

# 2. Build the app
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/next/node_modules ./next/node_modules
COPY --from=deps /app/_shared.types ./_shared.types
COPY next ./next

WORKDIR /app/next
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# 3. Production runner
FROM oven/bun:1 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# COPY the entire standalone folder
# This includes 'node_modules' (dependencies) and 'next' (the project)
COPY --from=builder /app/next/.next/standalone ./

# COPY public and static assets to the correct location within the standalone structure
# Assuming the project folder is named 'next' inside standalone
COPY --from=builder /app/next/public ./next/public
COPY --from=builder /app/next/.next/static ./next/.next/static

USER bun

EXPOSE 8000
ENV PORT=8000
ENV HOSTNAME="0.0.0.0"

# Start the server from the specific project directory inside standalone
CMD ["bun", "next/server.js"]
