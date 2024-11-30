const puppeteer = require('puppeteer-core');
const nodemailer = require('nodemailer');
const fs = require('fs');
require('dotenv').config();

// URL à surveiller
const urlToCheck = 'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/4446/creneau/';

// Configurer le transporteur d'e-mails
const transporter = nodemailer.createTransport({
  service: 'gmail', // Utilisez Gmail ou un autre service
  auth: {
    user: process.env.EMAIL_USER, // Votre e-mail
    pass: process.env.EMAIL_PASS, // Mot de passe ou token d'application
  },
});

// Fonction pour envoyer une notification de démarrage
const sendStartNotification = async () => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.NOTIFICATION_EMAIL,
    subject: 'Scraping Démarré - Carte de Séjour',
    text: 'Le script de scraping pour vérifier les rendez-vous disponibles pour le titre de séjour a démarré.',
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Notification de démarrage envoyée.');
  } catch (error) {
    console.error('[EMAIL] Erreur lors de l\'envoi de la notification de démarrage :', error);
  }
};

// Fonction pour envoyer une notification de disponibilité
const sendNotification = async () => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.NOTIFICATION_EMAIL,
    subject: 'Disponibilité Carte de Séjour',
    text: `Un créneau est disponible ! Vérifiez le site : ${urlToCheck}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Notification envoyée par e-mail.');
  } catch (error) {
    console.error('[EMAIL] Erreur lors de l\'envoi de l\'e-mail :', error);
  }
};

// Charger les cookies si disponibles
const loadCookies = async (page) => {
  try {
    if (fs.existsSync('cookies.json')) {
      const cookies = JSON.parse(fs.readFileSync('cookies.json'));
      await page.setCookie(...cookies);
      console.log('[COOKIES] Cookies chargés.');
    }
  } catch (error) {
    console.error('[COOKIES] Erreur lors du chargement des cookies :', error);
  }
};

// Sauvegarder les cookies après connexion
const saveCookies = async (page) => {
  try {
    const cookies = await page.cookies();
    fs.writeFileSync('cookies.json', JSON.stringify(cookies));
    console.log('[COOKIES] Cookies sauvegardés.');
  } catch (error) {
    console.error('[COOKIES] Erreur lors de la sauvegarde des cookies :', error);
  }
};

// Fonction principale pour vérifier la disponibilité
const checkAvailability = async () => {
  console.log('[INFO] Lancement de la vérification...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/chromium-browser', // Chemin vers Chromium
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage();

  try {
    // Charger les cookies pour éviter le Captcha si possible
    await loadCookies(page);

    await page.goto(urlToCheck, { waitUntil: 'domcontentloaded' });
    console.log('[INFO] Page chargée.');

    // Si Captcha présent, résoudre manuellement
    console.log('[INFO] Vérifiez si un Captcha est présent.');
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Attendre 10 secondes pour résoudre le Captcha manuellement

    // Sauvegarder les cookies après résolution du Captcha
    await saveCookies(page);

    // Vérifier la disponibilité
    const availability = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return bodyText.includes('creneau disponible');
    });

    if (availability) {
      console.log('[INFO] Créneau disponible détecté !');
      await sendNotification();
    } else {
      console.log('[INFO] Aucun créneau disponible.');
    }
  } catch (error) {
    console.error('[ERROR] Erreur lors de la vérification :', error.message);
  } finally {
    await browser.close();
    console.log('[INFO] Vérification terminée.');
  }
};

// Exécuter immédiatement pour vérifier que tout fonctionne
(async () => {
  await sendStartNotification(); // Envoi de la notification de démarrage
  await checkAvailability();
  console.log('[INFO] Première exécution terminée. Si tout fonctionne, le script continuera périodiquement.');
})();

// Configurer l'intervalle pour vérifier toutes les 3 minutes
setInterval(checkAvailability, 3 * 60 * 1000);
