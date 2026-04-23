FROM node:24-alpine@sha256:d1b3b4da11eefd5941e7f0b9cf17783fc99d9c6fc34884a665f40a06dbdfc94f AS base

FROM base AS deps
RUN apk add --no-cache gcompat=1.1.0-r4
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY mui ./mui
COPY public ./public
COPY components.json eslint.config.mjs next.config.ts next-env.d.ts postcss.config.mjs proxy.ts tsconfig.json package.json package-lock.json ./
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_DEBUG=false
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_DEBUG=$NEXT_PUBLIC_DEBUG
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=root:root --chmod=555 /app/public ./public
COPY --from=builder --chown=root:root --chmod=555 /app/.next/standalone ./
COPY --from=builder --chown=root:root --chmod=555 /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
