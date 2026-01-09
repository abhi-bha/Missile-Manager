import { GoogleGenAI, Type } from "@google/genai";
import { DamageReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDamageReport = async (locationName: string): Promise<Omit<DamageReport, 'missionId'>> => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Generate a fictional, sci-fi style 'Kinetic Impact Assessment Report' for a simulated missile strike on ${locationName}.
    The tone should be clinical, military, and strategic.
    Do not mention real-world political conflicts. Treat this as a physics/strategy simulation.
    
    Provide the output in strict JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            location: { type: Type.STRING },
            impactRadius: { type: Type.STRING, description: "e.g., '15.4 km'" },
            casualtyEstimate: { type: Type.STRING, description: "Simulation estimate, e.g., 'High probability of civilian displacement'" },
            infrastructureDamage: { type: Type.STRING, description: "Critical systems affected" },
            environmentalImpact: { type: Type.STRING },
            summary: { type: Type.STRING, description: "A brief tactical summary of the event." },
          },
          required: ["location", "impactRadius", "casualtyEstimate", "infrastructureDamage", "environmentalImpact", "summary"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as Omit<DamageReport, 'missionId'>;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      location: locationName,
      impactRadius: "Unknown",
      casualtyEstimate: "Data unavailable",
      infrastructureDamage: "Assessment failed",
      environmentalImpact: "Unknown",
      summary: "Communication with assessment satellite failed. Manual review required.",
    };
  }
};