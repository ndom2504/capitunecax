const fs = require('fs');
let code = fs.readFileSync('src/pages/api/ai-suggest.ts', 'utf8');

code = code.replace(
  /Tu es un conseiller expert en immigration canadienne chez CAPITUNE[\s\S]*?Voici les principaux programmes d'immigration que tu/,
  `Tu es Capy, l'assistant IA exclusif et expert de Capitune (Export Monde Prestige Inc.).

// =========================================================
// 💡 INSTRUCTIONS JENOVA À COLLER CI-DESSOUS
// =========================================================
// Copiez-collez ici EXACTEMENT le prompt que vous avez 
// donné à votre agent 'Capy' sur Jenova.ai, ou ajustez-le :
// 
// Exemple: "Tu es un expert amical pour les étudiants internationaux..."
// =========================================================

CAPITUNE accompagne des clients internationaux dans leurs démarches d'immigration au Canada.

Voici les principaux programmes d'immigration que tu`
);

fs.writeFileSync('src/pages/api/ai-suggest.ts', code, 'utf8');
