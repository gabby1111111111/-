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

  let notes: any[] = [];

  // Strategy 1: Try parsing the whole text as a JSON structure
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      notes = parsed;
    } else if (typeof parsed === 'object' && parsed !== null) {
      // Handle single object or wrapped response
      if (parsed.data && Array.isArray(parsed.data)) {
        notes = parsed.data;
      } else {
        notes = [parsed];
      }
    }
  } catch (e) {
    // Strategy 2: Line-by-line parsing (NDJSON / Log format)
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Remove trailing comma if present (common in copied JS arrays)
      const cleanLine = trimmed.replace(/,$/, '');
      
      if (cleanLine.startsWith('{') || cleanLine.startsWith('[')) {
        try {
          const parsed = JSON.parse(cleanLine);
          if (Array.isArray(parsed)) {
            notes.push(...parsed);
          } else {
            notes.push(parsed);
          }
        } catch (e2) {
          // ignore malformed lines
        }
      }
    }

    // Strategy 3: Regex extraction (Fallback for mixed text/messy dumps)
    if (notes.length === 0) {
      // Look for JSON-like objects {...}
      const jsonRegex = /\{(?:[^{}]|"(?:\\.|[^\\"])*")*\}/g;
      const matches = text.match(jsonRegex);
      if (matches) {
        for (const match of matches) {
           try {
             const parsed = JSON.parse(match);
             // Basic heuristic check to ensure it's a note object
             if (parsed.liked_count !== undefined || parsed.note_id || parsed.display_title) {
                notes.push(parsed);
             }
           } catch(e3) {}
        }
      }
    }
  }

  // Deduplicate notes based on note_id if available
  const uniqueNotes = new Map();
  notes.forEach(n => {
    if (n.note_id) {
        uniqueNotes.set(n.note_id, n);
    } else {
        // If no ID, use a random key to keep it (or index)
        uniqueNotes.set(Math.random(), n);
    }
  });
  
  const validNotes = Array.from(uniqueNotes.values());
  stats.totalNotes = validNotes.length;

  if (stats.totalNotes > 0) {
    let maxLikeNote = null;

    validNotes.forEach(n => {
      // Handle string or number formats
      const likes = typeof n.liked_count === 'string' ? parseInt(n.liked_count, 10) : (n.liked_count || 0);
      const collects = typeof n.collected_count === 'string' ? parseInt(n.collected_count, 10) : (n.collected_count || 0);
      
      const safeLikes = isNaN(likes) ? 0 : likes;
      const safeCollects = isNaN(collects) ? 0 : collects;

      stats.totalLikes += safeLikes;
      stats.totalCollects += safeCollects;

      if (safeLikes > stats.maxLikes) {
        stats.maxLikes = safeLikes;
        maxLikeNote = n;
      }
    });

    stats.avgLikes = Math.round(stats.totalLikes / stats.totalNotes);
    
    if (maxLikeNote) {
      // @ts-ignore
      stats.topNote = {
        // @ts-ignore
        title: maxLikeNote.display_title || maxLikeNote.title || "无标题",
        // @ts-ignore
        likes: stats.maxLikes,
        // @ts-ignore
        type: maxLikeNote.type || maxLikeNote.note_type || "图文"
      };
    }
  }

  return stats;
};

export const generateCustomTemplate = async (creatorDNA: any, topic: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `你是一位精通小红书(RedNote)和抖音爆款逻辑的内容策略专家。
  当前创作者的人设 (Creator DNA) 为：
  - 称号: ${creatorDNA.title}
  - 标签: ${creatorDNA.tags.join(', ')}
  
  用户想写一篇关于 "${topic}" 的内容。
  
  请结合创作者的人设风格，生成：
  1. 3个极具吸引力的爆款标题（必须包含Emoji，符合小红书社区氛围，如使用"狠狠","绝绝子","避雷","真香"等情绪词）。
  2. 1个详细的文案写作大纲（结构），包含具体的段落引导。
  
  请仅返回纯 JSON 格式。`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [{ text: `请基于主题"${topic}"生成策略` }] },
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json"
    }
  });

  const text = response.text || "{}";
  const cleanedText = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  return JSON.parse(cleanedText);
};

