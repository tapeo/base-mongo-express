FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache git

# Copy package files first
COPY package*.json ./

RUN git clone https://github.com/tapeo/base-mongo-express.git base

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Build the application
RUN npm run build

EXPOSE 8080

CMD ["npm", "run", "start"]