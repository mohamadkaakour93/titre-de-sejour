const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const fs = require('fs');
require('dotenv').config();

// URL à surveiller
const urlToCheck = 'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/4446/creneau/';

// Configurer le transporteur d'e-mails (Gmail)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // Utilisez TLS, pas SSL
  auth: {
    user: process.env.EMAIL_USER, // Votre adresse Gmail
    pass: process.env.EMAIL_PASS, // Mot de passe d'application Gmail
  },
});

// Fonction pour envoyer une notification de démarrage
const sendStartNotification = async () => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.NOTIFICATION_EMAIL,
    subject: 'Scraping Started - Carte de Séjour',
    text: 'The scraping script to check for available appointments for the carte de séjour has started.',
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Start notification sent successfully:', info.response);
  } catch (error) {
    console.error('[EMAIL] Error sending start notification:', error);
  }
};

// Fonction pour envoyer une notification de disponibilité
const sendNotification = async () => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.NOTIFICATION_EMAIL,
    subject: 'Carte de Séjour Appointment Available',
    text: `An appointment slot is available! Check the site: ${urlToCheck}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Notification sent successfully:', info.response);
  } catch (error) {
    console.error('[EMAIL] Error sending notification email:', error);
  }
};

// Charger les cookies si disponibles
const loadCookies = async (page) => {
  try {
    if (fs.existsSync('cookies.json')) {
      const cookies = JSON.parse(fs.readFileSync('cookies.json'));
      await page.setCookie(...cookies);
      console.log('[COOKIES] Cookies loaded.');
    }
  } catch (error) {
    console.error('[COOKIES] Error loading cookies:', error);
  }
};

// Sauvegarder les cookies après connexion
const saveCookies = async (page) => {
  try {
    const cookies = await page.cookies();
    fs.writeFileSync('cookies.json', JSON.stringify(cookies));
    console.log('[COOKIES] Cookies saved.');
  } catch (error) {
    console.error('[COOKIES] Error saving cookies:', error);
  }
};

// Fonction principale pour vérifier la disponibilité
const checkAvailability = async () => {
  console.log('[INFO] Starting the verification process...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  
  

  const page = await browser.newPage();

  try {
    // Charger les cookies pour éviter le Captcha si possible
    await loadCookies(page);

    await page.goto(urlToCheck, { waitUntil: 'domcontentloaded' });
    console.log('[INFO] Page loaded.');

    // Si Captcha présent, résoudre manuellement
    console.log('[INFO] Check if a Captcha is present.');
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds to resolve Captcha manually

    // Sauvegarder les cookies après résolution du Captcha
    await saveCookies(page);

    // Vérifier la disponibilité
    const availability = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return bodyText.includes('creneau disponible');
    });

    if (availability) {
      console.log('[INFO] Appointment slot detected!');
      await sendNotification();
    } else {
      console.log('[INFO] No appointment slots available.');
    }
  } catch (error) {
    console.error('[ERROR] Error during verification:', error.message);
  } finally {
    await browser.close();
    console.log('[INFO] Verification completed.');
  }
};

// Exécuter immédiatement pour vérifier que tout fonctionne
(async () => {
  await sendStartNotification(); // Send start notification
  await checkAvailability();
  console.log('[INFO] Initial run completed. The script will continue periodically.');
})();

// Configurer l'intervalle pour vérifier toutes les 3 minutes
setInterval(checkAvailability, 3 * 60 * 1000);
