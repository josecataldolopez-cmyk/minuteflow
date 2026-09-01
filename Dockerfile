# ==============================================================================
# MINUTEFLOW - MULTI-STAGE DOCKERFILE FOR PRODUCTION (CLOUD RUN, AWS, VPS)
# ==============================================================================

# Stage 1: Build the React + Vite frontend
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies with clean cache
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build production bundle into /app/dist
RUN npm run build

# Stage 2: Serve using high-performance Nginx Alpine
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# Clean default static files
RUN rm -rf ./*

# Copy built distribution from builder
COPY --from=builder /app/dist .

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Standard web port
EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
