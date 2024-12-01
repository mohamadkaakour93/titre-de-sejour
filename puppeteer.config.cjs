const { join } = require('path');

/** @type {import("puppeteer").Configuration} */
module.exports = {
  // Change le répertoire de cache pour Puppeteer.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
