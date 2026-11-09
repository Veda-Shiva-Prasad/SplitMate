FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# Install production dependencies first so this layer is cached.
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

# Do not run as root.
USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/health || exit 1

CMD ["node", "index.js"]
