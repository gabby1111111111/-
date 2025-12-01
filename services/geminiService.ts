import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, HardStats } from '../types';

interface ImageAttachment {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

// Helper to extract stats from raw Spider_XHS input text
const calculateRealStats = (text: string): HardStats => {
  const stats: HardStats = {
    totalNotes: 0,
    totalLikes: 0,
    avgLikes: 0,
    maxLikes: 0,
    totalCollects: 0,
    topNote: { title: "暂无数据", likes: 0, type: "未知" }
  };

  // Find all JSON blocks that look like note data
  // The input usually has lines like {"note_id": ...}
  const lines = text.split('\n');
  const notes = [];

  for (const line of lines) {
    if (line.trim().startsWith('{') && line.includes('"liked_count"')) {
      try {
        const cleanLine = line.trim();
        const note = JSON.parse(cleanLine);
        notes.push(note);
      } catch (e) {
        // ignore malformed lines
      }
    }
  }

  stats.totalNotes = notes.length;

  if (stats.totalNotes > 0) {
    let maxLikeNote = null;

    notes.forEach(n => {
      const likes = parseInt(n.liked_count || "0", 10);
      const collects = parseInt(n.collected_count || "0", 10);
      
      stats.totalLikes += isNaN(likes) ? 0 : likes;
      stats.totalCollects += isNaN(collects) ? 0 : collects;

      if (likes > stats.maxLikes) {
        stats.maxLikes = likes;
        maxLikeNote = n;
      }
    });

    stats.avgLikes = Math.round(stats.totalLikes / stats.totalNotes);
    
    if (maxLikeNote) {
      // @ts-ignore
      stats.topNote = {
        // @ts-ignore
        title: maxLikeNote.title || "无标题",
        // @ts-ignore
        likes: stats.maxLikes,
        // @ts-ignore
        type: maxLikeNote.note_type || "图文"
      };
    }
  }

  return stats;
};

export const generateCustomTemplate = async (creatorDNA: any, topic: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `你是一位精通小红书和抖音爆款逻辑的内容策略专家。
  当前创作者的人设 (Creator DNA) 为：
  - 称号: ${creatorDNA.title}
  - 标签: ${creatorDNA.tags.join(', ')}
  
  用户想写一篇关于 "${topic}" 的内容。
  
  请结合创作者的人设风格（比如如果是二次元博主，标题要更有梗；如果是干货博主，要更直接），生成：
  1. 3个极具吸引力的爆款标题（包含表情符号）。
  2. 1个详细的文案写作大纲（结构）。
  
  请仅返回纯 JSON 格式，不要包含 Markdown 标记。格式如下：
  {
    "titles": ["标题1", "标题2", "标题3"],
    "structure": "开头... -> 中间... -> 结尾..."
  }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [{ text: "请生成策略" }] },
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json"
    }
  });

  const text = response.text || "{}";
  const cleanedText = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  return JSON.parse(cleanedText);
};

export const analyzeProfile = async (inputText: string, images: string[] = []): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 1. Calculate Real Stats first
  const hardStats = calculateRealStats(inputText);
  const statsContext = hardStats.totalNotes > 0 ? `
  **【真实数据指标 (Hard Stats)】** (请基于这些真实数据进行分析，不要编造):
  - 总笔记数: ${hardStats.totalNotes}
  - 总点赞数: ${hardStats.totalLikes}
  - 平均点赞: ${hardStats.avgLikes}
  - 最高赞笔记: "${hardStats.topNote.title}" (获赞: ${hardStats.topNote.likes}, 类型: ${hardStats.topNote.type})
  - 总收藏数: ${hardStats.totalCollects}
  ` : "暂无结构化JSON数据，请基于文本描述估算。";

  const systemInstruction = `你是一位精通中国社交媒体（小红书、抖音）的顶级内容策略专家。你的特长是挖掘创作者的独特个性（Creator DNA）并提供极其落地、可复制的爆款模版。

  ${statsContext}

  **分析目标：**
  请分析用户提供的爬虫数据（Spider_XHS JSON），这通常包含大量具体的笔记标题、标签和互动数据。
  
  **核心任务 (Critical Tasks)：**
  
  1.  **定义“创作者 DNA” (Creator DNA)**：
      *   不要只说“二次元博主”。
      *   请精准识别具体的 fandom (粉丝圈层)，例如：如果看到“战锤/帝皇”，这就是“硬核战锤梦女”；如果看到“Karina/Sana”，这是“Kpop女团颜粉”；如果看到“SillyTavern/酒馆”，这是“AI情感向玩家”。
      *   将这些复杂的成分融合，定义一个独特的“赛道人设标签”（例如：“跨次元赛博恋爱学家”）。

  2.  **提供“实操爆款模版” (Actionable Content Strategy)**：
      *   **拒绝废话**。不要说“提高内容质量”这种空话。
      *   **必须提供**：
          *   **标题公式**：可以直接填空的标题（如：“和[角色名]谈恋爱的第N天...”）。
          *   **文案结构**：具体的写作骨架（如：“痛点引入 -> 情绪铺垫 -> 反转结局”）。
      *   针对账号表现最好的内容类型（根据 Hard Stats 中的最高赞笔记）来定制模版。

  3.  **数据驱动的 SWOT**：
      *   结合计算出的“平均点赞”和“最高赞”来分析。比如：平均点赞低但偶尔有爆款，说明“稳定性不足但有爆款潜力”。

  **输出要求：**
  *   **语言**：简体中文 (Simplified Chinese)。
  *   **Tone**：专业、犀利、懂行（使用圈内术语，如“梦女”、“同担”、“吃谷”、“OOC”等）。

  请返回严格符合 Schema 的 JSON 数据。`;

  // Prepare content parts
  const parts: any[] = [{ text: inputText }];
  
  // Add images to parts if they exist
  images.forEach(base64Data => {
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
    contents: { parts },
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "高度个性化的账号诊断摘要。" },
          creatorDNA: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "独特的人设定位标签，如'跨次元赛博恋爱学家'。" },
                tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "具体的圈层标签，如'战锤40K', 'Kpop', 'AI工具'。" },
                description: { type: Type.STRING, description: "对该独特人设的简短描述。" }
            }
          },
          strategicVerdict: { type: Type.STRING, description: "基于真实数据的战略定调。" },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
          contentStrategy: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING, description: "内容类型，如'沉浸式梦女日常'。" },
                titleTemplate: { type: Type.STRING, description: "可填空的爆款标题模版。" },
                structure: { type: Type.STRING, description: "具体的文案写作结构。" },
                keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
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
          },
          metricsAnalysis: { type: Type.STRING }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  try {
    let jsonResult: AnalysisResult;
    
    // Robust extraction to handle potential markdown fences
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonString = text.substring(firstBrace, lastBrace + 1);
      jsonResult = JSON.parse(jsonString);
    } else {
      const cleanedText = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      jsonResult = JSON.parse(cleanedText);
    }

    // Inject calculated Hard Stats into the result
    jsonResult.hardStats = hardStats;

    // --- SMART FALLBACKS & SANITIZATION ---
    // This ensures no section is ever empty, solving the "blank page" issue.
    const ensureArray = (arr: any) => Array.isArray(arr) ? arr : [];
    
    jsonResult.strengths = ensureArray(jsonResult.strengths);
    jsonResult.weaknesses = ensureArray(jsonResult.weaknesses);
    jsonResult.opportunities = ensureArray(jsonResult.opportunities);
    jsonResult.contentStrategy = ensureArray(jsonResult.contentStrategy);
    jsonResult.growthMetrics = ensureArray(jsonResult.growthMetrics);
    
    if (jsonResult.creatorDNA) {
        jsonResult.creatorDNA.tags = ensureArray(jsonResult.creatorDNA.tags);
    } else {
        // DNA Fallback
        jsonResult.creatorDNA = {
            title: "多元兴趣创作者",
            tags: ["生活分享", "兴趣爱好"],
            description: "账号内容较为多元，暂未形成极具辨识度的单一垂直人设，具有较大的探索空间。"
        };
    }

    // Content Strategy Fallback - The "Copy & Paste" Templates
    if (jsonResult.contentStrategy.length === 0) {
        jsonResult.contentStrategy = [
            {
                category: "沉浸式梦女日常",
                titleTemplate: "和[角色名]谈恋爱的第[N]天，他竟然...",
                structure: "场景描述(带入感) -> 互动细节(甜/虐) -> 结尾提问(你们觉得呢?)",
                keywords: ["乙女向", "沉浸式", "纸片人老公"]
            },
            {
                category: "AI工具整活",
                titleTemplate: "用AI复活[角色名]！这也太真实了吧？！",
                structure: "痛点(意难平) -> 展示AI效果(语音/对话) -> 教程引流(想学的看置顶)",
                keywords: ["AI工具", "SillyTavern", "黑科技"]
            },
            {
                category: "二次元线下集邮",
                titleTemplate: "在[地点/漫展]偶遇[角色名]！这也太还原了...",
                structure: "现场氛围(视频/多图) -> Cose互动(发糖) -> 坐标引导",
                keywords: ["漫展", "Cosplay", "集邮"]
            }
        ];
    }

    // Audience Persona Fallback
    if (!jsonResult.audiencePersona || !jsonResult.audiencePersona.ageRange) {
        jsonResult.audiencePersona = { 
            ageRange: '18-24岁 (Z世代)', 
            interests: ["ACG文化", "Kpop", "情感共鸣", "高颜值"], 
            painPoints: ["寻找同好", "情感寄托", "审美疲劳"] 
        };
    } else {
        jsonResult.audiencePersona.interests = ensureArray(jsonResult.audiencePersona.interests);
        jsonResult.audiencePersona.painPoints = ensureArray(jsonResult.audiencePersona.painPoints);
    }

    // SWOT Fallback
    if (jsonResult.strengths.length === 0) jsonResult.strengths = ["选题具有一定的垂直潜力", "视觉风格较为统一"];
    if (jsonResult.weaknesses.length === 0) jsonResult.weaknesses = ["爆款内容可复制性弱", "互动率有待提升"];

    // Growth Metrics Fallback (Radar Chart)
    if (jsonResult.growthMetrics.length === 0) {
      jsonResult.growthMetrics = [
        { label: '人设辨识度', value: 70, color: '#6366f1' },
        { label: '粉丝粘性', value: 65, color: '#6366f1' },
        { label: '变现潜力', value: 55, color: '#6366f1' },
        { label: '内容垂直度', value: 75, color: '#6366f1' },
        { label: '视觉审美', value: 80, color: '#6366f1' },
      ];
    }

    return jsonResult;
  } catch (e) {
    console.error("Failed to parse JSON", text, e);
    throw new Error("数据解析失败，请确保输入数据格式正确。");
  }
};