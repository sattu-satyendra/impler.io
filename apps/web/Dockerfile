FROM node:20.13.1-slim

WORKDIR /usr/src/app

RUN npm i -g npm@9.5.1 pnpm@8.9.0

COPY .npmrc .
COPY package.json .
COPY pnpm-lock.yaml .

COPY tsconfig.json .
COPY tsconfig.base.json .

COPY nx.json .
COPY pnpm-workspace.yaml .

COPY .eslintrc.js .
COPY .prettierrc .
COPY .prettierignore .

COPY apps/web ./apps/web
COPY apps/web/.example.env ./apps/web/.env
COPY packages/client ./packages/client
COPY libs/shared ./libs/shared
COPY packages/react ./packages/react

ENV NEXT_TELEMETRY_DISABLED=1
ENV NX_SKIP_NX_CACHE=true

# Build arguments for Next.js public env vars (baked at build time)
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_EMBED_URL

# Set them as environment variables for the build
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_EMBED_URL=${NEXT_PUBLIC_EMBED_URL}

RUN pnpm i
RUN pnpm build:web

CMD ["pnpm", "start:static:web"]
