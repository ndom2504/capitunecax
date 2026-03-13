import { GoogleGenAI, Type } from "@google/genai";
import { DLI } from "../types";

// Dans un composant statique front-end (Astro React/Vite), on devrait utiliser : import.meta.env.PUBLIC_GEMINI_API_KEY
// ou passer via une route API backend.
// Ici, pour la portabilité rapide, on lit import.meta.env
const apiKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY || (import.meta.env && import.meta.env.PUBLIC_GEMINI_API_KEY) : (import.meta.env && import.meta.env.PUBLIC_GEMINI_API_KEY);

export const geminiService = {
  async generateResponse(prompt: string, context?: string) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing");
    
    const ai = new GoogleGenAI({ apiKey });
    const model = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: `Tu es l'assistant IA de CAPITUNE, une plateforme d'immigration canadienne. 
            Réponds de manière professionnelle, structurée et encourageante. 
            Contexte actuel: ${context || "Général"}
            
            Question de l'utilisateur: ${prompt}` }
          ]
        }
      ],
      config: {
        temperature: 0.7,
      }
    });

    const response = await model;
    return response.text;
  },

  async searchDLI(query: string, province?: string): Promise<DLI[]> {
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing");
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: `Recherche des établissements d'enseignement désignés (DLI) au Canada.
            Critères: ${query} ${province ? `dans la province de ${province}` : ""}
            Retourne une liste de 10 établissements réels avec leurs informations exactes.
            Chaque établissement doit avoir: id (unique), name, province, type (Université/Collège), et url officielle.` }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              province: { type: Type.STRING },
              type: { type: Type.STRING },
              url: { type: Type.STRING }
            },
            required: ["id", "name", "province", "type", "url"]
          }
        },
        tools: [{ googleSearch: {} }]
      }
    });

    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Failed to parse DLI search results", e);
      return [];
    }
  },

  async searchJobs(query: string, location?: string, page: number = 1) {
    // Scrape réel du Guichet Emplois via /api/jobs (ScraperAPI -> jobbank.gc.ca)
    const params = new URLSearchParams();
    const q = (!query || query === "*") ? "" : query;
    params.set("q", q);
    if (location) params.set("location", location);
    params.set("page", page.toString());
    params.set("_t", Date.now().toString());

    const res = await fetch(`/api/jobs?${params.toString()}`);
    if (!res.ok) {
      console.error("[searchJobs] /api/jobs HTTP", res.status);
      return [];
    }
    const data = await res.json();
    if (Array.isArray(data)) return data;
    console.error("[searchJobs] réponse inattendue:", data);
    return [];
  },

  async analyzeCVFromFile(fileBase64: string, mimeType: string) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing");
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: fileBase64,
                mimeType: mimeType
              }
            },
            { text: `Analyse ce CV et retourne un diagnostic complet au format JSON.
            Le JSON doit suivre ce schéma:
            {
              "name": "Nom complet",
              "compatibility_score": 0-100,
              "experience_years": nombre,
              "top_skills": ["skill1", "skill2", ...],
              "recommended_programs": ["programme1", ...],
              "suggestions": "Conseils pour améliorer le profil"
            }` }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse CV analysis from file", e);
      return null;
    }
  },

  async optimizeCV(cvText: string, suggestions?: string, targetJob?: string, model: string = "gemini-3-flash-preview") {
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing");
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          parts: [
            { text: `Transforme et optimise ce CV pour le marché canadien.
            ${suggestions ? `Tiens compte de ces suggestions: ${suggestions}` : ""}
            ${targetJob ? `Cible ce poste: ${targetJob}` : ""}
            
            Retourne EXCLUSIVEMENT un objet JSON structuré comme suit:
            {
              "contact": { "name": "", "title": "", "email": "", "phone": "", "location": "", "linkedin": "" },
              "profile": "Résumé professionnel percutant",
              "experience": [
                { "company": "", "role": "", "period": "", "location": "", "achievements": ["", ""] }
              ],
              "skills": { "technical": [""], "soft": [""] },
              "education": [
                { "school": "", "degree": "", "year": "", "location": "" }
              ],
              "languages": [""]
            }
            
            CV original:
            ${cvText}` }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse optimized CV JSON", e);
      return null;
    }
  },

  async analyzeCV(cvText: string) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing");
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: `Analyse ce CV pour une immigration au Canada. 
            Extrais les informations clés et évalue la compatibilité avec les programmes canadiens (Entrée Express, PNP, etc.).
            Retourne un JSON structuré.
            
            CV: ${cvText}` }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            experience_years: { type: Type.NUMBER },
            top_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommended_programs: { type: Type.ARRAY, items: { type: Type.STRING } },
            compatibility_score: { type: Type.NUMBER },
            suggestions: { type: Type.STRING }
          },
          required: ["name", "experience_years", "top_skills", "recommended_programs", "compatibility_score"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  }
};
