# Use the official image as a parent image.
FROM node:12.16

# Set the working directory.
WORKDIR /usr/src/frontend

# Copy the file from your host to your current location.
COPY package.json .
COPY package-lock.json .

# Run the command inside your image filesystem.
RUN npm install

COPY . .
