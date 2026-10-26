FROM node:20-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable
COPY . .
RUN yarn install --immutable

WORKDIR /app/apps/backend
EXPOSE 4008
CMD ["sh", "-c", "yarn migrate && exec yarn start"]
