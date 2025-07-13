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
    const fallbackUrl = `https://picsum.photos/400/400?random=${Date.now()}`;
    console.log('Pas de clé OpenAI configurée, utilisation d\'une image placeholder');
    return fallbackUrl;
  }

  try {
    console.log('Génération d\'image avec DALL-E pour le prompt:', prompt);
    
    const response = await openai.images.generate({
      model: "dall-e-3",
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
    } else if (error.code === 'insufficient_quota') {
      console.error('Quota OpenAI insuffisant. Vérifiez votre solde sur platform.openai.com');
    }
    
    const fallbackUrl = `https://picsum.photos/400/400?random=${Date.now()}`;
    console.log('Utilisation d\'une image de fallback:', fallbackUrl);
    return fallbackUrl;
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
