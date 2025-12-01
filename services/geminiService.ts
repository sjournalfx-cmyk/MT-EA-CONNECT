import { GoogleGenAI, Type } from "@google/genai";
import { Trade, AnalysisResult } from '../types';

// NOTE: In a real production app, this call should go through your backend 
// to protect your API Key.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeJournal = async (trades: Trade[]): Promise<AnalysisResult> => {
  // Take last 20 trades for analysis to save tokens/context window if list is huge
  const recentTrades = trades.slice(0, 30);
  
  const prompt = `
    Analyze this trading journal data. Provide a coaching summary.
    Data: ${JSON.stringify(recentTrades.map(t => ({
      s: t.symbol,
      t: t.type,
      p: t.profit,
      l: t.lots
    })))}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "A paragraph summarizing performance style and main observation." },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 3 things the trader is doing well." },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 3 things to improve." },
            grade: { type: Type.STRING, description: "A letter grade (A, B, C, D, F) based on profitability and consistency." }
          },
          required: ["summary", "strengths", "weaknesses", "grade"]
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as AnalysisResult;
    }
    throw new Error("No response text");

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      summary: "Could not generate AI analysis at this time.",
      strengths: [],
      weaknesses: [],
      grade: "N/A"
    };
  }
};