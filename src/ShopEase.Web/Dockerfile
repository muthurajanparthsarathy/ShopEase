# ═══════════════════════════════════════════════════════════════════
#  ShopEase Web — multi-stage build
#
#  Stage 1 (build)   ~1.1 GB : Node, npm, the whole Angular toolchain
#  Stage 2 (runtime)  ~50 MB : nginx + the compiled bundle
#
#  Node exists only to produce the bundle. The shipped image has no
#  Node, no npm and no node_modules — just static files and a webserver.
# ═══════════════════════════════════════════════════════════════════

# ─────────────── Stage 1: build ───────────────
FROM node:22-alpine AS build
WORKDIR /app

# Lockfile first so `npm ci` is cached independently of source changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# `npm run build` → `ng build`, whose defaultConfiguration is production.
RUN npm run build

# ─────────────── Stage 2: runtime ───────────────
FROM nginx:alpine AS runtime

# Angular 21 emits to dist/<project>/browser
COPY --from=build /app/dist/ShopEase.Web/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
