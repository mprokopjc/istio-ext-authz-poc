# 1. Use the official Node.js LTS image (currently v20) based on Alpine for smaller size
ARG NODE_VERSION=20-alpine
FROM node:${NODE_VERSION} AS base

# Set working directory
WORKDIR /usr/src/app

# Set NODE_ENV to production - optimizes npm install and some libraries
ENV NODE_ENV=production

# Install dependencies using npm ci for deterministic builds
# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./
# Use --omit=dev which is the default for NODE_ENV=production, but explicit is fine.
# Use --ignore-scripts if you are sure no build scripts are needed post-install.
RUN npm ci --omit=dev

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application
# Use node directly for fewer layers compared to npm start
CMD [ "node", "server.js" ]