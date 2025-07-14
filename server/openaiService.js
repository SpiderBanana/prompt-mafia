const OpenAI = require('openai');
require('dotenv').config();

if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
  console.warn('ATTENTION: Clé OpenAI non configurée! Utilisation d\'images placeholder.');
  console.warn('Éditez le fichier .env et ajoutez votre vraie clé OpenAI');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Génère une image basée sur un prompt en utilisant DALL-E
 * @param {string} prompt - Le prompt de description pour l'image
 * @returns {Promise<string>} - L'URL de l'image générée
 */
async function generateImage(prompt) {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.log('Pas de clé OpenAI configurée');
    throw new Error('OPENAI_API_KEY_MISSING');
  }

  try {
    console.log('Génération d\'image avec DALL-E pour le prompt:', prompt);
    
    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt: prompt,
      n: 1,
      size: "1024x1024"
    });

    const imageUrl = response.data[0].url;
    console.log('Image générée avec succès:', imageUrl);
    return imageUrl;
    
  } catch (error) {
    console.error('Erreur lors de la génération d\'image:', error.message);
    
    if (error.code === 'invalid_api_key') {
      console.error('Clé API OpenAI invalide. Vérifiez votre clé dans le fichier .env');
      throw new Error('INVALID_API_KEY');
    } else if (error.code === 'insufficient_quota') {
      console.error('Quota OpenAI insuffisant. Vérifiez votre solde sur platform.openai.com');
      throw new Error('INSUFFICIENT_QUOTA');
    } else if (error.status === 400 && error.error?.code === 'content_policy_violation') {
      console.error('Contenu du prompt violant les politiques OpenAI');
      throw new Error('CONTENT_POLICY_VIOLATION');
    }
    
    // Pour toute autre erreur, on lève l'erreur au lieu de retourner une image fallback
    throw error;
  }
}

/**
 * Génère une image avec un délai simulé pour éviter de surcharger l'API
 * @param {string} prompt 
 * @returns {Promise<string>}
 */
async function generateImageWithDelay(prompt) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return await generateImage(prompt);
}

module.exports = {
  generateImage,
  generateImageWithDelay
};
