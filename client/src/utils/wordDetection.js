/**
 * Utilitaires pour détecter les mots interdits dans les prompts
 * Utilise plusieurs techniques pour empêcher les contournements :
 * - Distance de Levenshtein pour les fautes de frappe
 * - Détection de variantes grammaticales
 * - Détection de mots cachés dans des chaînes collées
 */

export const levenshteinDistance = (a, b) => {
  const matrix = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, 
          matrix[i][j - 1] + 1,     
          matrix[i - 1][j] + 1      
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
};


export const generateWordVariations = (word) => {
  return [
    word,
    word + 's',     
    word + 'e',     
    word + 'es',    
    word + 'x',     
    word + 'aux'    
  ];
};


export const checkWordSimilarity = (word, forbiddenWord, variations) => {
  if (variations.includes(word)) {
    return true;
  }
  

  if (forbiddenWord.length >= 3) {
    const maxDistance = forbiddenWord.length <= 4 ? 1 : 2;
    const distance = levenshteinDistance(word, forbiddenWord);
    
    if (distance <= maxDistance && word.length >= forbiddenWord.length - 2) {
      return true;
    }
  
    for (const variation of variations) {
      if (variation.length >= 3) {
        const variationDistance = levenshteinDistance(word, variation);
        if (variationDistance <= maxDistance && word.length >= variation.length - 2) {
          return true;
        }
      }
    }
  }
  
  
  if (forbiddenWord.length >= 4 && word.length >= forbiddenWord.length - 1) {
    if (word.includes(forbiddenWord) && Math.abs(word.length - forbiddenWord.length) <= 2) {
      return true;
    }
  }
  

  if (forbiddenWord.length >= 3 && word.length > forbiddenWord.length + 2) {
    if (word.includes(forbiddenWord)) {
      return true;
    }
    

    for (const variation of variations) {
      if (variation.length >= 3 && word.includes(variation)) {
        return true;
      }
    }
    

    for (let i = 0; i <= word.length - forbiddenWord.length + 1; i++) {
      const substring = word.substring(i, i + forbiddenWord.length);
      if (levenshteinDistance(substring, forbiddenWord) <= 1) {
        return true;
      }
    }
  }
  
  return false;
};


export const checkForForbiddenWord = (text, forbiddenWord) => {
  if (!forbiddenWord || !text) return false;
  
  
  const cleanText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cleanWord = forbiddenWord.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  

  const words = cleanText.split(/\W+/).filter(word => word.length > 0);
  
  const wordVariations = generateWordVariations(cleanWord);
  

  for (const word of words) {
    if (checkWordSimilarity(word, cleanWord, wordVariations)) {
      return true;
    }
  }
  
  return false;
};
