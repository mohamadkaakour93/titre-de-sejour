FROM zenika/alpine-chrome:with-node

WORKDIR /usr/src/app

# Copy files and install dependencies
COPY package*.json ./
RUN npm install
COPY . .

CMD ["node", "index.js"]
