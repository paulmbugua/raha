FROM node:20-bookworm-slim AS builder

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
WORKDIR /app
RUN corepack enable
COPY . .
RUN yarn install --immutable
RUN yarn workspace @mindcare/admin build

FROM nginx:1.27-alpine
COPY deploy/vps/admin-nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/vps/admin-entrypoint.sh /usr/local/bin/admin-entrypoint
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html
RUN chmod 0755 /usr/local/bin/admin-entrypoint
EXPOSE 80
ENTRYPOINT ["/usr/local/bin/admin-entrypoint"]
