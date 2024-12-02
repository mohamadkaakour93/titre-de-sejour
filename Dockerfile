FROM node:20

# Install Snap and Chromium
RUN apt-get update && apt-get install -y snapd && \
    snap install chromium

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci
COPY . .

CMD ["node", "index.js"]
