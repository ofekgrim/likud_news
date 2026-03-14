FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

# Copy non-TS assets that are referenced at runtime
COPY --from=builder /app/src/modules/legal/privacy-policy.html ./dist/src/modules/legal/

EXPOSE 6000

CMD ["node", "dist/src/main"]
