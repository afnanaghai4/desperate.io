FROM node:20-alpine

WORKDIR /app

# Copy only package files first (for better caching)
COPY package.json package-lock.json ./

# Install dependencies with npm ci (more reliable than npm install)
# --quiet reduces output noise
# Clean npm cache to reduce image size
RUN npm ci --quiet && npm cache clean --force

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start:prod"]