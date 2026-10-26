FROM node:20-bookworm-slim

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
WORKDIR /app
RUN corepack enable
COPY . .
RUN yarn install --immutable

WORKDIR /app/apps/backend
EXPOSE 4008
CMD ["sh", "-c", "yarn migrate && exec yarn start"]
