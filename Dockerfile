FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsup.config.ts ./
COPY src/ src/
COPY templates/ templates/
COPY bin/ bin/
RUN npm run build

FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bin ./bin
COPY --from=builder /app/templates ./templates

ENV NODE_ENV=production
EXPOSE 3141

ENTRYPOINT ["node", "bin/agentsite.js"]
CMD ["serve"]
