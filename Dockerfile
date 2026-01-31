# use the official Bun image
FROM oven/bun:1 AS base
WORKDIR /app

# Stage 1: Install dependencies
FROM base AS deps
COPY stuwin-monorepo/package.json stuwin-monorepo/bun.lock* stuwin-monorepo/yarn.lock* stuwin-monorepo/package-lock.json* ./
COPY stuwin-monorepo/frameworks/next/package.json ./frameworks/next/
COPY stuwin-monorepo/packages/shared/package.json ./packages/shared/
RUN bun install

# Stage 2: Prerelease (Source copy and Build)
FROM base AS prerelease
WORKDIR /app
# Copy ONLY the contents of stuwin-monorepo folder to /app root
# This effectively makes /app the monorepo root inside the container
COPY stuwin-monorepo/ .

# Copy dependencies from deps stage
# We do this AFTER copying source code to ensure node_modules are not overwritten
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frameworks/next/node_modules ./frameworks/next/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Set environment variables for build time
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
ENV NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=$NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
ARG NEXT_PUBLIC_S3_PREFIX
ENV NEXT_PUBLIC_S3_PREFIX=$NEXT_PUBLIC_S3_PREFIX
ARG NEXT_PUBLIC_ABLY_API_KEY
ENV NEXT_PUBLIC_ABLY_API_KEY=$NEXT_PUBLIC_ABLY_API_KEY

# Build the Next.js app 
WORKDIR /app/frameworks/next
RUN bun run build

# Stage 3: Release
FROM base AS release
# For standalone output, it's best to run from the folder where server.js will be
WORKDIR /app/frameworks/next

# Set ownership
RUN chown -R bun:bun /app

# Copy the standalone build and static files
# Standalone build produces a 'standalone' folder which we copy into our WORKDIR
COPY --from=prerelease --chown=bun:bun /app/frameworks/next/.next/standalone ./
COPY --from=prerelease --chown=bun:bun /app/frameworks/next/.next/static ./.next/static
COPY --from=prerelease --chown=bun:bun /app/frameworks/next/public ./public

EXPOSE 3000
USER bun

# Standalone mode entrypoint
ENTRYPOINT [ "bun", "run", "server.js" ]
