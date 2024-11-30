const axios = require('axios');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');
require('dotenv').config();

// URL à surveiller
const urlToCheck = 'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/4446/creneau/';

// Configurer le transporteur d'e-mails
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com', // Host Brevo
  port: 587, // Port Brevo
  secure: false, // False pour TLS
  auth: {
    user: process.env.EMAIL_USER, // Votre e-mail Brevo
    pass: process.env.EMAIL_PASS, // Votre clé API Brevo
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
const sendAvailabilityNotification = async () => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.NOTIFICATION_EMAIL,
    subject: 'Disponibilité Carte de Séjour',
    text: `Un créneau est disponible ! Vérifiez le site : ${urlToCheck}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Notification envoyée pour disponibilité.');
  } catch (error) {
    console.error('[EMAIL] Erreur lors de l\'envoi de l\'e-mail :', error);
  }
};

// Fonction principale pour vérifier la disponibilité
const checkAvailability = async () => {
  try {
    console.log('[INFO] Récupération de la page...');
    const response = await axios.get(urlToCheck); // Récupérer la page
    const $ = cheerio.load(response.data); // Charger la page dans Cheerio

    // Vérifiez si un texte ou un élément spécifique indique une disponibilité
    const availabilityText = $('body').text();
    if (availabilityText.includes('creneau disponible')) {
      console.log('[INFO] Créneau disponible détecté !');
      await sendAvailabilityNotification();
    } else {
      console.log('[INFO] Aucun créneau disponible.');
    }
  } catch (error) {
    console.error('[ERROR] Erreur lors de la vérification :', error.message);
  }
};

// Exécuter immédiatement pour vérifier que tout fonctionne
(async () => {
  await sendStartNotification(); // Envoi de la notification de démarrage
  await checkAvailability();
  console.log('[INFO] Première exécution terminée. Le script continuera périodiquement.');
})();

// Configurer l'intervalle pour vérifier toutes les 3 minutes
setInterval(checkAvailability, 3 * 60 * 1000);
