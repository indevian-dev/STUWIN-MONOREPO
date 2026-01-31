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
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY
ARG QSTASH_TOKEN
ENV QSTASH_TOKEN=$QSTASH_TOKEN
ARG QSTASH_CURRENT_SIGNING_KEY
ENV QSTASH_CURRENT_SIGNING_KEY=$QSTASH_CURRENT_SIGNING_KEY
ARG QSTASH_NEXT_SIGNING_KEY
ENV QSTASH_NEXT_SIGNING_KEY=$QSTASH_NEXT_SIGNING_KEY

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

ARG AWS_S3_ACCESS_KEY_ID
ENV AWS_S3_ACCESS_KEY_ID=$AWS_S3_ACCESS_KEY_ID
ARG AWS_S3_SECRET_ACCESS_KEY
ENV AWS_S3_SECRET_ACCESS_KEY=$AWS_S3_SECRET_ACCESS_KEY
ARG AWS_REGION
ENV AWS_REGION=$AWS_REGION
ARG AWS_S3_ENDPOINT
ENV AWS_S3_ENDPOINT=$AWS_S3_ENDPOINT
ARG AWS_S3_BUCKET_NAME
ENV AWS_S3_BUCKET_NAME=$AWS_S3_BUCKET_NAME

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