export const analyzeProfile = async (inputText: string, images: string[] = [], userGoal: string = ""): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 1. Calculate Real Stats first
  const hardStats = calculateRealStats(inputText);
  
  let statsContext = "暂无结构化JSON数据，请基于文本描述估算。";
  if (hardStats.totalNotes > 0) {
      statsContext = `
      **【真实数据指标 (Hard Stats)】** (请基于这些真实数据进行分析，绝对不要编造数据):
      - 样本笔记数: ${hardStats.totalNotes}
      - 总互动(赞+藏): ${hardStats.totalLikes + hardStats.totalCollects}
      - 平均点赞: ${hardStats.avgLikes}
      - 最高赞笔记: "${hardStats.topNote.title}" (获赞: ${hardStats.topNote.likes}, 类型: ${hardStats.topNote.type})
      - 爆款率: ${Math.round((hardStats.totalNotes > 0 ? (hardStats.totalNotes * 0.1) : 0))}% (假设前10%为爆款)
      `;
  }

  const systemInstruction = `你是一位精通中国社交媒体（小红书、抖音）的顶级内容策略架构师。你的特长是挖掘创作者的独特个性（Creator DNA）并提供极其落地、可复制的爆款模版。

  ${statsContext}
  
  **用户自定义的未来发展方向/目标:**
  "${userGoal || '用户未特别指定，请完全基于数据分析'}"

  **核心任务 (Critical Tasks)：**
  
  1.  **定义“创作者 DNA” (Creator DNA)**：
      *   请精准识别具体的 fandom (粉丝圈层) 或垂直赛道。
      *   例如：看到“减脂/帕梅拉”是“自律逆袭党”；看到“大厂/面试”是“职场搞钱流”。

  2.  **【重点】挖掘“两个最具潜力方向” (Promising Directions)**：
      *   请提供 **2** 个不同的“北极星指标”方向（必须在 promisingDirections 数组中返回两个对象）：
          *   **方向 A（顺势而为）**：基于用户目前数据表现最好（如高赞笔记）的内容，做深化和放大。
          *   **方向 B（目标导向转型）**：必须深度结合用户输入的“未来目标” ("${userGoal}")。分析用户目前的差距，并给出如何转型去达成该目标的路径。如果用户没有输入目标，则提供一个差异化突围方向。
      *   **Rationale (理由)**：必须引用数据或具体内容特征来支持你的建议。
      *   **Action Plan (行动)**：给出 3-4 个具体的下一步动作。

  3.  **提供“实操爆款模版” (Actionable Content Strategy)**：
      *   拒绝正确的废话。必须提供标题公式、文案结构和SEO关键词。

  4.  **【关键优化】数据驱动的 SWOT 审计**：
      *   **内容引用要求**：每一条 Strengths/Weaknesses **必须引用用户具体的笔记标题、关键词或内容细节**作为证据。例如："优势：情绪价值拉满（证据：关于'失恋'的那篇笔记...）"。严禁泛泛而谈。
      *   **评分策略 (Score Optimistically)**：请依据**潜在爆发力 (Potential)** 打分。
          *   不要吝啬分数！如果方向正确或内容有亮点，请给予 **75-95** 的高分。
          *   不要因为目前粉丝少就给低分。我们是挖掘潜力的工具。

  5.  **【关键】雷达图数据 (Growth Metrics)**：
      *   **必须**生成 \`growthMetrics\` 数组，包含以下 5 个维度的对象 (label, value, color)：
          1. "人设辨识度"
          2. "粉丝粘性"
          3. "变现潜力"
          4. "内容垂直度"
          5. "视觉审美"
      *   分数请在 **60-95** 之间，根据实际情况评估，不要给过低的分数，除非真的很差。

  **输出 tone**：
  *   **语言**：简体中文。
  *   **风格**：专业、犀利、鼓励性强、懂行（熟练使用“小红书黑话”）。

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
                tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "具体的圈层标签。" },
                description: { type: Type.STRING, description: "对该独特人设的简短描述。" }
            }
          },
          promisingDirections: {
            type: Type.ARRAY,
            description: "必须包含两个方向：1. 基于数据的延伸；2. 结合用户目标的转型建议。",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "方向名称，如'反差感职场穿搭'。" },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "方向的简短标签，如'高互动','变现强'。" },
                    description: { type: Type.STRING, description: "详细说明这个方向是什么。" },
                    rationale: { type: Type.STRING, description: "必须引用具体笔记或数据。" },
                    actionPlan: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4个具体的下一步执行动作。" }
                }
            }
          },
          strategicVerdict: { type: Type.STRING, description: "基于真实数据的战略定调，一针见血。" },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "引用具体笔记内容的优势分析。" },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "引用具体笔记内容的劣势分析。" },
          opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
          swotAnalysisStats: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                score: { type: Type.NUMBER, description: "潜力评分，请给高一点(75-95)" },
                color: { type: Type.STRING }
              }
            }
          },
          contentStrategy: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING, description: "内容类型，如'沉浸式梦女日常'。" },
                titleTemplate: { type: Type.STRING, description: "可填空的爆款标题模版，含Emoji。" },
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
          audienceStats: {
            type: Type.OBJECT,
            properties: {
                ageDistribution: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            value: { type: Type.NUMBER }
                        }
                    }
                },
                interestComposition: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            value: { type: Type.NUMBER },
                            color: { type: Type.STRING }
                        }
                    }
                }
            }
          },
          growthMetrics: {
            type: Type.ARRAY,
            description: "必须包含: 人设辨识度, 粉丝粘性, 变现潜力, 内容垂直度, 视觉审美",
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
    const ensureArray = (arr: any) => Array.isArray(arr) ? arr : [];
    
    jsonResult.strengths = ensureArray(jsonResult.strengths);
    jsonResult.weaknesses = ensureArray(jsonResult.weaknesses);
    jsonResult.opportunities = ensureArray(jsonResult.opportunities);
    jsonResult.contentStrategy = ensureArray(jsonResult.contentStrategy);
    jsonResult.growthMetrics = ensureArray(jsonResult.growthMetrics);
    
    // Fallback for Promising Directions (Handle both old singular and new array structure for safety)
    // @ts-ignore
    if (jsonResult.promisingDirection && !jsonResult.promisingDirections) {
        // @ts-ignore
        jsonResult.promisingDirections = [jsonResult.promisingDirection];
    }

    if (!jsonResult.promisingDirections || jsonResult.promisingDirections.length === 0) {
        jsonResult.promisingDirections = [
            {
                title: "垂直化内容深耕",
                description: "根据当前内容分析，建议聚焦于互动率最高的内容类型，建立更鲜明的个人IP。",
                rationale: "数据分析显示，垂直度高的账号更容易获得算法推荐。",
                tags: ["稳健", "高互动"],
                actionPlan: ["梳理过往爆款笔记的共同点", "固定发布频率", "优化封面"]
            },
            {
                title: userGoal ? "目标导向转型" : "差异化突围",
                description: userGoal ? `基于你的目标 "${userGoal}"，建议尝试结合现有优势进行软转型。` : "尝试新的热门话题切入。",
                rationale: "结合市场趋势与你的个人特质。",
                tags: ["潜力", "蓝海"],
                actionPlan: ["尝试新的选题", "蹭热点", "增加视频内容"]
            }
        ];
    } else {
        // Ensure sub-arrays exist
        jsonResult.promisingDirections.forEach(pd => {
            pd.actionPlan = ensureArray(pd.actionPlan);
            pd.tags = ensureArray(pd.tags);
        });
    }

    if (jsonResult.creatorDNA) {
        jsonResult.creatorDNA.tags = ensureArray(jsonResult.creatorDNA.tags);
    } else {
        jsonResult.creatorDNA = {
            title: "多元兴趣创作者",
            tags: ["生活分享", "兴趣爱好"],
            description: "账号内容较为多元，暂未形成极具辨识度的单一垂直人设。"
        };
    }

    if (jsonResult.contentStrategy.length === 0) {
        // Safe default strategies
        jsonResult.contentStrategy = [
            {
                category: "通用爆款公式",
                titleTemplate: "😭为什么没有人告诉我...[痛点]！后悔没早看",
                structure: "痛点场景 -> 解决方案 -> 情绪价值 -> 引导关注",
                keywords: ["干货", "避雷", "经验分享"]
            }
        ];
    }

    if (!jsonResult.audiencePersona || !jsonResult.audiencePersona.ageRange) {
        jsonResult.audiencePersona = { 
            ageRange: '18-24岁', 
            interests: ["时尚", "生活", "娱乐"], 
            painPoints: ["信息差", "选择困难"] 
        };
    } else {
        jsonResult.audiencePersona.interests = ensureArray(jsonResult.audiencePersona.interests);
        jsonResult.audiencePersona.painPoints = ensureArray(jsonResult.audiencePersona.painPoints);
    }

    // Improve SWOT stats fallback to higher scores
    if (!jsonResult.swotAnalysisStats || jsonResult.swotAnalysisStats.length === 0) {
        jsonResult.swotAnalysisStats = [
            { label: '内容力', score: 88, color: '#10b981' },
            { label: '人设力', score: 85, color: '#3b82f6' },
            { label: '变现力', score: 75, color: '#f59e0b' },
            { label: '潜力值', score: 92, color: '#ef4444' }
        ];
    }

    if (!jsonResult.audienceStats) {
        jsonResult.audienceStats = {
            ageDistribution: [
                { name: '<18', value: 15 },
                { name: '18-24', value: 50 },
                { name: '25-30', value: 25 },
                { name: '30+', value: 10 }
            ],
            interestComposition: [
                { name: '主兴趣', value: 50, color: '#8b5cf6' },
                { name: '副兴趣', value: 30, color: '#ec4899' },
                { name: '其他', value: 20, color: '#94a3b8' }
            ]
        };
    }

    // Default Growth Metrics for Radar (Ensure minimum 5)
    if (jsonResult.growthMetrics.length < 5) {
      jsonResult.growthMetrics = [
        { label: '人设辨识度', value: 80, color: '#6366f1' },
        { label: '粉丝粘性', value: 85, color: '#6366f1' },
        { label: '变现潜力', value: 70, color: '#6366f1' },
        { label: '内容垂直度', value: 75, color: '#6366f1' },
        { label: '视觉审美', value: 88, color: '#6366f1' },
      ];
    }

    return jsonResult;
  } catch (e) {
    console.error("Failed to parse JSON", text, e);
    throw new Error("AI生成的数据格式异常，请重试。");
  }
};