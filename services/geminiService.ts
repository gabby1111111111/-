import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from '../types';

interface ImageAttachment {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

export const analyzeProfile = async (inputText: string, images: string[] = []): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `You are an expert Social Media Consultant specializing in the Chinese market (Xiaohongshu/Red and Douyin/TikTok). 
  Your goal is to analyze user-provided profile descriptions, links, SCREENSHOTS, and RAW JSON DATA (from crawlers/spiders like Spider_XHS) to provide a high-level strategic audit.
  
  Analyze the input (text, images, and data) for:
  1. Visual Aesthetics: (If images are provided) Analyze the profile grid, cover images, font choices, and color palette.
  2. Data Extraction: 
     - Read visible stats (followers, likes, saves) from screenshots.
     - Parse provided JSON metrics. Specifically look for keys from Spider_XHS such as:
       - 'liked_count', 'collected_count', 'comment_count', 'share_count' (Interaction metrics)
       - 'tags' (Content niche)
       - 'title', 'desc' (Copywriting style)
       - 'note_type' (Video vs Image/Normal)
  3. Content style and niche based on titles and descriptions.
  4. Potential audience based on tags and interaction types.
  
  INTERPRETATION RULES:
  - If you see high 'collected_count' (saves) relative to 'liked_count', emphasizes educational/useful value.
  - If 'liked_count' is high but 'collected_count' is low, emphasizes emotional value or aesthetic.
  - Use 'tags' to determine the exact niche (e.g., "OOTD", "Skincare", "Coding").

  Provide actionable advice on:
  1. Content pillars (what to post).
  2. Growth hacks specific to the platform algorithms.
  3. Audience persona refinement.
  4. Visual Improvement: specific advice on how to improve the look of the feed.
  
  Return the response in a structured JSON format suitable for a dashboard.
  Estimate 'growthMetrics' based on the potential of the niche (scale 0-100).`;

  // Prepare content parts
  const parts: any[] = [{ text: inputText }];
  
  // Add images to parts if they exist
  images.forEach(base64Data => {
    // Assuming base64Data comes in as "data:image/png;base64,..." format, we need to strip the prefix
    const match = base64Data.match(/^data:(.+);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2]
        }
      });
    }
  });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts }, // Pass parts array containing text and images
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "A professional executive summary of the account status, referencing visual elements if visible." },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
          contentStrategy: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                examples: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          },
          audiencePersona: {
            type: Type.OBJECT,
            properties: {
              ageRange: { type: Type.STRING },
              interests: { type: Type.ARRAY, items: { type: Type.STRING } },
              painPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          },
          growthMetrics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                value: { type: Type.NUMBER },
                color: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  try {
    return JSON.parse(text) as AnalysisResult;
  } catch (e) {
    console.error("Failed to parse JSON", text);
    throw new Error("Failed to parse analysis results.");
  }
};