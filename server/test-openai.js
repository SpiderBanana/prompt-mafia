// Test rapide de la clé OpenAI
const { generateImage } = require('./openaiService');

async function testOpenAI() {
  console.log('🧪 Test de la génération d\'image OpenAI...\n');
  
  try {
    const testPrompt = "Un chat mignon assis sur une chaise";
    console.log(`📝 Prompt de test: "${testPrompt}"`);
    
    const imageUrl = await generateImage(testPrompt);
    
    if (imageUrl.includes('picsum.photos')) {
      console.log('⚠️  Image placeholder générée - OpenAI non configuré ou erreur');
      console.log('👉 Vérifiez votre clé API dans le fichier .env');
    } else {
      console.log('🎉 OpenAI fonctionne correctement !');
      console.log(`🖼️  URL de l'image: ${imageUrl}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Lancer le test
testOpenAI();
