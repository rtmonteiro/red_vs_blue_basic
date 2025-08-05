# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application source
COPY . .

# Expose port (default Express port)
EXPOSE 3000

# Start the app
CMD ["node", "index.js"]
