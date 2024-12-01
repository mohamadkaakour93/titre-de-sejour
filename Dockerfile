FROM node:20

# Install dependencies
RUN apt-get update && apt-get install -y wget unzip

# Install Chromium in the Puppeteer cache directory
RUN mkdir -p /app/.cache/puppeteer && \
    cd /app/.cache/puppeteer && \
    wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
    dpkg -i google-chrome-stable_current_amd64.deb || apt-get -fy install

# Set the Puppeteer executable path
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

WORKDIR /app

# Copy files
COPY package*.json ./
RUN npm install
COPY . .

CMD ["node", "index.js"]
