FROM node:18-slim

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies and add the Linux Tailwind binding inside the container
RUN npm install && npm install -D @tailwindcss/oxide-linux-x64-gnu

# Copy source code
COPY . .

# CRITICAL: Build the Next.js application for production
RUN npm run build

# Expose port
EXPOSE 3000

# Start production server
CMD ["npm", "start"]