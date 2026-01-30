# use the official Bun image
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Stage 1: Install dependencies
FROM base AS install
RUN mkdir -p /temp/dev
# Copy monorepo root package.json and lockfile (using wildcard for lockfile to be flexible)
COPY stuwin-monorepo/package.json stuwin-monorepo/bun.lock* stuwin-monorepo/yarn.lock* stuwin-monorepo/package-lock.json* /temp/dev/
# Copy workspaces package.json files
COPY stuwin-monorepo/frameworks/next/package.json /temp/dev/frameworks/next/
COPY stuwin-monorepo/packages/shared/package.json /temp/dev/packages/shared/

# Install dependencies
# We don't use --frozen-lockfile here because the user's lockfile might be corrupted
# and needs regeneration or has version mismatches.
RUN cd /temp/dev && bun install

# Stage 2: Prerelease (Source copy and Build)
FROM base AS prerelease
WORKDIR /usr/src/app
# Copy node_modules from install stage
COPY --from=install /temp/dev/node_modules ./stuwin-monorepo/node_modules
# Copy all project files
COPY . .

# Set environment variables for build time (Next.js needs these for client-side)
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
ENV NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=$NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
ARG NEXT_PUBLIC_S3_PREFIX
ENV NEXT_PUBLIC_S3_PREFIX=$NEXT_PUBLIC_S3_PREFIX
ARG NEXT_PUBLIC_ABLY_API_KEY
ENV NEXT_PUBLIC_ABLY_API_KEY=$NEXT_PUBLIC_ABLY_API_KEY

# Build the Next.js app
WORKDIR /usr/src/app/stuwin-monorepo/frameworks/next
ENV NODE_ENV=production
RUN bun run build

# Stage 3: Release
FROM base AS release
WORKDIR /usr/src/app/stuwin-monorepo/frameworks/next
ENV NODE_ENV=production

# Set ownership for security (matching user reference)
RUN chown -R bun:bun /usr/src/app

# Copy the standalone build and static files
# server.js is the entry point for standalone deployments
COPY --from=prerelease --chown=bun:bun /usr/src/app/stuwin-monorepo/frameworks/next/.next/standalone ./
COPY --from=prerelease --chown=bun:bun /usr/src/app/stuwin-monorepo/frameworks/next/.next/static ./.next/static
COPY --from=prerelease --chown=bun:bun /usr/src/app/stuwin-monorepo/frameworks/next/public ./public

# export port
EXPOSE 3000

# run the app
USER bun
ENTRYPOINT [ "bun", "run", "server.js" ]
