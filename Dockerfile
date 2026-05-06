# Base image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy only the package.json and yarn.lock for dependency installation
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install 

# Copy the rest of the application source code
COPY . ./

# Build the TypeScript code
RUN yarn run build

# Command to run the application in production
CMD ["node", "./dist/index.js"]
