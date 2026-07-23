FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++

# Copy dist files
COPY dist ./public
COPY package.json .
COPY package-lock.json .

# Install npm dependencies
RUN npm ci --only=production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "server.js"]
