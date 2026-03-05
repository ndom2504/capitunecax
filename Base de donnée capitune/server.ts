import express from 'express';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// ScraperAPI Key from user request
const SCRAPER_API_KEY = '624751bbf5ddc786bad6c4f31f50d41c';

// Initialize Gemini
// Note: In a real app, we would use process.env.GEMINI_API_KEY
// The platform injects this automatically.
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

// --- API Routes ---

// Proxy to ScraperAPI
app.post('/api/scrape', async (req, res) => {
  const { url, render = false } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const payload = {
      api_key: SCRAPER_API_KEY,
      url: url,
      render: render ? 'true' : 'false', // For JS rendering if needed
    };

    // Using ScraperAPI via simple GET request with params as per their docs/user snippet
    // The user snippet used params in requests.get.
    const response = await axios.get('https://api.scraperapi.com/', {
      params: payload,
    });

    res.send(response.data);
  } catch (error: any) {
    console.error('ScraperAPI error:', error.message);
    // Fallback or error
    res.status(500).json({ error: 'Failed to fetch data', details: error.message });
  }
});

// Generate Explanation Letter via Gemini
app.post('/api/generate-letter', async (req, res) => {
  const { profile, program, institution } = req.body;
  
  const ai = getGeminiClient();
  if (!ai) {
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }

  try {
    const prompt = `
      Agis comme un consultant expert en immigration canadienne.
      Rédige une lettre explicative pour une demande de permis d'études.
      
      Profil du candidat:
      ${JSON.stringify(profile)}
      
      Institution visée: ${institution}
      Programme: ${program}
      
      La lettre doit être professionnelle, convaincante, et expliquer pourquoi ce programme s'inscrit logiquement dans le parcours du candidat.
      Structure la lettre clairement avec Objet, Introduction, Projet d'études, Capacité financière, et Conclusion.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ letter: response.text });
  } catch (error: any) {
    console.error('Gemini error:', error);
    res.status(500).json({ error: 'Failed to generate letter' });
  }
});

// Chat with Capi
app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;
  
  const ai = getGeminiClient();
  if (!ai) {
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }

  try {
    const systemInstruction = `Tu es Capi, l'assistant intelligent de l'application Capitune. 
    Ton but est d'aider les utilisateurs dans leur projet d'immigration au Canada (études, travail, logement).
    Sois encourageant, précis et structuré. 
    Si l'utilisateur pose une question sur les démarches, réfère-toi aux étapes officielles (trouver école, admission, CAQ, permis d'études).
    `;

    // Convert history to Gemini format if needed, or just send last message for simplicity in this demo
    // Ideally we use chat sessions.
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemInstruction
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to chat' });
  }
});


// --- Vite Middleware ---
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  // Serve static files in production
  // app.use(express.static('dist'));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
